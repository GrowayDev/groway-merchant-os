import { NextRequest, NextResponse } from 'next/server'

// Network configurations
const NETWORKS = {
  vodacom: {
    id: 'vodacom',
    name: 'Vodacom',
    color: '#E60000',
    prefixes: ['082', '072', '076', '079', '086'],
    bundles: [
      { id: 'v-airtime', type: 'airtime', name: 'Airtime Only', data: '0', price: 0, validity: 'N/A' },
      { id: 'v1', type: 'data', name: 'Just 4 You', data: '1GB', price: 9900, validity: '30 days', popular: true },
      { id: 'v2', type: 'data', name: 'Power Bundle', data: '2GB', price: 14900, validity: '30 days' },
      { id: 'v3', type: 'data', name: 'Mega Bundle', data: '5GB', price: 29900, validity: '30 days', popular: true },
      { id: 'v4', type: 'data', name: 'Giga Bundle', data: '10GB', price: 49900, validity: '30 days' },
      { id: 'v5', type: 'data', name: 'Night Owl', data: '2GB', price: 4900, validity: '7 nights', nightData: true },
    ],
  },
  mtn: {
    id: 'mtn',
    name: 'MTN',
    color: '#FFCC00',
    prefixes: ['083', '073', '078', '071'],
    bundles: [
      { id: 'm-airtime', type: 'airtime', name: 'Airtime Only', data: '0', price: 0, validity: 'N/A' },
      { id: 'm1', type: 'data', name: 'Ayoba', data: '1GB', price: 9500, validity: '30 days', popular: true },
      { id: 'm2', type: 'data', name: 'Chatta', data: '2GB', price: 14500, validity: '30 days' },
      { id: 'm3', type: 'data', name: 'Supa', data: '5GB', price: 28900, validity: '30 days', popular: true },
      { id: 'm4', type: 'data', name: 'Mega', data: '10GB', price: 47900, validity: '30 days' },
    ],
  },
  cellc: {
    id: 'cellc',
    name: 'Cell C',
    color: '#00A651',
    prefixes: ['084', '074', '077'],
    bundles: [
      { id: 'c-airtime', type: 'airtime', name: 'Airtime Only', data: '0', price: 0, validity: 'N/A' },
      { id: 'c1', type: 'data', name: 'Data Bundle', data: '1GB', price: 8900, validity: '30 days' },
      { id: 'c2', type: 'data', name: 'SmartData', data: '2GB', price: 13900, validity: '30 days', popular: true },
      { id: 'c3', type: 'data', name: 'MegaData', data: '5GB', price: 27900, validity: '30 days' },
    ],
  },
  telkom: {
    id: 'telkom',
    name: 'Telkom',
    color: '#0066B3',
    prefixes: ['081', '071'],
    bundles: [
      { id: 't-airtime', type: 'airtime', name: 'Airtime Only', data: '0', price: 0, validity: 'N/A' },
      { id: 't1', type: 'data', name: 'FreeMe', data: '1GB', price: 7900, validity: '30 days', popular: true },
      { id: 't2', type: 'data', name: 'FreeMe', data: '2GB', price: 12900, validity: '30 days' },
      { id: 't3', type: 'data', name: 'FreeMe', data: '5GB', price: 24900, validity: '30 days', popular: true },
    ],
  },
}

// Detect network from phone number
function detectNetwork(phoneNumber: string): string | null {
  const cleanNumber = phoneNumber.replace(/\D/g, '')
  const prefix = cleanNumber.startsWith('27') 
    ? '0' + cleanNumber.slice(2, 4) 
    : cleanNumber.slice(0, 3)

  for (const [networkId, network] of Object.entries(NETWORKS)) {
    if (network.prefixes.includes(prefix)) {
      return networkId
    }
  }
  return null
}

// GET - Fetch networks, bundles, or detect network
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const networkId = searchParams.get('network')
    const phoneNumber = searchParams.get('phone')

    // Detect network from phone number
    if (phoneNumber) {
      const detectedNetwork = detectNetwork(phoneNumber)
      return NextResponse.json({
        success: true,
        data: {
          phoneNumber,
          detectedNetwork,
          network: detectedNetwork ? NETWORKS[detectedNetwork as keyof typeof NETWORKS] : null,
        }
      })
    }

    // Get specific network details
    if (networkId && NETWORKS[networkId as keyof typeof NETWORKS]) {
      return NextResponse.json({
        success: true,
        data: {
          network: NETWORKS[networkId as keyof typeof NETWORKS]
        }
      })
    }

    // Return all networks
    return NextResponse.json({
      success: true,
      data: {
        networks: Object.values(NETWORKS).map(n => ({
          id: n.id,
          name: n.name,
          color: n.color,
          prefixes: n.prefixes,
        }))
      }
    })

  } catch (error) {
    console.error('Get airtime data error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get airtime data' },
      { status: 500 }
    )
  }
}

// POST - Purchase airtime or data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, phoneNumber, amountCents, bundleId, networkId, walletId } = body

    if (!userId || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'User ID and phone number are required' },
        { status: 400 }
      )
    }

    // Detect or validate network
    const detectedNetwork = detectNetwork(phoneNumber)
    const network = networkId || detectedNetwork

    if (!network || !NETWORKS[network as keyof typeof NETWORKS]) {
      return NextResponse.json(
        { success: false, error: 'Unable to determine network for this phone number' },
        { status: 400 }
      )
    }

    // Validate amount or bundle
    if (!amountCents && !bundleId) {
      return NextResponse.json(
        { success: false, error: 'Amount or bundle selection is required' },
        { status: 400 }
      )
    }

    // Get bundle details if specified
    let bundle = null
    let finalAmountCents = amountCents

    if (bundleId) {
      const networkData = NETWORKS[network as keyof typeof NETWORKS]
      bundle = networkData.bundles.find(b => b.id === bundleId)
      
      if (!bundle) {
        return NextResponse.json(
          { success: false, error: 'Invalid bundle selected' },
          { status: 400 }
        )
      }
      
      finalAmountCents = bundle.price
    }

    // Minimum amount check for airtime
    if (!bundle && Number(finalAmountCents) < 200) { // R2 minimum for airtime
      return NextResponse.json(
        { success: false, error: 'Minimum airtime purchase is R2' },
        { status: 400 }
      )
    }

    // In production:
    // 1. Check wallet balance
    // 2. Create pending transaction
    // 3. Call network API (via aggregator like DPO, PayGate)
    // 4. Update transaction status
    // 5. Send confirmation SMS

    const purchase = {
      id: `airtime-${Date.now()}`,
      userId,
      phoneNumber,
      network: NETWORKS[network as keyof typeof NETWORKS].name,
      type: bundle ? 'data' : 'airtime',
      bundle: bundle?.name || 'Airtime',
      dataAmount: bundle?.data || 'N/A',
      amountCents: finalAmountCents,
      status: 'processing',
      reference: `AT${Date.now()}`,
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    }

    return NextResponse.json({
      success: true,
      message: `${bundle ? 'Data bundle' : 'Airtime'} purchase initiated successfully`,
      data: purchase
    })

  } catch (error) {
    console.error('Airtime purchase error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process airtime purchase' },
      { status: 500 }
    )
  }
}
