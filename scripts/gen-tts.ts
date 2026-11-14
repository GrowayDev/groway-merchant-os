/**
 * Generate 14 TTS narration chunks for the Groway Merchant OS demo video.
 * Uses the z-ai-web-dev-sdk TTS API.
 * Voice: 'jam' (English gentleman — clearest English accent available).
 *
 * Output: /home/z/my-project/video-assets/audio/chunk_01.wav ... chunk_14.wav
 */
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const CHUNKS = [
  "In 2024, twenty-two South African children died. They were poisoned by snacks bought at spaza shops they trusted.",
  "President Ramaphosa confirmed it. Twenty-two children, dead in a matter of weeks.",
  "Six children died in Naledi, Soweto. The youngest was six years old. The cause was Terbufos, a street pesticide sold through spaza shops. One hundred and fifty thousand shops. One hundred billion rand in illicit trade. Twelve months later, zero prosecutions.",
  "This is Groway Merchant OS. One platform. Many verticals. We log in as Mama Thandi, a spaza shop in Soweto.",
  "Her dashboard shows today's sales, top sellers, and low-stock alerts. She opens POS, rings up a sale in seconds. Inventory tracks every unit. Accounting shows real-time profit and loss, all in one screen.",
  "GroCredit gives her stock-now-pay-later terms. GroSupply connects her to seventy-three verified suppliers. Every order is traceable, from warehouse to till. No more cash-and-carry notebooks. No more untraceable stock.",
  "Now we log in as The Hungry Fork, a restaurant. Same operating system, different configuration. A live table floor plan. A kitchen display that routes orders to the right station. The recipe engine auto-depletes inventory.",
  "Switch again. Glamour Hair Studio. A salon bookings calendar. A CRM that remembers every client, every visit, every loyalty point. The online widget fills chairs even when she's away.",
  "And CityMed Pharmacy. Schedule-drug register, NAPPI codes, medical-aid claims. Every vertical, same code, same shared ledger.",
  "Now meet SAPE. Supply-chain Authentication and Product Enforcement. The counterfeit-killing layer that lives inside the till. Every scan verified. Every product, traced.",
  "Back at the till, Mama Thandi scans a snack. Four hundred and twelve milliseconds, green. Authentic. The full custody chain appears. Manufacturer, distributor, wholesaler, spaza. Every handover signed, verified against the manufacturer registry in real time.",
  "She scans a second product. Red. Counterfeit detected. In under one hour, SAHPRA, SAPS, and SARS Customs are all notified automatically. The custody chain is the evidence. And the consumer can scan the same QR code to see all of it.",
  "The Naledi children waited six weeks for a national response. With Groway, the response begins at the till, in minutes, not weeks. The next Naledi never happens.",
  "Traceable supply chains. Instant counterfeit detection. Regulator notification in minutes, not weeks. Groway Merchant OS, designed and built by Motheto Selepe. Built for the township economy."
]

async function main() {
  const outDir = '/home/z/my-project/video-assets/audio'
  fs.mkdirSync(outDir, { recursive: true })

  console.log(`Generating ${CHUNKS.length} TTS chunks with voice 'jam'...`)
  const zai = await ZAI.create()

  for (let i = 0; i < CHUNKS.length; i++) {
    const text = CHUNKS[i]
    const num = String(i + 1).padStart(2, '0')
    const outPath = path.join(outDir, `chunk_${num}.wav`)
    const t0 = Date.now()
    try {
      const response = await zai.audio.tts.create({
        input: text,
        voice: 'jam',
        speed: 0.95,
        response_format: 'wav',
        stream: false,
      })
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(new Uint8Array(arrayBuffer))
      fs.writeFileSync(outPath, buffer)
      console.log(`  [${num}] ${text.length} chars -> ${buffer.length} bytes in ${Date.now() - t0}ms`)
    } catch (e) {
      console.error(`  [${num}] FAILED:`, e)
      process.exit(1)
    }
  }
  console.log('All chunks generated.')
}

main().catch(e => { console.error(e); process.exit(1) })
