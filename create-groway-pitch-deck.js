const pptxgen = require('pptxgenjs');
const html2pptx = require('./skills/ppt/scripts/html2pptx');
const path = require('path');
const fs = require('fs');

async function createPitchDeck() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Groway - Investor Pitch Deck';
  pptx.author = 'Groway Team';
  pptx.company = 'Groway (Pty) Ltd';
  pptx.subject = 'Series A Investment Opportunity';
  
  const fontConfig = { cjk: 'Microsoft YaHei', latin: 'Trebuchet MS' };
  
  const slidesDir = './groway-pitch-deck';
  const slideFiles = [
    'slide01-cover.html',
    'slide02-problem.html',
    'slide03-solution.html',
    'slide04-platform.html',
    'slide05-consumer.html',
    'slide06-merchant.html',
    'slide07-commerce.html',
    'slide08-gopay.html',
    'slide09-market.html',
    'slide10-business-model.html',
    'slide11-traction.html',
    'slide12-financials.html',
    'slide13-funding.html',
    'slide14-closing.html'
  ];
  
  console.log('Creating Groway Platform Investor Pitch Deck...\n');
  
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
        console.log(`  Warnings: ${warnings.length}`);
      } else {
        console.log(`  ✓ Slide processed`);
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    }
  }
  
  const outputPath = './public/Groway_Investor_Pitch_Deck.pptx';
  await pptx.writeFile({ fileName: outputPath });
  
  console.log(`\n✓ Pitch deck created: ${outputPath}`);
  console.log(`  Total slides: ${slideFiles.length}`);
  
  return outputPath;
}

createPitchDeck().catch(err => {
  console.error('Failed to create pitch deck:', err);
  process.exit(1);
});
