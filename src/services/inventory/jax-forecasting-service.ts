/**
 * JAX AI Forecasting Service
 * 
 * AI-powered inventory forecasting and demand prediction:
 * 1. Demand forecasting using historical sales data
 * 2. Seasonal pattern detection
 * 3. Safety stock calculation
 * 4. Reorder point optimization
 * 5. Stock-out risk prediction
 */

import { db } from '@/lib/db';

// Types
export interface DemandForecast {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  avgDailySales: number;
  salesVelocity: number; // units per day trend
  forecast7Days: number;
  forecast30Days: number;
  confidence: number; // 0-100
  daysOfStock: number;
  stockOutRisk: 'low' | 'medium' | 'high' | 'critical';
  reorderRecommended: boolean;
  reorderQuantity: number;
  reorderDate: Date;
  estimatedCost: number;
  seasonality: 'none' | 'low' | 'medium' | 'high';
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface InventoryInsight {
  type: 'stockout_risk' | 'overstock' | 'reorder' | 'savings' | 'anomaly';
  priority: 'low' | 'medium' | 'high' | 'critical';
  productId: string;
  productName: string;
  message: string;
  recommendation: string;
  potentialSavings?: number;
  urgency?: 'immediate' | 'this_week' | 'this_month';
  confidence: number;
  data: Record<string, any>;
}

export interface ReorderSuggestion {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQty: number;
  estimatedCost: number;
  supplierId?: string;
  supplierName?: string;
  leadTime: number;
  orderBy: Date;
  expectedDelivery: Date;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SalesPattern {
  productId: string;
  dayOfWeek: number[]; // 0-6, avg sales per day
  hourOfDay: number[]; // 0-23, avg sales per hour
  monthlyTrend: number[]; // 12 months
  seasonalFactor: number; // current month multiplier
  growthRate: number; // month-over-month growth %
}

/**
 * JAX AI Forecasting Service Class
 */
export class JAXForecastingService {
  /**
   * Generate demand forecast for a product
   */
  static async getProductForecast(
    merchantId: string,
    productId: string,
    options?: {
      forecastDays?: number;
      includeHistory?: boolean;
    }
  ): Promise<DemandForecast | null> {
    const forecastDays = options?.forecastDays || 30;

    // Get product
    const product = await db.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        lowStockThreshold: true,
        costPrice: true,
        leadTime: true,
        reorderPoint: true,
        reorderQuantity: true,
        supplierId: true,
      },
    });

    if (!product) return null;

