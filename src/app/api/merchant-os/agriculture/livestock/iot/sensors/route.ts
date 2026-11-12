import { NextRequest, NextResponse } from 'next/server'

// GET /api/merchant-os/agriculture/livestock/iot/sensors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const farmId = searchParams.get('farmId')

    if (!merchantId || !farmId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // For now, return mock sensor data
    // In production, this would query actual IoT sensor data from the database
    const sensors = [
      {
        id: 'sensor-1',
        name: 'Barn Temperature Sensor',
        type: 'temperature',
        location: 'Main Barn - Section A',
        status: 'online',
        batteryLevel: 85,
        signalStrength: 92,
        lastReading: { value: 22.5, unit: '°C' },
        lastSync: new Date().toISOString(),
        enabled: true,
      },
      {
        id: 'sensor-2',
        name: 'Water Tank Level Monitor',
        type: 'water_level',
        location: 'North Pasture Tank',
        status: 'online',
        batteryLevel: 72,
        signalStrength: 88,
        lastReading: { value: 4500, unit: 'L' },
        lastSync: new Date().toISOString(),
        enabled: true,
      },
      {
        id: 'sensor-3',
        name: 'Cattle GPS Collar #1',
        type: 'gps',
        location: 'North Pasture',
        status: 'online',
        batteryLevel: 65,
        signalStrength: 78,
        lastReading: { value: 0, unit: 'coords', lat: -25.7479, lng: 28.2293 },
        lastSync: new Date().toISOString(),
        enabled: true,
      },
    ]

    const alerts = [
      {
        id: 'alert-1',
        sensorId: 'sensor-6',
        sensorName: 'Motion Detector - Gate A',
        type: 'warning',
        message: 'Low battery level (15%)',
        value: 15,
        threshold: 20,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        acknowledged: false,
      },
    ]

    return NextResponse.json({
      sensors,
      alerts,
      summary: {
        total: sensors.length,
        online: sensors.filter(s => s.status === 'online').length,
        offline: sensors.filter(s => s.status === 'offline').length,
        lowBattery: sensors.filter(s => s.batteryLevel && s.batteryLevel < 20).length,
      },
    })
  } catch (error) {
    console.error('Error fetching IoT sensors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sensor data' },
      { status: 500 }
    )
  }
}

// POST /api/merchant-os/agriculture/livestock/iot/sensors
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { farmId, merchantId, name, type, location } = body

    if (!farmId || !merchantId || !name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a new sensor record
    const sensor = {
      id: `sensor-${Date.now()}`,
      name,
      type,
      location: location || 'Unknown',
      status: 'offline',
      batteryLevel: 100,
      signalStrength: 0,
      lastSync: new Date().toISOString(),
      enabled: true,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(sensor, { status: 201 })
  } catch (error) {
    console.error('Error creating sensor:', error)
    return NextResponse.json(
      { error: 'Failed to create sensor' },
      { status: 500 }
    )
  }
}
