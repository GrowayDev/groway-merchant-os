import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchant-os/agriculture/livestock/dashboard - Get dashboard summary data
export async function GET(request: NextRequest) {
  try {
    const merchantId = request.nextUrl.searchParams.get('merchantId')
    const farmId = request.nextUrl.searchParams.get('farmId')

    if (!merchantId) {
      return NextResponse.json({
        speciesData: [],
        herdDistribution: [],
        lifecycleStages: [],
        recentActivity: [],
        alerts: [],
        metrics: null,
        message: 'No merchant ID provided'
      })
    }

    // Build where clause
    const where: Record<string, unknown> = { merchantId }
    if (farmId) where.farmId = farmId

    // ============================================
    // SPECIES DATA
    // ============================================
    const livestockByType = await db.livestock.groupBy({
      by: ['animalType', 'healthStatus'],
      where,
      _count: { id: true }
    })

    // Process species data
    const speciesMap = new Map<string, { healthy: number; sick: number; quarantined: number; count: number }>()

    for (const item of livestockByType) {
      const type = item.animalType || 'cattle'
      if (!speciesMap.has(type)) {
        speciesMap.set(type, { healthy: 0, sick: 0, quarantined: 0, count: 0 })
      }
      const data = speciesMap.get(type)!
      data.count += item._count.id

      switch (item.healthStatus) {
        case 'healthy':
          data.healthy += item._count.id
          break
        case 'sick':
        case 'ill':
          data.sick += item._count.id
          break
        case 'quarantined':
          data.quarantined += item._count.id
          break
        default:
          data.healthy += item._count.id
      }
    }

    // Get alerts count per species (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentHealthIssues = await db.healthRecord.groupBy({
      by: ['livestockId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
        Livestock: { merchantId }
      },
      _count: { id: true }
    })

    // Get livestock types for recent health issues
    const livestockIds = recentHealthIssues.map(h => h.livestockId)
    const livestockWithType = await db.livestock.findMany({
      where: { id: { in: livestockIds } },
      select: { id: true, animalType: true }
    })

    const alertsByType = new Map<string, number>()
    for (const item of livestockWithType) {
      const type = item.animalType || 'cattle'
      alertsByType.set(type, (alertsByType.get(type) || 0) + 1)
    }

    const speciesData = Array.from(speciesMap.entries()).map(([species, data]) => ({
      species,
      count: data.count,
      healthy: data.healthy,
      sick: data.sick,
      quarantined: data.quarantined,
      recentAlerts: alertsByType.get(species) || 0
    }))

    // ============================================
    // HERD DISTRIBUTION BY CLASSIFICATION
    // ============================================
    const livestockByPurpose = await db.livestock.groupBy({
      by: ['purpose'],
      where,
      _count: { id: true }
    })

    const totalAnimals = livestockByPurpose.reduce((sum, item) => sum + item._count.id, 0)

    const herdDistribution = livestockByPurpose.map(item => ({
      classification: item.purpose || 'commercial',
      count: item._count.id,
      percentage: totalAnimals > 0 ? (item._count.id / totalAnimals) * 100 : 0
    }))

    // Add default classifications if missing
    const defaultClassifications = ['breeding', 'commercial', 'replacement', 'cull']
    for (const classification of defaultClassifications) {
      if (!herdDistribution.find(h => h.classification === classification)) {
        herdDistribution.push({ classification, count: 0, percentage: 0 })
      }
    }

    // ============================================
    // LIFECYCLE STAGES
    // ============================================
    // Group by age ranges to simulate lifecycle stages
    const allLivestock = await db.livestock.findMany({
      where,
      select: { id: true, animalType: true, dateOfBirth: true }
    })

    const now = new Date()
    const lifecycleStages: { stage: string; count: number; species: string }[] = []

    for (const animal of allLivestock) {
      const ageInMonths = animal.dateOfBirth
        ? Math.floor((now.getTime() - animal.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 24 // Default to adult

      let stage = 'adult'
      if (ageInMonths < 6) stage = 'young'
      else if (ageInMonths < 12) stage = 'weanling'
      else if (ageInMonths < 24) stage = 'yearling'

      lifecycleStages.push({
        stage,
        count: 1,
        species: animal.animalType || 'cattle'
      })
    }

    // Aggregate by stage and species
    const stageMap = new Map<string, { count: number; species: string }>()
    for (const item of lifecycleStages) {
      const key = `${item.stage}-${item.species}`
      if (!stageMap.has(key)) {
        stageMap.set(key, { count: 0, species: item.species })
      }
      stageMap.get(key)!.count += 1
    }

    const aggregatedStages = Array.from(stageMap.entries()).map(([key, data]) => ({
      stage: key.split('-')[0],
      count: data.count,
      species: data.species
    }))

    // ============================================
    // RECENT ACTIVITY
    // ============================================
    const recentActivity: {
      id: string
      type: 'weight' | 'breeding' | 'health' | 'movement' | 'birth'
      title: string
      description: string
      timestamp: string
    }[] = []

    // Get recent weight records (from health records with type 'weight')
    const recentWeights = await db.healthRecord.findMany({
      where: {
        recordType: 'weight',
        Livestock: { merchantId }
      },
      orderBy: { recordDate: 'desc' },
      take: 5,
      include: { Livestock: { select: { identificationNumber: true, animalType: true } } }
    })

    for (const record of recentWeights) {
      recentActivity.push({
        id: record.id,
        type: 'weight',
        title: `Weight recorded: ${record.Livestock.identificationNumber || record.Livestock.id}`,
        description: record.description || 'Weight measurement recorded',
        timestamp: record.recordDate.toISOString()
      })
    }

    // Get recent health records
    const recentHealth = await db.healthRecord.findMany({
      where: {
        recordType: { not: 'weight' },
        Livestock: { merchantId }
      },
      orderBy: { recordDate: 'desc' },
      take: 5,
      include: { Livestock: { select: { identificationNumber: true, animalType: true } } }
    })

    for (const record of recentHealth) {
      recentActivity.push({
        id: record.id,
        type: 'health',
        title: `Health event: ${record.Livestock.identificationNumber || record.Livestock.id}`,
        description: `${record.recordType}: ${record.description || 'Health check performed'}`,
        timestamp: record.recordDate.toISOString()
      })
    }

    // Get recent movements
    const recentMovements = await db.movementRecord.findMany({
      where: {
        Livestock: { merchantId }
      },
      orderBy: { movementDate: 'desc' },
      take: 5,
      include: { Livestock: { select: { identificationNumber: true, animalType: true } } }
    })

    for (const record of recentMovements) {
      recentActivity.push({
        id: record.id,
        type: 'movement',
        title: `Movement: ${record.Livestock.identificationNumber || record.Livestock.id}`,
        description: `${record.movementType}: ${record.fromLocation || 'N/A'} → ${record.toLocation || 'N/A'}`,
        timestamp: record.movementDate.toISOString()
      })
    }

    // Sort by timestamp
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // ============================================
    // ALERTS
    // ============================================
    const alerts: {
      id: string
      type: 'birth' | 'vaccination' | 'underperforming' | 'mortality'
      title: string
      message: string
      severity: 'high' | 'medium' | 'low'
      dueDate?: string
      animalTag?: string
    }[] = []

    // Upcoming births (pregnant animals - check health records)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const pregnantAnimals = await db.healthRecord.findMany({
      where: {
        recordType: 'pregnancy_check',
        description: { contains: 'pregnant' },
        Livestock: { merchantId, status: 'active' }
      },
      include: { Livestock: { select: { identificationNumber: true, id: true } } }
    })

    for (const record of pregnantAnimals) {
      alerts.push({
        id: `birth-${record.id}`,
        type: 'birth',
        title: 'Expected Birth',
        message: `Pregnant animal due for birth`,
        severity: 'medium',
        dueDate: thirtyDaysFromNow.toISOString(),
        animalTag: record.Livestock.identificationNumber || record.Livestock.id
      })
    }

    // Vaccinations due
    const upcomingVaccinations = await db.livestock.findMany({
      where: {
        merchantId,
        nextVaccination: { lte: thirtyDaysFromNow },
        status: 'active'
      },
      take: 10
    })

    for (const animal of upcomingVaccinations) {
      alerts.push({
        id: `vaccination-${animal.id}`,
        type: 'vaccination',
        title: 'Vaccination Due',
        message: `Vaccination scheduled for ${animal.identificationNumber || animal.id}`,
        severity: 'medium',
        dueDate: animal.nextVaccination?.toISOString(),
        animalTag: animal.identificationNumber || animal.id
      })
    }

    // Underperforming animals (low weight or recent illness)
    const sickAnimals = await db.livestock.findMany({
      where: {
        merchantId,
        healthStatus: { in: ['sick', 'ill', 'quarantined'] },
        status: 'active'
      },
      take: 10
    })

    for (const animal of sickAnimals) {
      alerts.push({
        id: `underperforming-${animal.id}`,
        type: 'underperforming',
        title: 'Health Alert',
        message: `${animal.identificationNumber || animal.id} requires attention: ${animal.healthStatus}`,
        severity: animal.healthStatus === 'quarantined' ? 'high' : 'medium',
        animalTag: animal.identificationNumber || animal.id
      })
    }

    // Mortality alerts (animals that died recently)
    const recentDeaths = await db.livestock.findMany({
      where: {
        merchantId,
        status: 'deceased',
        updatedAt: { gte: sevenDaysAgo }
      },
      take: 5
    })

    for (const animal of recentDeaths) {
      alerts.push({
        id: `mortality-${animal.id}`,
        type: 'mortality',
        title: 'Mortality Recorded',
        message: `${animal.identificationNumber || animal.id} has been marked as deceased`,
        severity: 'high',
        animalTag: animal.identificationNumber || animal.id
      })
    }

    // ============================================
    // PRODUCTION METRICS
    // ============================================
    const metrics = {
      totalAnimals,
      bySpecies: speciesData.map(s => ({ species: s.species, count: s.count })),
      avgDailyGain: null as number | null,
      breedingSuccessRate: null as number | null,
      mortalityRate: null as number | null
    }

    // Calculate average daily gain (if weight records exist)
    const weightRecords = await db.healthRecord.findMany({
      where: {
        recordType: 'weight',
        Livestock: { merchantId }
      },
      orderBy: { recordDate: 'asc' }
    })

    if (weightRecords.length >= 2) {
      // Simple calculation: compare first and last weights
      const daysDiff = Math.floor(
        (weightRecords[weightRecords.length - 1].recordDate.getTime() - weightRecords[0].recordDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysDiff > 0 && weightRecords.length > 0) {
        // Placeholder - would need actual weight values stored
        metrics.avgDailyGain = null
      }
    }

    // Calculate breeding success rate
    const totalBreedingAnimals = livestockByPurpose.find(p => p.purpose === 'breeding')?._count.id || 0
    const healthyBreedingAnimals = livestockByType
      .filter(item => item.purpose === 'breeding' && item.healthStatus === 'healthy')
      .reduce((sum, item) => sum + item._count.id, 0)

    if (totalBreedingAnimals > 0) {
      metrics.breedingSuccessRate = (healthyBreedingAnimals / totalBreedingAnimals) * 100
    }

    // Calculate mortality rate
    const totalAnimalsIncludingDead = await db.livestock.count({
      where: { merchantId }
    })

    const deadAnimals = await db.livestock.count({
      where: { merchantId, status: 'deceased' }
    })

    if (totalAnimalsIncludingDead > 0) {
      metrics.mortalityRate = (deadAnimals / totalAnimalsIncludingDead) * 100
    }

    return NextResponse.json({
      speciesData,
      herdDistribution,
      lifecycleStages: aggregatedStages,
      recentActivity: recentActivity.slice(0, 10),
      alerts: alerts.slice(0, 10),
      metrics
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({
      speciesData: [],
      herdDistribution: [],
      lifecycleStages: [],
      recentActivity: [],
      alerts: [],
      metrics: null
    })
  }
}
