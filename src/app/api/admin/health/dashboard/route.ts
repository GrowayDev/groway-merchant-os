import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to generate mock system metrics (would be real in production)
function generateMockSystemMetrics() {
  return {
    cpu: {
      current: Math.random() * 40 + 20, // 20-60%
      threshold: 80,
      status: 'healthy',
    },
    memory: {
      current: Math.random() * 30 + 40, // 40-70%
      threshold: 85,
      status: 'healthy',
    },
    disk: {
      current: Math.random() * 20 + 50, // 50-70%
      threshold: 90,
      status: 'healthy',
    },
    network: {
      latency: Math.floor(Math.random() * 20 + 5), // 5-25ms
      throughput: Math.floor(Math.random() * 500 + 500), // 500-1000 Mbps
      status: 'healthy',
    },
  };
}

// Helper function to get service status summary
async function getServiceStatusSummary() {
  const services = await db.serviceStatus.findMany({
    where: { isActive: true },
  });

  const summary = {
    total: services.length,
    operational: services.filter(s => s.status === 'operational').length,
    degraded: services.filter(s => s.status === 'degraded').length,
    partialOutage: services.filter(s => s.status === 'partial_outage').length,
    majorOutage: services.filter(s => s.status === 'major_outage').length,
    maintenance: services.filter(s => s.status === 'maintenance').length,
  };

  return { services, summary };
}

// Helper function to get API endpoint metrics
async function getAPIEndpointMetrics() {
  const endpoints = await db.aPIEndpointMonitor.findMany({
    where: { isActive: true },
    orderBy: { requestsPerDay: 'desc' },
    take: 20,
  });

  return endpoints;
}

// Helper function to get database health
async function getDatabaseHealth() {
  const latestMetrics = await db.databaseHealthMetric.findFirst({
    orderBy: { recordedAt: 'desc' },
  });

  return latestMetrics || {
    activeConnections: 15,
    idleConnections: 5,
    maxConnections: 100,
    connectionPoolUsage: 20,
    avgQueryTimeMs: 12,
    slowQueryCount: 0,
    databaseSizeMb: 256,
    status: 'healthy',
  };
}

