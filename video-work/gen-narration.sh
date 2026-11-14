#!/bin/bash
# Generate TTS narration for each scene of the Groway demo video
cd /home/z/my-project/video-work/narration

declare -A SCRIPTS

SCRIPTS[01]="This is Groway. The operating system powering South Africa's spaza shops, tuckshops and food businesses."
SCRIPTS[02]="Across South Africa, more than one hundred and forty thousand informal shops keep communities fed. Yet most run on paper, guesswork and cash. Invisible to banks and suppliers alike."
SCRIPTS[03]="Groway Merchant OS changes that. In under a minute, a shop owner registers and opens a live dashboard: today's sales, stock value, low stock alerts and profit. All in one place, offline first, on any device she already owns."
SCRIPTS[04]="Stock outs are the number one killer of township retail. Groway tracks every item, with expiry alerts and automatic reorder points. So shelves never go empty, and money is not lost to expired stock."
SCRIPTS[05]="Every sale is recorded instantly. Cash, card or stokvel. That means accurate daily reports, V A T ready accounting, and a digital record a bank can finally trust."
SCRIPTS[06]="Because Groway sees real turnover, lenders see real data. GroCredit turns sales history into working capital. Stock financing sized to what the shop actually sells, not who you know."
SCRIPTS[07]="Loyalty points, birthday offers and WhatsApp campaigns bring customers back. Regulars become members, and members spend up to thirty percent more."
SCRIPTS[08]="The built in Learning Academy teaches pricing, food safety and bookkeeping in plain language. Practical skills, from shop setup to SARS ready records, right inside the till."
SCRIPTS[09]="When it is time to restock, Grosupply connects the shop directly to over fifty verified wholesalers. Maize, oil, fresh produce, cosmetics and more, at bulk prices, delivered to the door. No more middleman markups."
SCRIPTS[10]="GoPay makes getting paid safe and instant. QR payments, airtime, bill payments and settlements. Cutting the risk of holding cash in the shop."
SCRIPTS[11]="For wholesalers and franchises, the Enterprise portal manages entire merchant networks. Consolidated reporting, inter branch stock transfers, and white label platforms at scale."
SCRIPTS[12]="From Soweto to Stellenbosch, Groway levels the playing field for South African retailers. Groway Merchant OS. Run your shop like a corporate. Book your demo today."

for key in 01 02 03 04 05 06 07 08 09 10 11 12; do
  text="${SCRIPTS[$key]}"
  if [ ! -s "scene$key.wav" ]; then
    echo "Generating scene$key..."
    z-ai tts -i "$text" -o "scene$key.wav" --voice jam --speed 1.0 --format wav && echo "  done: $(ffprobe -v error -show_entries format=duration -of csv=p=0 scene$key.wav)s"
  else
    echo "scene$key exists, skipping"
  fi
done
echo "ALL NARRATION DONE"
