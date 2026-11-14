#!/bin/bash
# Compose the final 3-minute Groway Merchant OS demo video.
# - 14 scenes (16 frames — scenes 5 & 6 split across multiple screenshots)
# - Ken Burns zoom on each frame
# - Narration audio (14 TTS chunks, concatenated + sped up 1.3x)
# - Caption overlays via drawtext

set -e
cd /home/z/my-project/video-assets

FRAMES=frames
AUDIO=audio
SEGS=segments
OUT=groway-demo-final.mp4

rm -rf "$SEGS" && mkdir -p "$SEGS"

# Scene durations (seconds) — based on TTS chunk durations / 1.3x speedup
# Format: "frame.png duration caption_text"
SCENES=(
  "01-cold-open.png|9.6|In 2024, 22 South African children died."
  "02-quote.png|6.2|President Ramaphosa, 15 November 2024"
  "03-numbers.png|22.0|150,000 spaza shops · R100bn illicit trade · 0 prosecutions"
  "04-spaza-dashboard.png|9.6|Groway Merchant OS — Spaza vertical"
  "05a-spaza-pos.png|6.2|POS — ring up a sale in seconds"
  "05b-spaza-inventory.png|6.2|Inventory — every unit tracked"
  "05c-spaza-accounting.png|6.2|Accounting — real-time P&L"
  "06a-grocredit.png|7.7|GroCredit — stock-now-pay-later"
  "06b-grosupply.png|7.7|GroSupply — 73 verified suppliers"
  "07-restaurant.png|19.2|Restaurant vertical — same OS, different config"
  "08-salon.png|17.6|Beauty salon vertical — bookings, CRM, loyalty"
  "09-pharmacy.png|10.8|Pharmacy vertical — schedule drugs, NAPPI, SAPE"
  "10-sape-landing.png|11.2|SAPE — Supply-chain Authentication & Product Enforcement"
  "10-sape-landing.png|20.2|AUTHENTIC · Verified in 482 ms · Signed custody chain"
  "12-sape-counterfeit.png|24.2|COUNTERFEIT DETECTED · SAHPRA + SAPS + SARS notified"
  "13-why.png|12.3|The next Naledi never happens."
  "14-close.png|15.4|Designed and Built by Motheto Selepe"
)

# Find a usable font for drawtext
FONT=$(find /usr/share/fonts -name "DejaVuSans-Bold.ttf" 2>/dev/null | head -1)
if [ -z "$FONT" ]; then FONT=$(find /usr/share/fonts -name "*.ttf" 2>/dev/null | head -1); fi
echo "Using font: $FONT"

echo "=== Step 1: Create video segments ==="
SEG_LIST="$SEGS/list.txt"
> "$SEG_LIST"
i=0
for scene in "${SCENES[@]}"; do
  IFS='|' read -r frame dur caption <<< "$scene"
  frame_path="$FRAMES/$frame"
  if [ ! -f "$frame_path" ]; then
    echo "  WARN: $frame not found, skipping"
    continue
  fi
  i=$((i+1))
  seg=$(printf "%s/seg_%02d.mp4" "$SEGS" "$i")
  echo "  [$i] $frame (${dur}s) — $caption"
  # Scale to 1920x1080 with padding, apply subtle Ken Burns zoom, add caption
  # Escape caption for drawtext (escape : ' \ %)
  esc_caption=$(echo "$caption" | sed "s/:/\\\\:/g; s/'/\\\\'/g; s/%/\\\\%/g")
  ffmpeg -y -loop 1 -i "$frame_path" -t "$dur" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,zoompan=z='min(zoom+0.0008,1.12)':d=1:s=1920x1080:fps=25,drawtext=fontfile=${FONT}:text='${esc_caption}':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.6:boxborderw=15:x=(w-text_w)/2:y=h-80" \
    -c:v libx264 -preset fast -pix_fmt yuv420p -tune stillimage \
    "$seg" 2>/dev/null
  echo "file '$seg'" >> "$SEG_LIST"
done

echo "=== Step 2: Concatenate video segments ==="
ffmpeg -y -f concat -safe 0 -i "$SEG_LIST" -c copy "$SEGS/video_no_audio.mp4" 2>/dev/null

echo "=== Step 3: Concatenate + speed up narration audio ==="
# Create audio concat list with 150ms silence between chunks
AUDIO_LIST="$SEGS/audio_list.txt"
> "$AUDIO_LIST"
for i in 01 02 03 04 05 06 07 08 09 10 11 12 13 14; do
  echo "file '$AUDIO/chunk_${i}.wav'" >> "$AUDIO_LIST"
  if [ "$i" != "14" ]; then
    # 150ms silence between chunks
    echo "file '$SEGS/silence.wav'" >> "$AUDIO_LIST"
  fi
done
# Generate 150ms silence
ffmpeg -y -f lavfi -i "anullsrc=channel_layout=mono:sample_rate=24000" -t 0.15 "$SEGS/silence.wav" 2>/dev/null
# Concat audio + speed up 1.3x
ffmpeg -y -f concat -safe 0 -i "$AUDIO_LIST" -af "atempo=1.3" "$SEGS/narration.wav" 2>/dev/null

echo "=== Step 4: Mux video + audio ==="
VID_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SEGS/video_no_audio.mp4")
AUD_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SEGS/narration.wav")
echo "  video: ${VID_DUR}s, audio: ${AUD_DUR}s"
# Use the shorter of the two as the final duration
ffmpeg -y -i "$SEGS/video_no_audio.mp4" -i "$SEGS/narration.wav" \
  -c:v copy -c:a aac -b:a 192k \
  -shortest \
  "$OUT" 2>/dev/null

echo "=== Done ==="
FINAL_DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
FINAL_SIZE=$(stat -c%s "$OUT")
echo "Final video: $OUT"
echo "  Duration: ${FINAL_DUR}s"
echo "  Size: $((FINAL_SIZE / 1024 / 1024)) MB"
