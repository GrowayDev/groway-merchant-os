import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const outputDir = '/home/z/my-project/public/images/mockups';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Figma-style mockup prompts for each application
const mockups = [
  {
    name: 'consumer-wallet-home',
    prompt: `Professional Figma UI mockup of a mobile wallet home screen for African fintech app "Groway Consumer Wallet". Modern clean design with: 
    - Top navigation with user avatar "Thabo M." and greeting "Good morning"
    - Main wallet card showing balance "R 2,456.78" in teal gradient (#00897B to #4CAF50)
    - Quick action buttons: Send, Receive, Scan QR, Top Up with rounded icons
    - Services grid: Airtime, Electricity, Transfer, Bills with colorful icons
    - Recent transactions list showing "Shoprite R156.00" and "Vodacom Airtime R50.00"
    - Bottom navigation: Home, Pay, Services, Offers, Profile
    - Clean white background, rounded corners, shadow effects
    - Mobile app frame with status bar showing 9:41 and 5G
    - Professional UI/UX design, high fidelity prototype style`,
    size: '768x1344' as const
  },
  {
    name: 'merchant-os-pos',
    prompt: `Professional Figma UI mockup of a point-of-sale (POS) terminal screen for "Groway Merchant OS". Modern tablet interface with:
    - Left side: Product grid with food items (Burger R89, Chicken R75, Pizza R95, Soda R18, Fries R32, Salad R65) with emoji icons
    - Right side: Current order summary showing items total "R 202.00"
    - Large green "PAY NOW" button at bottom
    - Top bar with merchant logo "Burger Palace" and staff name
    - Category tabs: All, Burgers, Drinks, Sides
    - Dark theme bottom section with payment options: Cash, Card, QR, Mobile
    - Professional restaurant POS design, clean modern UI
    - Tablet frame with high fidelity prototype style`,
    size: '1344x768' as const
  },
  {
    name: 'merchant-os-inventory',
    prompt: `Professional Figma UI mockup of inventory management dashboard for "Groway Merchant OS". Clean business interface with:
    - Top metrics cards: Total Stock Value "R 125,430", Low Stock Items "12", Reorder Alerts "8", Expiring Soon "5"
    - Inventory table with columns: Product Name, SKU, Stock Level, Reorder Point, Status
    - Visual stock level bars with color coding (green/yellow/red)
    - Filter dropdown by category and search bar
    - Right sidebar with "Quick Actions": Add Product, Stock Take, Import CSV, Auto-Reorder
    - Low stock alert panel highlighted in orange
    - Professional business dashboard design, clean white theme with teal accents
    - Desktop web interface mockup`,
    size: '1344x768' as const
  },
  {
    name: 'merchant-os-analytics',
    prompt: `Professional Figma UI mockup of analytics dashboard for "Groway Merchant OS". Executive business intelligence interface with:
    - Top row KPI cards: Revenue "R 47,230", Transactions "142", Average Sale "R 332", Growth "+12.5%"
    - Line chart showing daily sales trend for the week
    - Pie chart showing sales by category (Food 45%, Drinks 30%, Sides 25%)
    - Bar chart comparing this week vs last week performance
    - Top selling products table with item names and quantities
    - Customer insights panel: New Customers, Returning, Avg Visit Value
    - Date range selector: Today, This Week, This Month, Custom
    - Dark sidebar navigation on left
    - Professional executive dashboard design, clean modern charts`,
    size: '1344x768' as const
  },
  {
    name: 'grosell-chat',
    prompt: `Professional Figma UI mockup of WhatsApp commerce interface for "Groway GroSell". Mobile chat-based shopping experience with:
    - WhatsApp-style green header with business name "Your Business Store" and "Online" status
    - Chat bubbles showing product catalog in message format
    - Product cards embedded in chat: Burger R49, Steak R89, Fish R65, Bowl R55 with emoji icons
    - Customer message "Hi! I'd like to see your menu" with timestamp
    - Order confirmation card showing "Order #GS-2847, Total: R113.00"
    - Payment link button within chat
    - WhatsApp green theme (#075E54 header, #DCF8C6 sent bubbles, white received)
    - Bottom input bar with text field and send button
    - Mobile app frame, high fidelity prototype`,
    size: '768x1344' as const
  },
  {
    name: 'grosupply-marketplace',
    prompt: `Professional Figma UI mockup of B2B marketplace for "Groway GroSupply". Desktop e-commerce interface with:
    - Top search bar with category dropdown and supplier filter
    - Category tabs: All, F&B, Liquor, Grocery, Health, Electronics
    - Product grid with cards showing: Maize Meal 10kg R89 (Premier Foods), Cooking Oil 5L R145 (Willowton), Rice 20kg R269 (Tiger Brands), Sugar 10kg R175 (Tongaat Hulett)
    - Each product card has: image placeholder, product name, supplier name, price, "Add to Cart" button
    - Right sidebar cart summary: "3 items, Subtotal R503.00"
    - GroCredit available badge "Credit Limit: R15,000"
    - Orange (#FF9800) accent color theme
    - Professional B2B marketplace design, clean white background`,
    size: '1344x768' as const
  },
  {
    name: 'gopay-dashboard',
    prompt: `Professional Figma UI mockup of payment gateway dashboard for "Groway GoPay". Financial services interface with:
    - Top row metric cards: Today's Volume "R 45,230", Transactions "142", Success Rate "98.5%", Active Devices "24"
    - Purple gradient (#9C27B0) main stats card
    - Real-time transaction feed showing: TXN-4827 R1,250.00 Success, TXN-4826 R890.00 Success, TXN-4825 R2,340.00 Pending
    - Payment methods breakdown donut chart: Card 45%, QR 30%, EFT 15%, PayShap 10%
    - Device status panel showing QR terminals and SmartPOS devices with green "Online" indicators
    - Settlement timeline showing next payout date and amount
    - Dark purple sidebar navigation
    - Professional fintech dashboard design, clean modern UI`,
    size: '1344x768' as const
  },
  {
    name: 'enterprise-dashboard',
    prompt: `Professional Figma UI mockup of multi-branch enterprise dashboard for "Groway Enterprise". Executive management interface with:
    - Company logo "ABC Retail Group" at top
    - Branch selector dropdown: All Branches (5 locations)
    - Consolidated KPI cards: Total Revenue "R 2.3M", All Branches Profit "R 456K", Total Transactions "12,450"
    - Branch performance comparison chart (bar chart): Branch A R580K, Branch B R490K, Branch C R620K, Branch D R380K, Branch E R285K
    - Map showing branch locations with pin markers
    - Inter-branch transfers panel showing pending stock movements
    - Unified customer count across all branches: "45,230 customers"
    - Dark professional theme with corporate blue accents
    - Executive dashboard design, high-end corporate UI`,
    size: '1344x768' as const
  },
  {
    name: 'admin-console',
    prompt: `Professional Figma UI mockup of platform operations dashboard for "Groway Admin Console". Internal operations interface with:
    - Dark sidebar with admin navigation: Dashboard, Merchants, Users, Compliance, Fraud, Analytics, Support, Settings
    - Platform health status cards: System Status "Operational", API Response "45ms", Uptime "99.97%"
    - Recent merchant applications table with status badges (Pending, Approved, Rejected)
    - Fraud alerts panel with red warning indicators
    - Compliance queue showing KYC/KYB pending reviews
    - Support tickets summary: Open 23, In Progress 45, Resolved Today 89
    - Transaction volume real-time chart
    - Platform metrics: Total Merchants "15,230", Active Users "2.5M", Daily Transactions "R47.2M"
    - Professional admin design, dark theme with teal accents`,
    size: '1344x768' as const
  },
  {
    name: 'field-salesforce',
    prompt: `Professional Figma UI mockup of field sales mobile app for "Groway Field Salesforce". Mobile sales agent interface with:
    - Top header showing agent name "Sipho N." and territory "Soweto East"
    - Monthly targets progress bars: New Signups 8/10, Active Visits 45/50, Revenue Target R15K/R20K
    - Today's schedule cards with merchant names, addresses, and appointment times
    - Quick action buttons: Add Lead, Log Visit, Submit Report, View Training
    - Commission tracker showing: Current Month "R 4,560", Pending "R 1,200", YTD "R 52,340"
    - Leaderboard preview showing top performers
    - Training progress: "Product Knowledge 80%, POS Training 60%"
    - Pink/magenta (#E91E63) accent color theme
    - Mobile app frame with bottom navigation, high fidelity prototype`,
    size: '768x1344' as const
  },
  {
    name: 'agent-network',
    prompt: `Professional Figma UI mockup of referral program dashboard for "Groway Agent Network". Mobile agent interface with:
    - Top header with agent tier badge "Gold Agent" and name
    - Earnings summary card: Total Earned "R 12,450", This Month "R 2,340", Pending "R 560"
    - Network visualization showing 5-tier structure with connection lines
    - Referral stats: Direct Referrals "23", Network Size "156", Active Merchants "12"
    - Commission breakdown pie chart: Direct 60%, Tier 2 20%, Tier 3 10%, Tier 4+ 10%
    - Recent referrals list with status (Active, Pending, Inactive)
    - Withdraw button and bank account linked indicator
    - Quick share buttons: WhatsApp, Facebook, Copy Link
    - Cyan (#00BCD4) accent color theme
    - Mobile app frame with bottom navigation, high fidelity prototype`,
    size: '768x1344' as const
  }
];

async function generateMockups() {
  console.log('🎨 Starting Figma mockup generation for Groway Platform...\n');
  
  const zai = await ZAI.create();
  let successCount = 0;
  let failCount = 0;
  
  for (const mockup of mockups) {
    const outputPath = path.join(outputDir, `${mockup.name}-figma.png`);
    
    // Skip if file already exists and is recent
    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      const fileAge = Date.now() - stats.mtimeMs;
      if (fileAge < 24 * 60 * 60 * 1000) { // Less than 24 hours old
        console.log(`⏭️  Skipping ${mockup.name} (already exists)`);
        successCount++;
        continue;
      }
    }
    
    console.log(`🖼️  Generating: ${mockup.name}...`);
    
    try {
      const response = await zai.images.generations.create({
        prompt: mockup.prompt,
        size: mockup.size
      });
      
      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`   ✅ Saved: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed: ${mockup.name} - ${(error as Error).message}`);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Generation complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Output: ${outputDir}`);
}

generateMockups().catch(console.error);
