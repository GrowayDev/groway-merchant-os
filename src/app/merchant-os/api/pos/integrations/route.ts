import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountingStore } from '@/app/merchant-os/api/accounting/data';
import { randomUUID } from 'crypto';
import { getMerchantIdWithDevFallback } from '@/lib/auth-context';

// Helper to generate journal entry number
async function generateEntryNumber(): Promise<string> {
  const today = new Date();
  const prefix = `JE-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  
  // Get count of entries today
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));
  
  const count = await db.journalEntry.count({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });
  
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Deduct inventory for all items in an order
 * Creates StockMovement records for each deduction
 * Includes idempotency check to prevent duplicate processing
 */
export async function deductInventory(orderId: string, merchantId?: string) {
  try {
    // Check if inventory has already been deducted for this order (idempotency check)
    const existingMovements = await db.stockMovement.findMany({
      where: {
        referenceType: 'pos_order',
        referenceId: orderId,
        type: 'sale',
      },
    });

    if (existingMovements.length > 0) {
      console.log(`[INVENTORY] Order ${orderId} already has ${existingMovements.length} stock movements. Skipping duplicate deduction.`);
      return {
        success: true,
        skipped: true,
        reason: 'Inventory already deducted for this order',
        existingMovements: existingMovements.length,
      };
    }

    // Get the order with all items
    const order = await db.pOSOrder.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const results: Array<{
      itemName: string;
      success: boolean;
      previousStock?: number;
      newStock?: number;
      error?: string;
    }> = [];

    // Process each order item
    for (const item of order.items) {
      try {
        // Try to find product by menuItemId (SKU) or by name
        let product = null;
        
        if (item.menuItemId) {
          // Try to find by SKU first
          product = await db.product.findFirst({
            where: {
              OR: [
                { sku: item.menuItemId },
                { id: item.menuItemId },
              ],
            },
          });
        }

        // If not found, try to find by name matching
        if (!product) {
          product = await db.product.findFirst({
            where: {
              name: {
                equals: item.name,
              },
            },
          });
        }

        if (!product) {
          results.push({
            itemName: item.name,
            success: false,
            error: 'Product not found in inventory',
          });
          continue;
        }

        // Skip if product doesn't track inventory
        if (!product.trackInventory) {
          results.push({
            itemName: item.name,
            success: true,
            previousStock: product.currentStock,
            newStock: product.currentStock,
            error: 'Inventory tracking disabled for this product',
          });
          continue;
        }

        const previousStock = product.currentStock;
        const deductQuantity = item.quantity;
        const newStock = Math.max(0, previousStock - deductQuantity);

        // Update product stock
        await db.product.update({
          where: { id: product.id },
          data: {
            currentStock: newStock,
            lastSoldAt: new Date(),
            timesSold: { increment: item.quantity },
          },
        });

        // Create stock movement record
        const actualMerchantId = product.merchantId;
        const branchId = product.branchId || 'default-branch';

        await db.stockMovement.create({
          data: {
            id: randomUUID(),
            merchantId: actualMerchantId,
            branchId: branchId,
            productId: product.id,
            type: 'sale',
            quantity: -deductQuantity,
            previousStock: previousStock,
            newStock: newStock,
            unitCost: product.costPrice,
            totalValue: product.costPrice ? product.costPrice * deductQuantity : null,
            referenceType: 'pos_order',
            referenceId: orderId,
            reason: `Sale - Order ${order.orderNumber}`,
            performedByName: order.staffName || 'System',
            createdAt: new Date(),
          },
        });

        // Check for low stock alert
        if (newStock <= product.reorderPoint && newStock > 0) {
          console.log(`[INVENTORY ALERT] Low stock for ${product.name}: ${newStock} units remaining`);
        } else if (newStock === 0) {
          console.log(`[INVENTORY ALERT] Stock depleted for ${product.name}`);
        }

        results.push({
          itemName: item.name,
          success: true,
          previousStock,
          newStock,
        });
      } catch (itemError: any) {
        results.push({
          itemName: item.name,
          success: false,
          error: itemError.message || 'Failed to process item',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: failureCount === 0,
      processedItems: results.length,
      successCount,
      failureCount,
      results,
    };
  } catch (error: any) {
    console.error('Error deducting inventory:', error);
    return {
      success: false,
      error: error.message || 'Failed to deduct inventory',
    };
  }
}

/**
 * Create accounting journal entry for a completed sale
 * Debit: Cash/Bank Account (payment method)
 * Credit: Sales Revenue
 * Credit: VAT Payable (tax amount)
 * Includes idempotency check to prevent duplicate entries
 */
export async function createAccountingEntry(orderId: string, paymentId: string, merchantId?: string) {
  try {
    // Check if journal entry already exists for this order (idempotency check)
    const existingEntry = await db.journalEntry.findFirst({
      where: {
        sourceType: 'pos_sale',
        sourceId: orderId,
      },
    });

    if (existingEntry) {
      console.log(`[ACCOUNTING] Order ${orderId} already has journal entry ${existingEntry.entryNumber}. Skipping duplicate entry.`);
      return {
        success: true,
        skipped: true,
        reason: 'Journal entry already exists for this order',
        existingEntryId: existingEntry.id,
        existingEntryNumber: existingEntry.entryNumber,
      };
    }

    // Get the order
    const order = await db.pOSOrder.findUnique({
      where: { id: orderId },
      include: {
        payments: {
          where: { id: paymentId },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    const payment = order.payments[0];
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }

    // Get merchantId from auth context or use provided value
    const authMerchantId = getMerchantIdWithDevFallback(request);
    const actualMerchantId = merchantId || authMerchantId;
    
    if (!actualMerchantId) {
      return { success: false, error: 'Authentication required - merchantId not found in auth context' };
    }

    // Determine cash/bank account based on payment method
    let cashAccountCode = '1000'; // Default: Cash on Hand
    let cashAccountName = 'Cash on Hand';
    
    switch (payment.method) {
      case 'card':
        cashAccountCode = '1010'; // FNB Business Cheque
        cashAccountName = 'FNB Business Cheque';
        break;
      case 'mobile':
      case 'wallet':
        cashAccountCode = '1010'; // FNB Business Cheque (for electronic payments)
        cashAccountName = 'FNB Business Cheque';
        break;
      case 'cash':
      default:
        cashAccountCode = '1000'; // Cash on Hand
        cashAccountName = 'Cash on Hand';
        break;
    }

    const salesAccountCode = '4000'; // Sales Revenue
    const salesAccountName = 'Sales Revenue';
    const vatAccountCode = '2100'; // VAT Payable
    const vatAccountName = 'VAT Payable';

    // Calculate amounts
    const totalPaid = payment.amount;
    const taxAmount = order.taxAmount || 0;
    const subtotal = order.subtotal || (totalPaid - taxAmount);
    const tipAmount = payment.tipAmount || 0;

    // Create journal entry lines
    const lines: Array<{
      id: string;
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      lineDescription: string;
    }> = [];

    // Debit: Cash/Bank (total received including tips)
    lines.push({
      id: `JEL-${Date.now()}-1`,
      accountCode: cashAccountCode,
      accountName: cashAccountName,
      debit: totalPaid + tipAmount,
      credit: 0,
      lineDescription: `Payment received - ${payment.method.toUpperCase()} - Order ${order.orderNumber}`,
    });

    // Credit: Sales Revenue (subtotal)
    lines.push({
      id: `JEL-${Date.now()}-2`,
      accountCode: salesAccountCode,
      accountName: salesAccountName,
      debit: 0,
      credit: subtotal,
      lineDescription: `Sales - Order ${order.orderNumber}`,
    });

    // Credit: VAT Payable (if applicable)
    if (taxAmount > 0) {
      lines.push({
        id: `JEL-${Date.now()}-3`,
        accountCode: vatAccountCode,
        accountName: vatAccountName,
        debit: 0,
        credit: taxAmount,
        lineDescription: `VAT collected - Order ${order.orderNumber}`,
      });
    }

    // Handle tips separately if present
    if (tipAmount > 0) {
      // Tip is already included in the debit to cash/bank
      // Credit tips to a separate account (or could be to service charge income)
      lines.push({
        id: `JEL-${Date.now()}-4`,
        accountCode: '4020', // Service Revenue
        accountName: 'Service Revenue',
        debit: 0,
        credit: tipAmount,
        lineDescription: `Tips received - Order ${order.orderNumber}`,
      });
    }

    // Create journal entry in database
    const entryNumber = await generateEntryNumber();
    const journalEntry = await db.journalEntry.create({
      data: {
        id: randomUUID(),
        entryNumber: entryNumber,
        merchantId: actualMerchantId,
        entryDate: new Date().toISOString().split('T')[0],
        description: `POS Sales - Order ${order.orderNumber}`,
        reference: order.orderNumber,
        sourceType: 'pos_sale',
        sourceId: orderId,
        totalDebit: totalPaid + tipAmount,
        totalCredit: subtotal + taxAmount + tipAmount,
        status: 'posted',
        postedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create journal entry lines
    for (const line of lines) {
      await db.journalEntryLine.create({
        data: {
          id: randomUUID(),
          entryId: journalEntry.id,
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: line.debit,
          credit: line.credit,
          lineDescription: line.lineDescription,
          createdAt: new Date(),
        },
      });
    }

    // Also create entry in accounting store for compatibility
    const accountingEntry = accountingStore.createJournalEntry({
      date: new Date().toISOString().split('T')[0],
      reference: order.orderNumber,
      description: `POS Sales - Order ${order.orderNumber}`,
      lines: lines.map(l => ({
        id: l.id,
        accountId: l.accountCode,
        accountName: l.accountName,
        accountCode: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        description: l.lineDescription,
      })),
      totalDebit: totalPaid + tipAmount,
      totalCredit: subtotal + taxAmount + tipAmount,
      status: 'posted',
      createdBy: 'POS System',
    }, actualMerchantId);

    return {
      success: true,
      journalEntryId: journalEntry.id,
      entryNumber: journalEntry.entryNumber,
      lines: lines,
      summary: {
        totalDebit: journalEntry.totalDebit,
        totalCredit: journalEntry.totalCredit,
        cashAccount: `${cashAccountCode} - ${cashAccountName}`,
        salesAmount: subtotal,
        taxAmount: taxAmount,
        tipAmount: tipAmount,
      },
    };
  } catch (error: any) {
    console.error('Error creating accounting entry:', error);
    return {
      success: false,
      error: error.message || 'Failed to create accounting entry',
    };
  }
}

/**
 * Process all integrations for a completed sale
 */
export async function processSaleIntegrations(orderId: string, paymentId: string, merchantId?: string) {
  const results = {
    inventory: null as any,
    accounting: null as any,
    success: true,
    errors: [] as string[],
  };

  // Deduct inventory
  try {
    results.inventory = await deductInventory(orderId, merchantId);
    if (!results.inventory.success) {
      results.errors.push(`Inventory: ${results.inventory.error}`);
      results.success = false;
    }
  } catch (error: any) {
    results.inventory = { success: false, error: error.message };
    results.errors.push(`Inventory: ${error.message}`);
    results.success = false;
  }

  // Create accounting entry
  try {
    results.accounting = await createAccountingEntry(orderId, paymentId, merchantId);
    if (!results.accounting.success) {
      results.errors.push(`Accounting: ${results.accounting.error}`);
      results.success = false;
    }
  } catch (error: any) {
    results.accounting = { success: false, error: error.message };
    results.errors.push(`Accounting: ${error.message}`);
    results.success = false;
  }

  return results;
}

// POST endpoint for processing sale integrations
export async function POST(request: NextRequest) {
  try {
    // Get merchant ID from auth context first
    const authMerchantId = getMerchantIdWithDevFallback(request);
    
    const body = await request.json();
    const { orderId, paymentId, merchantId, action } = body;

    // Use auth context merchantId if available, otherwise use body merchantId
    const effectiveMerchantId = authMerchantId || merchantId;
    
    if (!effectiveMerchantId && action !== 'healthcheck') {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required (deductInventory, createAccountingEntry, processAll)' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'deductInventory':
        if (!orderId) {
          return NextResponse.json(
            { success: false, error: 'orderId is required for deductInventory' },
            { status: 400 }
          );
        }
        result = await deductInventory(orderId, effectiveMerchantId);
        break;

      case 'createAccountingEntry':
        if (!orderId || !paymentId) {
          return NextResponse.json(
            { success: false, error: 'orderId and paymentId are required for createAccountingEntry' },
            { status: 400 }
          );
        }
        result = await createAccountingEntry(orderId, paymentId, effectiveMerchantId);
        break;

      case 'processAll':
        if (!orderId || !paymentId) {
          return NextResponse.json(
            { success: false, error: 'orderId and paymentId are required for processAll' },
            { status: 400 }
          );
        }
        result = await processSaleIntegrations(orderId, paymentId, effectiveMerchantId);
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('Error processing integration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process integration' },
      { status: 500 }
    );
  }
}

// GET endpoint to check integration status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({
      success: true,
      message: 'Sales Integration API',
      availableActions: [
        'POST with action=deductInventory - Deduct inventory for an order',
        'POST with action=createAccountingEntry - Create journal entry for a payment',
        'POST with action=processAll - Run all integrations for a sale',
      ],
    });
  }

  try {
    // Check if integrations have been processed for this order
    const stockMovements = await db.stockMovement.findMany({
      where: {
        referenceType: 'pos_order',
        referenceId: orderId,
      },
    });

    const journalEntries = await db.journalEntry.findMany({
      where: {
        sourceType: 'pos_sale',
        sourceId: orderId,
      },
    });

    return NextResponse.json({
      success: true,
      orderId,
      inventoryProcessed: stockMovements.length > 0,
      accountingProcessed: journalEntries.length > 0,
      stockMovements: stockMovements.length,
      journalEntries: journalEntries.length,
    });
  } catch (error: any) {
    console.error('Error checking integration status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check integration status' },
      { status: 500 }
    );
  }
}
