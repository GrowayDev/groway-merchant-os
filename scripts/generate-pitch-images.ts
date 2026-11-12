import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const outputDir = './pitch-deck-assets';

async function generateImage(prompt: string, size: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440', filename: string) {
  try {
    console.log(`Generating: ${filename}...`);
    const zai = await ZAI.create();

    const response = await zai.images.generations.create({
      prompt,
      size
    });

    const base64 = response?.data?.[0]?.base64;
    if (!base64) {
      console.error(`No image data for ${filename}`);
      return null;
    }

    const buffer = Buffer.from(base64, 'base64');
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ Saved: ${outputPath}`);
    return outputPath;
  } catch (err: any) {
    console.error(`✗ Failed ${filename}:`, err?.message || err);
    return null;
  }
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const images = [
    {
      prompt: "Modern fintech platform hero image, African small business owner using tablet in retail store, digital payment interface, vibrant marketplace setting, professional product photography, warm lighting, high quality",
      size: '1440x720' as const,
      filename: 'hero-cover.png'
    },
    {
      prompt: "Clean modern software dashboard interface mockup, point of sale system, sales analytics charts, inventory management, dark mode UI, professional tech product photography, minimalist design, high quality",
      size: '1344x768' as const,
      filename: 'product-dashboard.png'
    },
    {
      prompt: "African marketplace with small businesses, digital transformation concept, mobile payment technology, growing economy visualization, aerial view of bustling market, warm sunlight, professional photography, high quality",
      size: '1344x768' as const,
      filename: 'market-opportunity.png'
    },
    {
      prompt: "Diverse team of entrepreneurs collaborating in modern office, startup team meeting, business strategy discussion, professional photography, bright natural lighting, high quality",
      size: '1344x768' as const,
      filename: 'team-collab.png'
    },
    {
      prompt: "Financial growth chart, upward trending graph, business success visualization, money coins stacking, investment returns concept, clean modern design, professional illustration, high quality",
      size: '1024x1024' as const,
      filename: 'financial-growth.png'
    }
  ];

  console.log('Generating pitch deck images...\n');
  
  for (const img of images) {
    await generateImage(img.prompt, img.size, img.filename);
  }

  console.log('\n✓ Image generation complete!');
}

main();