    // Get historical sales data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await db.stockMovement.findMany({
      where: {
        merchantId,
        productId,
        type: 'sale',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        quantity: true,
        createdAt: true,
      },
    });

    // Get historical data for 90 days for trend analysis
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const historicalSales = await db.stockMovement.findMany({
      where: {
        merchantId,
        productId,
        type: 'sale',
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        quantity: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const totalSalesLast30Days = sales.reduce((sum, s) => sum + Math.abs(s.quantity), 0);
    const avgDailySales = totalSalesLast30Days / 30;
    
    // Calculate sales velocity (trend)
    const salesLast7Days = sales
      .filter(s => new Date(s.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, s) => sum + Math.abs(s.quantity), 0);
    const salesPrev7Days = sales
      .filter(s => {
        const date = new Date(s.createdAt);
        return date >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) && 
               date < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      })
      .reduce((sum, s) => sum + Math.abs(s.quantity), 0);

    const velocityTrend = salesPrev7Days > 0 
      ? (salesLast7Days - salesPrev7Days) / salesPrev7Days 
      : 0;

    const salesVelocity = avgDailySales * (1 + velocityTrend * 0.1);

    // Seasonality detection
    const seasonality = this.detectSeasonality(historicalSales);
    const seasonalFactor = seasonality.currentFactor;

    // Generate forecasts
    const forecast7Days = Math.round(avgDailySales * 7 * seasonalFactor);
    const forecast30Days = Math.round(avgDailySales * 30 * seasonalFactor);

    // Calculate days of stock remaining
    const daysOfStock = avgDailySales > 0 
      ? Math.floor(product.currentStock / avgDailySales) 
      : 999;

    // Determine stock-out risk
    const leadTime = product.leadTime || 3;
    const stockOutRisk = this.calculateStockOutRisk(
      product.currentStock,
      avgDailySales,
      leadTime,
      daysOfStock
    );

    // Calculate confidence based on data availability
    const confidence = Math.min(95, Math.max(50, 50 + (sales.length / 30) * 45));

    // Determine trend
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (velocityTrend > 0.1) trend = 'increasing';
    else if (velocityTrend < -0.1) trend = 'decreasing';

    // Reorder recommendation
    const reorderRecommended = this.shouldReorder(
      product.currentStock,
      avgDailySales,
      leadTime,
      product.lowStockThreshold || 10
    );

    const reorderQuantity = Math.max(
      product.reorderQuantity || Math.ceil(avgDailySales * 30),
      Math.ceil((leadTime + 14) * avgDailySales) - product.currentStock
    );

    const reorderDate = new Date();
    reorderDate.setDate(reorderDate.getDate() + Math.max(0, daysOfStock - leadTime - 2));

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      currentStock: product.currentStock,
      avgDailySales,
      salesVelocity,
      forecast7Days,
      forecast30Days,
      confidence,
      daysOfStock,
      stockOutRisk,
      reorderRecommended,
      reorderQuantity,
      reorderDate,
      estimatedCost: reorderQuantity * (product.costPrice || 0),
      seasonality: seasonality.level,
      trend,
    };
  }

  /**
   * Get all product forecasts for a merchant
   */
  static async getAllForecasts(
    merchantId: string,
    options?: {
      categoryId?: string;
      lowStockOnly?: boolean;
      includeReorder?: boolean;
    }
  ): Promise<DemandForecast[]> {
    const where: any = {
      merchantId,
      trackInventory: true,
      isActive: true,
    };

    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }

    const products = await db.product.findMany({
      where,
      select: { id: true },
    });

    const forecasts: DemandForecast[] = [];

    for (const product of products) {
      const forecast = await this.getProductForecast(merchantId, product.id);
      if (forecast) {
        // Filter by low stock if requested
        if (options?.lowStockOnly && forecast.stockOutRisk === 'low') {
          continue;
        }

        // Filter by reorder recommendation
        if (options?.includeReorder && !forecast.reorderRecommended) {
          continue;
        }

        forecasts.push(forecast);
      }
    }

    // Sort by stock-out risk priority
    const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    forecasts.sort((a, b) => riskOrder[a.stockOutRisk] - riskOrder[b.stockOutRisk]);

    return forecasts;
  }

  /**
   * Generate inventory insights
   */
  static async generateInsights(merchantId: string): Promise<InventoryInsight[]> {
    const insights: InventoryInsight[] = [];

    // Get all products with their forecasts
    const forecasts = await this.getAllForecasts(merchantId);

    // Stock-out risk insights
    for (const forecast of forecasts) {
      if (forecast.stockOutRisk === 'critical') {
        insights.push({
          type: 'stockout_risk',
          priority: 'critical',
          productId: forecast.productId,
          productName: forecast.productName,
          message: `${forecast.productName} will stock out in ${forecast.daysOfStock} days`,
          recommendation: `Order ${forecast.reorderQuantity} units immediately`,
          urgency: 'immediate',
          confidence: forecast.confidence,
          data: { forecast },
        });
      } else if (forecast.stockOutRisk === 'high') {
        insights.push({
          type: 'stockout_risk',
          priority: 'high',
          productId: forecast.productId,
          productName: forecast.productName,
          message: `${forecast.productName} at risk of stockout within 2 weeks`,
          recommendation: `Order ${forecast.reorderQuantity} units within ${Math.max(1, forecast.daysOfStock - 7)} days`,
          urgency: 'this_week',
          confidence: forecast.confidence,
          data: { forecast },
        });
      }

      // Trend insights
      if (forecast.trend === 'increasing' && forecast.confidence > 70) {
        insights.push({
          type: 'savings',
          priority: 'medium',
          productId: forecast.productId,
          productName: forecast.productName,
          message: `${forecast.productName} demand is increasing`,
          recommendation: 'Consider increasing safety stock to avoid stockouts',
          potentialSavings: forecast.reorderQuantity * (forecast.avgDailySales * 0.1),
          confidence: forecast.confidence,
          data: { forecast },
        });
      }

      // Overstock detection
      if (forecast.daysOfStock > 90 && forecast.trend !== 'increasing') {
        insights.push({
          type: 'overstock',
          priority: 'low',
          productId: forecast.productId,
          productName: forecast.productName,
          message: `${forecast.productName} has ${forecast.daysOfStock} days of stock`,
          recommendation: 'Consider reducing future orders or running promotions',
          confidence: forecast.confidence,
          data: { forecast },
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return insights;
  }

  /**
   * Generate reorder suggestions
   */
  static async getReorderSuggestions(
    merchantId: string,
    options?: {
      maxBudget?: number;
      supplierId?: string;
    }
  ): Promise<ReorderSuggestion[]> {
    const forecasts = await this.getAllForecasts(merchantId, { includeReorder: true });
    const suggestions: ReorderSuggestion[] = [];

    for (const forecast of forecasts) {
      if (!forecast.reorderRecommended) continue;

      // Get product supplier info
      const product = await db.product.findUnique({
        where: { id: forecast.productId },
        select: {
          supplierId: true,
          leadTime: true,
          costPrice: true,
        },
      });

      let supplierName: string | undefined;
      if (product?.supplierId) {
        const supplier = await db.supplier.findUnique({
          where: { id: product.supplierId },
          select: { name: true },
        });
        supplierName = supplier?.name;
      }

      const leadTime = product?.leadTime || 3;
      const orderBy = new Date();
      orderBy.setDate(orderBy.getDate() + Math.max(0, forecast.daysOfStock - leadTime - 2));

      const expectedDelivery = new Date(orderBy);
      expectedDelivery.setDate(expectedDelivery.getDate() + leadTime);

      // Determine priority
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (forecast.stockOutRisk === 'critical') priority = 'critical';
      else if (forecast.stockOutRisk === 'high') priority = 'high';
      else if (forecast.daysOfStock > 21) priority = 'low';

      suggestions.push({
        productId: forecast.productId,
        productName: forecast.productName,
        sku: forecast.sku,
        currentStock: forecast.currentStock,
        reorderPoint: Math.ceil(forecast.avgDailySales * (leadTime + 7)),
        suggestedQty: forecast.reorderQuantity,
        estimatedCost: forecast.estimatedCost,
        supplierId: product?.supplierId || undefined,
        supplierName,
        leadTime,
        orderBy,
        expectedDelivery,
        reasoning: this.generateReorderReasoning(forecast),
        priority,
      });
    }

    // Sort by priority and apply budget filter
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    if (options?.maxBudget) {
      let totalCost = 0;
      return suggestions.filter(s => {
        if (totalCost + s.estimatedCost <= options.maxBudget!) {
          totalCost += s.estimatedCost;
          return true;
        }
        return false;
      });
    }

    return suggestions;
  }

  /**
   * Detect seasonality in sales data
   */
  private static detectSeasonality(sales: { quantity: number; createdAt: Date }[]): {
    level: 'none' | 'low' | 'medium' | 'high';
    currentFactor: number;
  } {
    if (sales.length < 30) {
      return { level: 'none', currentFactor: 1 };
    }

    // Group sales by month
    const monthlySales: Record<number, number[]> = {};
    
    sales.forEach(s => {
      const month = new Date(s.createdAt).getMonth();
      if (!monthlySales[month]) monthlySales[month] = [];
      monthlySales[month].push(Math.abs(s.quantity));
    });

    // Calculate average per month
    const monthlyAvgs: number[] = [];
    for (let i = 0; i < 12; i++) {
      if (monthlySales[i] && monthlySales[i].length > 0) {
        monthlyAvgs[i] = monthlySales[i].reduce((a, b) => a + b, 0) / monthlySales[i].length;
      }
    }

    // Calculate overall average
    const validAvgs = monthlyAvgs.filter(a => a > 0);
    if (validAvgs.length < 2) {
      return { level: 'none', currentFactor: 1 };
    }

    const overallAvg = validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length;
    
    // Calculate variance
    const variance = validAvgs.reduce((sum, a) => sum + Math.pow(a - overallAvg, 2), 0) / validAvgs.length;
    const coefficientOfVariation = Math.sqrt(variance) / overallAvg;

    // Current month factor
    const currentMonth = new Date().getMonth();
    const currentFactor = monthlyAvgs[currentMonth] ? monthlyAvgs[currentMonth] / overallAvg : 1;

    // Determine seasonality level
    let level: 'none' | 'low' | 'medium' | 'high' = 'none';
    if (coefficientOfVariation > 0.5) level = 'high';
    else if (coefficientOfVariation > 0.3) level = 'medium';
    else if (coefficientOfVariation > 0.15) level = 'low';

    return { level, currentFactor };
  }

  /**
   * Calculate stock-out risk level
   */
  private static calculateStockOutRisk(
    currentStock: number,
    avgDailySales: number,
    leadTime: number,
    daysOfStock: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (daysOfStock <= leadTime) return 'critical';
    if (daysOfStock <= leadTime + 3) return 'high';
    if (daysOfStock <= leadTime + 7) return 'medium';
    return 'low';
  }

  /**
   * Determine if reorder is needed
   */
  private static shouldReorder(
    currentStock: number,
    avgDailySales: number,
    leadTime: number,
    lowStockThreshold: number
  ): boolean {
    const reorderPoint = Math.ceil(avgDailySales * (leadTime + 7));
    return currentStock <= Math.max(reorderPoint, lowStockThreshold);
  }

  /**
   * Generate human-readable reasoning for reorder
   */
  private static generateReorderReasoning(forecast: DemandForecast): string {
    const reasons: string[] = [];

    if (forecast.daysOfStock <= 7) {
      reasons.push(`Only ${forecast.daysOfStock} days of stock remaining`);
    }
    
    if (forecast.trend === 'increasing') {
      reasons.push('Demand is trending upward');
    }

    if (forecast.seasonality !== 'none') {
      reasons.push('Seasonal demand patterns detected');
    }

    if (forecast.avgDailySales > 0) {
      reasons.push(`Average daily sales: ${forecast.avgDailySales.toFixed(1)} units`);
    }

    return reasons.length > 0 
      ? reasons.join('. ') + '.'
      : 'Based on current inventory levels and sales velocity.';
  }

  /**
   * Get sales patterns for a product
   */
  static async getSalesPatterns(
    merchantId: string,
    productId: string
  ): Promise<SalesPattern | null> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const sales = await db.stockMovement.findMany({
      where: {
        merchantId,
        productId,
        type: 'sale',
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        quantity: true,
        createdAt: true,
      },
    });

    if (sales.length === 0) {
      return null;
    }

    // Day of week patterns (0-6)
    const dayOfWeek = new Array(7).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);

    // Hour of day patterns (0-23)
    const hourOfDay = new Array(24).fill(0);
    const hourOfDayCounts = new Array(24).fill(0);

    // Monthly patterns
    const monthlySales = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);

    sales.forEach(s => {
      const date = new Date(s.createdAt);
      const qty = Math.abs(s.quantity);

      dayOfWeek[date.getDay()] += qty;
      dayOfWeekCounts[date.getDay()]++;

      hourOfDay[date.getHours()] += qty;
      hourOfDayCounts[date.getHours()]++;

      monthlySales[date.getMonth()] += qty;
      monthlyCounts[date.getMonth()]++;
    });

    // Calculate averages
    const dayOfWeekAvg = dayOfWeek.map((total, i) => 
      dayOfWeekCounts[i] > 0 ? total / dayOfWeekCounts[i] : 0
    );

    const hourOfDayAvg = hourOfDay.map((total, i) => 
      hourOfDayCounts[i] > 0 ? total / hourOfDayCounts[i] : 0
    );

    const monthlyAvg = monthlySales.map((total, i) => 
      monthlyCounts[i] > 0 ? total / monthlyCounts[i] : 0
    );

    // Calculate seasonal factor
    const currentMonth = new Date().getMonth();
    const overallAvg = monthlyAvg.filter(a => a > 0).reduce((a, b) => a + b, 0) / 
                       monthlyAvg.filter(a => a > 0).length || 1;
    const seasonalFactor = monthlyAvg[currentMonth] / overallAvg || 1;

    // Calculate growth rate (month over month)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const growthRate = monthlyAvg[lastMonth] > 0 
      ? ((monthlyAvg[currentMonth] - monthlyAvg[lastMonth]) / monthlyAvg[lastMonth]) * 100
      : 0;

    return {
      productId,
      dayOfWeek: dayOfWeekAvg,
      hourOfDay: hourOfDayAvg,
      monthlyTrend: monthlyAvg,
      seasonalFactor,
      growthRate,
    };
  }
}

export default JAXForecastingService;