// Helper function to get recent health incidents
async function getRecentHealthIncidents() {
  // Get recent critical alerts that are health-related
  const alerts = await db.systemAlert.findMany({
    where: {
      alertType: 'system',
      status: { notIn: ['resolved', 'closed'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return alerts;
}

// Helper function to get health metrics history
async function getHealthMetricsHistory(metricType: string, hours: number = 24) {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hours);

  const metrics = await db.systemHealthMetric.findMany({
    where: {
      metricType,
      recordedAt: { gte: startTime },
    },
    orderBy: { recordedAt: 'asc' },
    take: 1440, // Max 1 data point per minute for 24 hours
  });

  return metrics;
}

// GET /api/admin/health/dashboard - Get platform health dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');
    const metricType = searchParams.get('metricType');
    const hours = parseInt(searchParams.get('hours') || '24');

    // Overview dashboard
    if (!view || view === 'overview') {
      const [serviceStatus, apiMetrics, dbHealth, incidents] = await Promise.all([
        getServiceStatusSummary(),
        getAPIEndpointMetrics(),
        getDatabaseHealth(),
        getRecentHealthIncidents(),
      ]);

      // Get or generate system metrics
      const systemMetrics = generateMockSystemMetrics();

      // Calculate overall health score
      const healthScore = calculateHealthScore(
        serviceStatus.summary,
        systemMetrics,
        dbHealth
      );

      return NextResponse.json({
        healthScore,
        systemMetrics,
        serviceStatus,
        apiMetrics,
        databaseHealth: dbHealth,
        incidents,
        timestamp: new Date().toISOString(),
      });
    }

    // Detailed service view
    if (view === 'services') {
      const { services, summary } = await getServiceStatusSummary();

      return NextResponse.json({
        services,
        summary,
        timestamp: new Date().toISOString(),
      });
    }

    // API endpoints view
    if (view === 'api') {
      const endpoints = await getAPIEndpointMetrics();

      // Group by service
      const byService = endpoints.reduce((acc, endpoint) => {
        const service = endpoint.serviceName || 'default';
        if (!acc[service]) acc[service] = [];
        acc[service].push(endpoint);
        return acc;
      }, {} as Record<string, typeof endpoints>);

      return NextResponse.json({
        endpoints,
        byService,
        totalEndpoints: endpoints.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Database view
    if (view === 'database') {
      const dbHealth = await getDatabaseHealth();

      // Get historical metrics
      const connectionHistory = await getHealthMetricsHistory('connections', hours);
      const queryTimeHistory = await getHealthMetricsHistory('query_time', hours);

      return NextResponse.json({
        current: dbHealth,
        history: {
          connections: connectionHistory,
          queryTime: queryTimeHistory,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Metrics history view
    if (view === 'metrics') {
      if (!metricType) {
        return NextResponse.json(
          { error: 'metricType is required for metrics view' },
          { status: 400 }
        );
      }

      const metrics = await getHealthMetricsHistory(metricType, hours);

      return NextResponse.json({
        metricType,
        hours,
        dataPoints: metrics.length,
        metrics,
        timestamp: new Date().toISOString(),
      });
    }

    // Alerts view
    if (view === 'alerts') {
      const thresholds = await db.healthAlertThreshold.findMany({
        where: { isActive: true },
      });

      const activeAlerts = await db.systemAlert.findMany({
        where: {
          alertType: { in: ['system', 'operational'] },
          status: { notIn: ['resolved', 'closed'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        thresholds,
        activeAlerts,
        timestamp: new Date().toISOString(),
      });
    }

    // Uptime view
    if (view === 'uptime') {
      const services = await db.serviceStatus.findMany({
        where: { isActive: true },
      });

      // Calculate uptime percentages (mock data for demo)
      const uptimeData = services.map(service => ({
        ...service,
        uptimePercent: service.uptimePercent || (95 + Math.random() * 5),
        incidents: Math.floor(Math.random() * 5),
        lastIncident: service.lastIncidentAt?.toISOString() || null,
      }));

      // Overall platform uptime
      const overallUptime = uptimeData.reduce((sum, s) => sum + (s.uptimePercent || 0), 0) / uptimeData.length;

      return NextResponse.json({
        overallUptime,
        services: uptimeData,
        period: '30 days',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid view parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching health dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health dashboard' },
      { status: 500 }
    );
  }
}

// POST /api/admin/health/dashboard - Create/update health records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'record_metric': {
        const { metricType, serviceName, currentValue, threshold, unit, status, metadata } = data;

        const metric = await db.systemHealthMetric.create({
          data: {
            id: `HM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            metricType,
            serviceName,
            currentValue,
            threshold,
            unit,
            status: status || (currentValue > (threshold || 0) ? 'critical' : 'healthy'),
            metadata: metadata ? JSON.stringify(metadata) : null,
          },
        });

        // Check if threshold exceeded and create alert
        if (threshold && currentValue > threshold) {
          await db.systemAlert.create({
            data: {
              id: `ALT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              alertType: 'system',
              severity: currentValue > threshold * 1.5 ? 'critical' : 'high',
              title: `${metricType} threshold exceeded for ${serviceName || 'system'}`,
              description: `Current value ${currentValue}${unit || ''} exceeds threshold of ${threshold}${unit || ''}`,
              source: 'health_monitor',
              riskScore: Math.min(100, Math.round((currentValue / threshold) * 50)),
              impactLevel: currentValue > threshold * 1.5 ? 'critical' : 'high',
            },
          });
        }

        return NextResponse.json(metric, { status: 201 });
      }

      case 'update_service_status': {
        const { serviceName, status, statusMessage } = data;

        const service = await db.serviceStatus.update({
          where: { serviceName },
          data: {
            status,
            statusMessage,
            lastCheckAt: new Date(),
            updatedAt: new Date(),
          },
        });

        return NextResponse.json(service);
      }

      case 'record_api_metric': {
        const { path, method, responseTime, statusCode } = data;

        // Find or create endpoint record
        let endpoint = await db.aPIEndpointMonitor.findFirst({
          where: { path, method },
        });

        if (endpoint) {
          // Update existing endpoint
          const updates: Record<string, unknown> = {
            lastCheckedAt: new Date(),
            updatedAt: new Date(),
          };

          if (responseTime) {
            // Simple moving average (would be more sophisticated in production)
            updates.avgResponseTime = Math.round(
              ((endpoint.avgResponseTime || 0) * 0.9 + responseTime * 0.1)
            );
          }

          if (statusCode && statusCode >= 400) {
            updates.errorCount24h = (endpoint.errorCount24h || 0) + 1;
          }

          endpoint = await db.aPIEndpointMonitor.update({
            where: { id: endpoint.id },
            data: updates,
          });
        } else {
          // Create new endpoint
          endpoint = await db.aPIEndpointMonitor.create({
            data: {
              id: `API-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name: `${method} ${path}`,
              path,
              method,
              avgResponseTime: responseTime || 0,
              status: 'healthy',
              lastCheckedAt: new Date(),
            },
          });
        }

        return NextResponse.json(endpoint);
      }

      case 'record_db_metric': {
        const {
          databaseName,
          activeConnections,
          idleConnections,
          maxConnections,
          avgQueryTimeMs,
          slowQueryCount,
          databaseSizeMb,
          status,
        } = data;

        const metric = await db.databaseHealthMetric.create({
          data: {
            id: `DBM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            databaseName: databaseName || 'main',
            activeConnections: activeConnections || 0,
            idleConnections: idleConnections || 0,
            maxConnections: maxConnections || 100,
            connectionPoolUsage: maxConnections ? (activeConnections / maxConnections) * 100 : 0,
            avgQueryTimeMs: avgQueryTimeMs || 0,
            slowQueryCount: slowQueryCount || 0,
            databaseSizeMb: databaseSizeMb || 0,
            status: status || 'healthy',
          },
        });

        return NextResponse.json(metric, { status: 201 });
      }

      case 'create_threshold': {
        const {
          metricType,
          serviceName,
          warningThreshold,
          criticalThreshold,
          unit,
          durationMinutes,
          alertChannels,
          autoResolve,
        } = data;

        const threshold = await db.healthAlertThreshold.create({
          data: {
            id: `THR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            metricType,
            serviceName,
            warningThreshold,
            criticalThreshold,
            unit,
            durationMinutes: durationMinutes || 5,
            alertChannels: alertChannels ? JSON.stringify(alertChannels) : null,
            autoResolve: autoResolve ?? true,
          },
        });

        return NextResponse.json(threshold, { status: 201 });
      }

      case 'initialize_services': {
        // Seed default services
        const defaultServices = [
          { name: 'API Gateway', type: 'api', status: 'operational' },
          { name: 'Database', type: 'database', status: 'operational' },
          { name: 'Redis Cache', type: 'cache', status: 'operational' },
          { name: 'Worker Queue', type: 'worker', status: 'operational' },
          { name: 'File Storage', type: 'external', status: 'operational' },
          { name: 'Payment Gateway', type: 'external', status: 'operational' },
          { name: 'SMS Service', type: 'external', status: 'operational' },
          { name: 'Email Service', type: 'external', status: 'operational' },
        ];

        const services = await Promise.all(
          defaultServices.map(service =>
            db.serviceStatus.upsert({
              where: { serviceName: service.name.toLowerCase().replace(/ /g, '_') },
              create: {
                id: `SVC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                serviceName: service.name.toLowerCase().replace(/ /g, '_'),
                displayName: service.name,
                serviceType: service.type,
                status: service.status,
                checkIntervalSeconds: 60,
              },
              update: { status: service.status },
            })
          )
        );

        return NextResponse.json({ services, created: services.length });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing health action:', error);
    return NextResponse.json(
      { error: 'Failed to process health action' },
      { status: 500 }
    );
  }
}

// Helper function to calculate overall health score
function calculateHealthScore(
  serviceSummary: { total: number; operational: number; degraded: number; partialOutage: number; majorOutage: number },
  systemMetrics: { cpu: { current: number; threshold: number }; memory: { current: number; threshold: number }; disk: { current: number; threshold: number } },
  dbHealth: { status: string; connectionPoolUsage: number }
): { score: number; status: string; breakdown: Record<string, number> } {
  let score = 100;
  const breakdown: Record<string, number> = {};

  // Service availability (40% weight)
  const serviceScore = serviceSummary.total > 0
    ? (serviceSummary.operational / serviceSummary.total) * 100
    : 100;
  breakdown.services = serviceScore;

  // Deduct for degraded/outage services
  score -= serviceSummary.degraded * 5;
  score -= serviceSummary.partialOutage * 15;
  score -= serviceSummary.majorOutage * 30;

  // System metrics (30% weight)
  const cpuScore = systemMetrics.cpu.current < systemMetrics.cpu.threshold ? 100 : 50;
  const memoryScore = systemMetrics.memory.current < systemMetrics.memory.threshold ? 100 : 50;
  const diskScore = systemMetrics.disk.current < systemMetrics.disk.threshold ? 100 : 50;
  breakdown.cpu = cpuScore;
  breakdown.memory = memoryScore;
  breakdown.disk = diskScore;

  if (systemMetrics.cpu.current > systemMetrics.cpu.threshold) score -= 10;
  if (systemMetrics.memory.current > systemMetrics.memory.threshold) score -= 10;
  if (systemMetrics.disk.current > systemMetrics.disk.threshold) score -= 10;

  // Database health (30% weight)
  breakdown.database = dbHealth.status === 'healthy' ? 100 : dbHealth.status === 'degraded' ? 70 : 30;
  if (dbHealth.status !== 'healthy') score -= 15;
  if (dbHealth.connectionPoolUsage > 80) score -= 5;

  // Cap score
  score = Math.max(0, Math.min(100, score));

  let status = 'healthy';
  if (score < 50) status = 'critical';
  else if (score < 70) status = 'degraded';
  else if (score < 90) status = 'warning';

  return { score, status, breakdown };
}
