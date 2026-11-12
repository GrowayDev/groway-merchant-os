const pptxgen = require('pptxgenjs');
const html2pptx = require('./skills/ppt/scripts/html2pptx');
const path = require('path');
const fs = require('fs');

async function createPitchDeck() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Merchant OS - Investor Pitch Deck';
  pptx.author = 'Merchant OS Team';
  pptx.company = 'Merchant OS (Pty) Ltd';
  pptx.subject = 'Series A Investment Opportunity';
  
  // Font configuration for Sandstone theme
  const fontConfig = { cjk: 'Microsoft YaHei', latin: 'Palatino Linotype' };
  
  const slidesDir = './pitch-deck-slides';
  const slideFiles = [
    'slide01-cover.html',
    'slide02-problem.html',
    'slide03-solution.html',
    'slide04-features.html',
    'slide05-market.html',
    'slide06-business-model.html',
    'slide07-traction.html',
    'slide08-competitive.html',
    'slide09-financials.html',
    'slide10-funding.html',
    'slide11-closing.html'
  ];
  
  console.log('Creating Merchant OS Investor Pitch Deck...\n');
  
  const allWarnings = [];
  
  for (let i = 0; i < slideFiles.length; i++) {
    const slideFile = slideFiles[i];
    const slidePath = path.join(slidesDir, slideFile);
    
    if (!fs.existsSync(slidePath)) {
      console.error(`Slide file not found: ${slidePath}`);
      continue;
    }
    
    console.log(`Processing slide ${i + 1}/${slideFiles.length}: ${slideFile}`);
    
    try {
      const { slide, warnings } = await html2pptx(slidePath, pptx, { fontConfig });
      
      if (warnings && warnings.length > 0) {
        console.log(`  Warnings for ${slideFile}:`);
        warnings.forEach(w => {
          console.log(`    - ${w}`);
          allWarnings.push(`${slideFile}: ${w}`);
        });
      } else {
        console.log(`  ✓ Slide processed successfully`);
      }
    } catch (error) {
      console.error(`  ✗ Error processing ${slideFile}:`, error.message);
    }
  }
  
  const outputPath = './MerchantOS_Investor_Pitch_Deck.pptx';
  await pptx.writeFile({ fileName: outputPath });
  
  console.log(`\n✓ Pitch deck created: ${outputPath}`);
  console.log(`  Total slides: ${slideFiles.length}`);
  
  if (allWarnings.length > 0) {
    console.log(`\nWarnings summary (${allWarnings.length} total):`);
    allWarnings.forEach(w => console.log(`  - ${w}`));
  }
  
  return outputPath;
}

createPitchDeck().catch(err => {
  console.error('Failed to create pitch deck:', err);
  process.exit(1);
});
