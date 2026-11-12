import { NextRequest, NextResponse } from 'next/server';

// Voucher Types
const voucherTypes = [
  { id: '1voucher', name: '1voucher', category: 'betting', logo: '🎰', description: 'Betting deposits', minAmount: 10, maxAmount: 5000 },
  { id: 'ott', name: 'OTT Voucher', category: 'betting', logo: '🎲', description: 'Online betting', minAmount: 10, maxAmount: 3000 },
  { id: 'blu', name: 'Blu Voucher', category: 'gaming', logo: '🎮', description: 'Gaming & entertainment', minAmount: 25, maxAmount: 1000 },
  { id: 'flash', name: 'Flash Voucher', category: 'retail', logo: '⚡', description: 'Retail purchases', minAmount: 10, maxAmount: 500 },
];

// Gift Cards
const giftCards = [
  // Retail
  { id: 'shoprite', name: 'Shoprite', category: 'retail', logo: '🛒', amounts: [50, 100, 200, 500] },
  { id: 'picknpay', name: 'Pick n Pay', category: 'retail', logo: '🛒', amounts: [50, 100, 200, 500] },
  { id: 'woolworths', name: 'Woolworths', category: 'retail', logo: '🍎', amounts: [100, 200, 500, 1000] },
  { id: 'game', name: 'Game', category: 'retail', logo: '🎮', amounts: [100, 200, 500, 1000] },
  { id: 'makro', name: 'Makro', category: 'retail', logo: '📦', amounts: [100, 200, 500, 1000, 2000] },
  { id: 'checkers', name: 'Checkers', category: 'retail', logo: '🛒', amounts: [50, 100, 200, 500] },
  
  // Food
  { id: 'kfc', name: 'KFC', category: 'food', logo: '🍗', amounts: [25, 50, 100, 200] },
  { id: 'nandos', name: "Nando's", category: 'food', logo: '🔥', amounts: [50, 100, 200] },
  { id: 'mcdonalds', name: "McDonald's", category: 'food', logo: '🍔', amounts: [25, 50, 100] },
  { id: 'steers', name: 'Steers', category: 'food', logo: '🍔', amounts: [30, 50, 100] },
  { id: 'debonairs', name: 'Debonairs', category: 'food', logo: '🍕', amounts: [30, 50, 100] },
  { id: 'spur', name: 'Spur', category: 'food', logo: '🦅', amounts: [50, 100, 200] },
  
  // Entertainment
  { id: 'netflix', name: 'Netflix', category: 'entertainment', logo: '🎬', amounts: [99, 159, 199] },
  { id: 'spotify', name: 'Spotify', category: 'entertainment', logo: '🎵', amounts: [59, 99] },
  { id: 'playstation', name: 'PlayStation', category: 'entertainment', logo: '🎮', amounts: [150, 300, 500, 750] },
  { id: 'xbox', name: 'Xbox', category: 'entertainment', logo: '🎮', amounts: [150, 300, 500, 750] },
  { id: 'steam', name: 'Steam', category: 'entertainment', logo: '🎮', amounts: [100, 200, 300, 500] },
  { id: 'showmax', name: 'Showmax', category: 'entertainment', logo: '📺', amounts: [39, 99] },
];

// Purchased vouchers
let purchasedVouchers = [
  { id: 'VC001', type: '1voucher', name: '1voucher', amount: 100, pin: '****1234', serial: '1V2024001', purchasedAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: new Date(Date.now() + 31536000000).toISOString(), status: 'unused' },
  { id: 'GC001', type: 'giftcard', name: 'Netflix', amount: 159, code: '****-****-****-5678', purchasedAt: new Date(Date.now() - 172800000).toISOString(), expiresAt: new Date(Date.now() + 94608000000).toISOString(), status: 'unused' },
];

// Generate random PIN
function generatePin(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - List vouchers and gift cards
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const category = searchParams.get('category');

  if (action === 'types') {
    return NextResponse.json({ success: true, data: voucherTypes });
  }

  if (action === 'giftcards') {
    let filtered = giftCards;
    if (category) {
      filtered = giftCards.filter(g => g.category === category);
    }
    return NextResponse.json({ success: true, data: filtered });
  }

  if (action === 'categories') {
    const categories = [...new Set(giftCards.map(g => g.category))];
    return NextResponse.json({ success: true, data: categories });
  }

  if (action === 'my-vouchers') {
    return NextResponse.json({ success: true, data: purchasedVouchers });
  }

  return NextResponse.json({
    success: true,
    data: {
      voucherTypes,
      giftCards,
      categories: [...new Set(giftCards.map(g => g.category))],
      purchasedVouchers: purchasedVouchers.slice(0, 5),
    },
  });
}

// POST - Purchase voucher or gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, itemId, amount, quantity = 1 } = body;

    // Purchase voucher
    if (type === 'voucher') {
      const voucherType = voucherTypes.find(v => v.id === itemId);
      if (!voucherType) {
        return NextResponse.json({ success: false, error: 'Invalid voucher type' }, { status: 400 });
      }

      if (amount < voucherType.minAmount || amount > voucherType.maxAmount) {
        return NextResponse.json({
          success: false,
          error: `Amount must be between R${voucherType.minAmount} and R${voucherType.maxAmount}`,
        }, { status: 400 });
      }

      const vouchers = [];
      for (let i = 0; i < quantity; i++) {
        const voucher = {
          id: `VC${Date.now()}${i}`,
          type: itemId,
          name: voucherType.name,
          amount,
          pin: generatePin(16),
          serial: `${itemId.toUpperCase().slice(0, 3)}${Date.now()}${i}`,
          purchasedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (3 * 365 * 24 * 60 * 60 * 1000)).toISOString(), // 3 years per CPA
          status: 'unused',
        };
        vouchers.push(voucher);
        purchasedVouchers.unshift(voucher);
      }

      return NextResponse.json({
        success: true,
        data: { vouchers, total: amount * quantity },
        message: `Successfully purchased ${quantity}x ${voucherType.name} voucher(s)`,
      });
    }

    // Purchase gift card
    if (type === 'giftcard') {
      const giftCard = giftCards.find(g => g.id === itemId);
      if (!giftCard) {
        return NextResponse.json({ success: false, error: 'Invalid gift card' }, { status: 400 });
      }

      if (!giftCard.amounts.includes(amount)) {
        return NextResponse.json({
          success: false,
          error: `Invalid amount. Available: ${giftCard.amounts.join(', ')}`,
        }, { status: 400 });
      }

      const code = `${generatePin(4)}-${generatePin(4)}-${generatePin(4)}-${generatePin(4)}`;
      const voucher = {
        id: `GC${Date.now()}`,
        type: 'giftcard',
        name: giftCard.name,
        amount,
        code,
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (3 * 365 * 24 * 60 * 60 * 1000)).toISOString(), // 3 years per CPA
        status: 'unused',
      };

      purchasedVouchers.unshift(voucher);

      return NextResponse.json({
        success: true,
        data: voucher,
        message: `Successfully purchased ${giftCard.name} R${amount} gift card`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE - Redeem/use voucher
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { voucherId } = body;

    const voucherIndex = purchasedVouchers.findIndex(v => v.id === voucherId);
    if (voucherIndex === -1) {
      return NextResponse.json({ success: false, error: 'Voucher not found' }, { status: 404 });
    }

    purchasedVouchers[voucherIndex].status = 'used';
    return NextResponse.json({ success: true, message: 'Voucher marked as used' });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
