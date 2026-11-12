import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// Demo user ID - in production this would come from authentication
const DEMO_USER_ID = 'demo-consumer-user-001';

// EMVCo QR Code constants
const EMVCO_PAYLOAD_FORMAT = '000201'; // Version 2.0
const EMVCO_POINT_OF_INITIATION = '010211'; // Static QR (can be changed to 012 for dynamic)
const EMVCO_MERCHANT_ACCOUNT_INFO = '26'; // South Africa specific
const EMVCO_MERCHANT_CATEGORY_CODE = '52';
const EMVCO_TRANSACTION_CURRENCY = '53'; // 710 for ZAR
const EMVCO_TRANSACTION_AMOUNT = '54';
const EMVCO_TIP_OR_CONVENIENCE_INDICATOR = '55';
const EMVCO_VALUE_OF_CONVENIENCE_FEE = '56';
const EMVCO_COUNTRY_CODE = '58'; // ZA for South Africa
const EMVCO_MERCHANT_NAME = '59';
const EMVCO_MERCHANT_CITY = '60';
const EMVCO_ADDITIONAL_DATA = '62';
const EMVCO_CRC = '63';

// Helper to create EMVCo TLV field
function createTLV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

// Calculate CRC-16 for EMVCo QR
function calculateCRC16(str: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc <<= 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// Generate EMVCo compliant QR string
function generateEMVCoQR(params: {
  merchantId: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  reference?: string;
  tipAmount?: number;
  isStatic: boolean;
  nfcEnabled?: boolean;
}): string {
  let qrString = '';

  // Payload Format Indicator
  qrString += EMVCO_PAYLOAD_FORMAT;

  // Point of Initiation Method (11 = static, 12 = dynamic)
  qrString += params.isStatic ? EMVCO_POINT_OF_INITIATION : '010212';

  // Merchant Account Information (South Africa specific)
  const merchantAccountInfo = 
    createTLV('00', 'ZA.GROWAY') + // Globally unique identifier
    createTLV('01', params.merchantId) + // Merchant ID
    createTLV('02', 'GROWAY'); // Payment network
  qrString += createTLV(EMVCO_MERCHANT_ACCOUNT_INFO, merchantAccountInfo);

  // Merchant Category Code (default: 5812 for restaurants)
  qrString += createTLV(EMVCO_MERCHANT_CATEGORY_CODE, '5812');

  // Transaction Currency (710 = ZAR)
  qrString += createTLV(EMVCO_TRANSACTION_CURRENCY, '710');

  // Transaction Amount (only for dynamic QR)
  if (!params.isStatic && params.amount) {
    qrString += createTLV(EMVCO_TRANSACTION_AMOUNT, params.amount.toFixed(2));
  }

  // Tip or Convenience Indicator
  if (params.tipAmount && params.tipAmount > 0) {
    qrString += createTLV(EMVCO_TIP_OR_CONVENIENCE_INDICATOR, '02'); // Fixed fee
    qrString += createTLV(EMVCO_VALUE_OF_CONVENIENCE_FEE, params.tipAmount.toFixed(2));
  }

  // Country Code
  qrString += createTLV(EMVCO_COUNTRY_CODE, 'ZA');

  // Merchant Name
  const truncatedName = params.merchantName.substring(0, 25);
  qrString += createTLV(EMVCO_MERCHANT_NAME, truncatedName);

  // Merchant City
  const truncatedCity = params.merchantCity.substring(0, 15);
  qrString += createTLV(EMVCO_MERCHANT_CITY, truncatedCity);

  // Additional Data Field Template
  let additionalData = '';
  if (params.reference) {
    additionalData += createTLV('01', params.reference); // Bill number
  }
  if (params.nfcEnabled) {
    additionalData += createTLV('07', 'NFC'); // NFC indicator
  }
  if (additionalData) {
    qrString += createTLV(EMVCO_ADDITIONAL_DATA, additionalData);
  }

  // CRC placeholder
  const crcString = qrString + EMVCO_CRC + '04';
  const crc = calculateCRC16(crcString);
  qrString += createTLV(EMVCO_CRC, crc);

  return qrString;
}

// Helper to ensure demo user exists
async function ensureDemoUser() {
  let user = await db.consumerUser.findUnique({
    where: { id: DEMO_USER_ID }
  });
  
  if (!user) {
    const now = new Date();
    user = await db.consumerUser.create({
      data: {
        id: DEMO_USER_ID,
        phone: '+27821234567',
        email: 'thabo.molefe@example.com',
        firstName: 'Thabo',
        lastName: 'Molefe',
        kycLevel: 2,
        kycStatus: 'verified',
        kycVerifiedAt: now,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now,
      }
    });
  }
  
  return user;
}

// GET - Generate QR code or retrieve existing
export async function GET(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const qrType = searchParams.get('type') || 'static';
    const amount = searchParams.get('amount');
    const qrId = searchParams.get('qrId');

    // Get specific QR by ID
    if (qrId) {
      const qr = await db.consumerQR.findUnique({
        where: { id: qrId },
        include: {
          QRTransaction: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          }
        }
      });

      if (!qr) {
        return NextResponse.json({ success: false, error: 'QR code not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          ...qr,
          amountCents: qr.amountCents ? Number(qr.amountCents) : null,
          tipAmountCents: qr.tipAmountCents ? Number(qr.tipAmountCents) : null,
          QRTransaction: qr.QRTransaction.map(tx => ({
            ...tx,
            amountCents: Number(tx.amountCents),
            tipAmountCents: Number(tx.tipAmountCents),
            feeCents: Number(tx.feeCents),
            netAmountCents: Number(tx.netAmountCents),
          }))
        }
      });
    }

    // Get user's static QR (permanent receiving code)
    if (action === 'static') {
      let existingQR = await db.consumerQR.findFirst({
        where: {
          userId: DEMO_USER_ID,
          qrType: 'static',
          status: 'active',
          staticCode: true,
        }
      });

      if (existingQR) {
        return NextResponse.json({
          success: true,
          data: {
            ...existingQR,
            amountCents: existingQR.amountCents ? Number(existingQR.amountCents) : null,
          }
        });
      }

      // Create new static QR
      const user = await db.consumerUser.findUnique({
        where: { id: DEMO_USER_ID }
      });

      const merchantName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Groway User';
      const merchantId = DEMO_USER_ID;
      const qrData = generateEMVCoQR({
        merchantId,
        merchantName: merchantName || 'Groway User',
        merchantCity: 'Johannesburg',
        isStatic: true,
      });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year expiry

      const newQR = await db.consumerQR.create({
        data: {
          id: `QR${Date.now()}`,
          userId: DEMO_USER_ID,
          qrType: 'static',
          qrData,
          emvPayload: qrData,
          merchantId,
          merchantName,
          staticCode: true,
          expiresAt,
          nfcEnabled: true,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          ...newQR,
          amountCents: newQR.amountCents ? Number(newQR.amountCents) : null,
        }
      });
    }

    // Generate dynamic QR with amount
    if (action === 'dynamic' && amount) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
      }

      const user = await db.consumerUser.findUnique({
        where: { id: DEMO_USER_ID }
      });

      const merchantName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Groway User';
      const reference = searchParams.get('reference') || `REQ${Date.now()}`;
      const tip = searchParams.get('tip');

      const qrData = generateEMVCoQR({
        merchantId: DEMO_USER_ID,
        merchantName: merchantName || 'Groway User',
        merchantCity: 'Johannesburg',
        amount: amountNum,
        reference,
        tipAmount: tip ? parseFloat(tip) : undefined,
        isStatic: false,
        nfcEnabled: true,
      });

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes expiry

      const amountCents = BigInt(Math.round(amountNum * 100));
      const tipAmountCents = tip ? BigInt(Math.round(parseFloat(tip) * 100)) : null;

      const newQR = await db.consumerQR.create({
        data: {
          id: `QR${Date.now()}`,
          userId: DEMO_USER_ID,
          qrType: 'dynamic',
          qrData,
          emvPayload: qrData,
          merchantId: DEMO_USER_ID,
          merchantName,
          amountCents,
          tipAmountCents,
          reference,
          staticCode: false,
          expiresAt,
          nfcEnabled: true,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          ...newQR,
          amountCents: Number(newQR.amountCents),
          tipAmountCents: newQR.tipAmountCents ? Number(newQR.tipAmountCents) : null,
        }
      });
    }

    // Get user's QR codes
    if (action === 'list') {
      const qrCodes = await db.consumerQR.findMany({
        where: { userId: DEMO_USER_ID },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({
        success: true,
        data: qrCodes.map(qr => ({
          ...qr,
          amountCents: qr.amountCents ? Number(qr.amountCents) : null,
          tipAmountCents: qr.tipAmountCents ? Number(qr.tipAmountCents) : null,
        }))
      });
    }

    // Get scan history
    if (action === 'history') {
      const transactions = await db.qRTransaction.findMany({
        where: { 
          OR: [
            { payerId: DEMO_USER_ID },
            { payeeId: DEMO_USER_ID }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return NextResponse.json({
        success: true,
        data: transactions.map(tx => ({
          ...tx,
          amountCents: Number(tx.amountCents),
          tipAmountCents: Number(tx.tipAmountCents),
          feeCents: Number(tx.feeCents),
          netAmountCents: Number(tx.netAmountCents),
        }))
      });
    }

    // Default: return static QR
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid action. Use action=static, action=dynamic, action=list, or action=history' 
    }, { status: 400 });
  } catch (error) {
    console.error('QR GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process QR request' }, { status: 500 });
  }
}

// POST - Process QR payment (scan to pay)
export async function POST(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { action, qrData, amount, tipAmount, paymentMethod, pin, biometric, latitude, longitude, deviceInfo } = body;

    // Validate scanned QR code
    if (action === 'validate') {
      if (!qrData) {
        return NextResponse.json({ success: false, error: 'QR data required' }, { status: 400 });
      }

      // Parse EMVCo QR data
      const parsedQR = parseEMVCoQR(qrData);
      
      // Check if QR is in our system
      let existingQR = await db.consumerQR.findFirst({
        where: {
          qrData: qrData,
          status: 'active',
        }
      });

      if (!existingQR) {
        // Create a temporary QR record for external QR codes
        const now = new Date();
        existingQR = await db.consumerQR.create({
          data: {
            id: `QR${Date.now()}`,
            userId: parsedQR.merchantId || 'external',
            qrType: 'dynamic',
            qrData,
            emvPayload: qrData,
            merchantId: parsedQR.merchantId,
            merchantName: parsedQR.merchantName || 'Unknown Merchant',
            merchantCategory: parsedQR.mcc,
            amountCents: parsedQR.amount ? BigInt(Math.round(parsedQR.amount * 100)) : null,
            currency: parsedQR.currency || 'ZAR',
            staticCode: false,
            expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 min
            status: 'active',
            createdAt: now,
            updatedAt: now,
          }
        });
      }

      // Check if QR is expired
      if (existingQR.expiresAt && existingQR.expiresAt < new Date()) {
        return NextResponse.json({ 
          success: false, 
          error: 'QR code has expired',
          data: { expired: true }
        }, { status: 400 });
      }

      // Increment scan count
      await db.consumerQR.update({
        where: { id: existingQR.id },
        data: {
          scanCount: { increment: 1 },
          lastScannedAt: new Date(),
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          qrId: existingQR.id,
          merchantName: existingQR.merchantName,
          merchantId: existingQR.merchantId,
          amount: existingQR.amountCents ? Number(existingQR.amountCents) / 100 : null,
          tipAmount: existingQR.tipAmountCents ? Number(existingQR.tipAmountCents) / 100 : null,
          currency: existingQR.currency,
          reference: existingQR.reference,
          nfcEnabled: existingQR.nfcEnabled,
          staticCode: existingQR.staticCode,
          isOwnQR: existingQR.userId === DEMO_USER_ID,
        }
      });
    }

    // Process QR payment
    if (action === 'pay') {
      const { qrId } = body;
      const paymentAmount = parseFloat(amount);

      if (!qrId || isNaN(paymentAmount) || paymentAmount <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid payment details' }, { status: 400 });
      }

      // Get QR code
      const qr = await db.consumerQR.findUnique({
        where: { id: qrId }
      });

      if (!qr) {
        return NextResponse.json({ success: false, error: 'QR code not found' }, { status: 404 });
      }

      // Check expiry
      if (qr.expiresAt && qr.expiresAt < new Date()) {
        return NextResponse.json({ success: false, error: 'QR code has expired' }, { status: 400 });
      }

      // Get payer wallet
      const wallet = await db.consumerWallet.findUnique({
        where: { userId: DEMO_USER_ID }
      });

      if (!wallet) {
        return NextResponse.json({ success: false, error: 'Wallet not found' }, { status: 404 });
      }

      const amountCents = BigInt(Math.round(paymentAmount * 100));
      const tipCents = tipAmount ? BigInt(Math.round(parseFloat(tipAmount) * 100)) : BigInt(0);
      const feeCents = BigInt(0); // No fee for QR payments
      const totalCents = amountCents + tipCents + feeCents;

      // Check balance
      if (wallet.balanceCents < totalCents) {
        return NextResponse.json({ success: false, error: 'Insufficient funds' }, { status: 400 });
      }

      // Verify PIN/Biometric (simplified for demo)
      const isAuthenticated = pin === '1234' || biometric === true;
      if (!isAuthenticated) {
        return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 401 });
      }

      // Create transaction
      const now = new Date();
      const receiptNumber = `RCPT${Date.now()}`;
      const reference = `QR${Date.now()}`;

      const transaction = await db.qRTransaction.create({
        data: {
          id: `QTX${Date.now()}`,
          qrId: qr.id,
          payerId: DEMO_USER_ID,
          payerPhone: '+27821234567',
          payerName: 'Thabo Molefe',
          payeeId: qr.userId,
          payeeName: qr.merchantName,
          amountCents,
          tipAmountCents: tipCents,
          feeCents,
          netAmountCents: totalCents,
          currency: 'ZAR',
          transactionType: qr.nfcEnabled && body.nfcTap ? 'nfc_tap' : 'qr_pay',
          status: 'completed',
          paymentMethod: paymentMethod || 'wallet',
          reference,
          receiptNumber,
          nfcTerminalId: body.nfcTap ? `NFC${Date.now()}` : null,
          latitude: latitude || null,
          longitude: longitude || null,
          deviceInfo: deviceInfo || null,
          verified: true,
          verifiedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        }
      });

      // Update wallet balance
      await db.consumerWallet.update({
        where: { userId: DEMO_USER_ID },
        data: {
          balanceCents: wallet.balanceCents - totalCents,
          dailySpentCents: wallet.dailySpentCents + totalCents,
          monthlySpentCents: wallet.monthlySpentCents + totalCents,
          totalSentCents: wallet.totalSentCents + totalCents,
          updatedAt: now,
        }
      });

      // Create consumer transaction record
      await db.consumerTransaction.create({
        data: {
          id: `TXN${Date.now()}`,
          idempotencyKey: `IDM${Date.now()}-${randomUUID()}`,
          userId: DEMO_USER_ID,
          transactionType: 'qr_payment',
          direction: 'debit',
          amountCents: -totalCents,
          feeCents,
          netAmountCents: -totalCents,
          currency: 'ZAR',
          status: 'completed',
          description: `QR Payment to ${qr.merchantName}`,
          reference,
          category: 'QR Payment',
          counterpartyId: qr.userId,
          counterpartyName: qr.merchantName,
          paymentMethod: paymentMethod || 'wallet',
          merchantId: qr.merchantId,
          merchantName: qr.merchantName,
          qrType: qr.nfcEnabled && body.nfcTap ? 'nfc' : 'qr',
          nfcTerminalId: transaction.nfcTerminalId,
          processedAt: now,
          completedAt: now,
          createdAt: now,
          updatedAt: now,
        }
      });

      // Award loyalty points (10 points per R1)
      await awardLoyaltyPoints(paymentAmount);

      return NextResponse.json({
        success: true,
        data: {
          transaction: {
            id: transaction.id,
            receiptNumber,
            reference,
            amount: paymentAmount,
            tipAmount: tipAmount ? parseFloat(tipAmount) : 0,
            total: Number(totalCents) / 100,
            merchantName: qr.merchantName,
            status: 'completed',
            timestamp: now.toISOString(),
            paymentMethod: paymentMethod || 'wallet',
            transactionType: transaction.transactionType,
          },
          newBalance: Number(wallet.balanceCents - totalCents) / 100,
        },
        message: `Payment of R ${paymentAmount.toFixed(2)} sent to ${qr.merchantName}`,
      });
    }

    // NFC tap simulation
    if (action === 'nfc-tap') {
      const { nfcToken } = body;

      if (!nfcToken) {
        return NextResponse.json({ success: false, error: 'NFC token required' }, { status: 400 });
      }

      // Find QR by NFC token
      const qr = await db.consumerQR.findFirst({
        where: {
          nfcToken,
          nfcEnabled: true,
          status: 'active',
        }
      });

      if (!qr) {
        return NextResponse.json({ success: false, error: 'NFC device not found' }, { status: 404 });
      }

      // Check expiry
      if (qr.expiresAt && qr.expiresAt < new Date()) {
        return NextResponse.json({ success: false, error: 'NFC token expired' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: {
          qrId: qr.id,
          merchantName: qr.merchantName,
          amount: qr.amountCents ? Number(qr.amountCents) / 100 : null,
          nfcEnabled: true,
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('QR POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process QR payment' }, { status: 500 });
  }
}

// PUT - Update QR code (extend expiry, disable, etc.)
export async function PUT(request: NextRequest) {
  try {
    await ensureDemoUser();
    
    const body = await request.json();
    const { qrId, action, amount, extendMinutes, status } = body;

    if (!qrId) {
      return NextResponse.json({ success: false, error: 'QR ID required' }, { status: 400 });
    }

    const qr = await db.consumerQR.findUnique({
      where: { id: qrId }
    });

    if (!qr) {
      return NextResponse.json({ success: false, error: 'QR code not found' }, { status: 404 });
    }

    // Only allow owner to modify
    if (qr.userId !== DEMO_USER_ID) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const now = new Date();

    // Extend expiry
    if (action === 'extend') {
      const minutes = extendMinutes || 15;
      const newExpiry = new Date(now.getTime() + minutes * 60 * 1000);

      const updated = await db.consumerQR.update({
        where: { id: qrId },
        data: {
          expiresAt: newExpiry,
          updatedAt: now,
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          amountCents: updated.amountCents ? Number(updated.amountCents) : null,
        },
        message: `QR code expiry extended by ${minutes} minutes`
      });
    }

    // Update amount for dynamic QR
    if (action === 'update-amount') {
      if (qr.staticCode) {
        return NextResponse.json({ success: false, error: 'Cannot update amount on static QR' }, { status: 400 });
      }

      const amountCents = BigInt(Math.round(parseFloat(amount) * 100));

      // Generate new QR data with updated amount
      const qrData = generateEMVCoQR({
        merchantId: qr.merchantId || DEMO_USER_ID,
        merchantName: qr.merchantName || 'Groway User',
        merchantCity: 'Johannesburg',
        amount: parseFloat(amount),
        reference: qr.reference || undefined,
        isStatic: false,
      });

      const updated = await db.consumerQR.update({
        where: { id: qrId },
        data: {
          qrData,
          amountCents,
          updatedAt: now,
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          amountCents: Number(updated.amountCents),
        }
      });
    }

    // Update status
    if (action === 'status') {
      const updated = await db.consumerQR.update({
        where: { id: qrId },
        data: {
          status,
          updatedAt: now,
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          ...updated,
          amountCents: updated.amountCents ? Number(updated.amountCents) : null,
        }
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('QR PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update QR code' }, { status: 500 });
  }
}

// Parse EMVCo QR string
function parseEMVCoQR(qrString: string): {
  merchantId?: string;
  merchantName?: string;
  mcc?: string;
  amount?: number;
  currency?: string;
  country?: string;
  reference?: string;
} {
  const result: any = {};
  let pos = 0;

  while (pos < qrString.length) {
    const id = qrString.substring(pos, pos + 2);
    const len = parseInt(qrString.substring(pos + 2, pos + 4), 10);
    const value = qrString.substring(pos + 4, pos + 4 + len);

    switch (id) {
      case '26': // Merchant Account Info
        // Parse nested TLV
        let innerPos = 0;
        while (innerPos < value.length) {
          const innerId = value.substring(innerPos, innerPos + 2);
          const innerLen = parseInt(value.substring(innerPos + 2, innerPos + 4), 10);
          const innerValue = value.substring(innerPos + 4, innerPos + 4 + innerLen);
          
          if (innerId === '01') result.merchantId = innerValue;
          innerPos += 4 + innerLen;
        }
        break;
      case '52': // MCC
        result.mcc = value;
        break;
      case '53': // Currency
        result.currency = value === '710' ? 'ZAR' : value;
        break;
      case '54': // Amount
        result.amount = parseFloat(value);
        break;
      case '58': // Country
        result.country = value;
        break;
      case '59': // Merchant Name
        result.merchantName = value;
        break;
      case '62': // Additional Data
        let addPos = 0;
        while (addPos < value.length) {
          const addId = value.substring(addPos, addPos + 2);
          const addLen = parseInt(value.substring(addPos + 2, addPos + 4), 10);
          const addValue = value.substring(addPos + 4, addPos + 4 + addLen);
          
          if (addId === '01') result.reference = addValue;
          addPos += 4 + addLen;
        }
        break;
    }

    pos += 4 + len;
  }

  return result;
}

// Helper function to award loyalty points
async function awardLoyaltyPoints(amount: number) {
  const loyalty = await db.consumerLoyalty.findUnique({
    where: { userId: DEMO_USER_ID }
  });
  
  if (!loyalty) return;
  
  // Calculate points based on tier multiplier
  const multiplier = loyalty.tier === 'platinum' ? 3 : loyalty.tier === 'gold' ? 2 : loyalty.tier === 'silver' ? 1.5 : 1;
  const points = Math.round(amount * multiplier * 10); // 10 points per R1 base
  
  // Update loyalty
  await db.consumerLoyalty.update({
    where: { userId: DEMO_USER_ID },
    data: {
      points: loyalty.points + points,
      totalEarned: loyalty.totalEarned + points,
      updatedAt: new Date(),
    }
  });
}
