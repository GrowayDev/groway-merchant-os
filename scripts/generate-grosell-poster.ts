// Script to generate GroSell demo video poster
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

async function generatePoster() {
  console.log('Generating GroSell demo video poster...')
  
  const zai = await ZAI.create()
  
  const prompt = `A professional mobile commerce app demo screenshot showing WhatsApp shopping interface. Clean modern UI with teal green and white color scheme. Features include: product catalog with item images, Buy Now Pay Later option with "2x" badge, Laybye payment plan button, Add to Cart functionality, and South African Rand prices (R). Modern smartphone frame with rounded corners. High quality, professional app screenshot style.`
  
  try {
    const response = await zai.images.generations.create({
      prompt,
      size: '1344x768' // Landscape for video poster
    })
    
    const imageBase64 = response.data[0].base64
    const buffer = Buffer.from(imageBase64, 'base64')
    
    const outputPath = path.join(process.cwd(), 'public', 'grosell-demo-poster.png')
    fs.writeFileSync(outputPath, buffer)
    
    console.log(`✓ Poster saved to: ${outputPath}`)
    console.log(`  File size: ${buffer.length} bytes`)
    
    return outputPath
  } catch (error) {
    console.error('Failed to generate poster:', error)
    throw error
  }
}

generatePoster()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
