#!/bin/bash
# Assemble the Groway 3-minute demo video
# Scenes: intro card, landing, login->dashboard, 5 sidebar views, grosupply, gopay, enterprise, outro card
set -e
cd /home/z/my-project/video-work
mkdir -p segments narration-fast final

# 1. Time-compress narration 1.2x (pitch preserving) to fit ~3 minutes
for i in 01 02 03 04 05 06 07 08 09 10 11 12; do
  if [ ! -s "narration-fast/scene$i.wav" ]; then
    ffmpeg -y -v error -i "narration/scene$i.wav" -af "atempo=1.2" -ar 44100 "narration-fast/scene$i.wav"
  fi
done
echo "narration compressed"

# scene durations (narration/1.2 + ~1s tail, rounded to 0.1)
declare -A DUR
DUR[s01]=10.6; DUR[s02]=16.0; DUR[s03]=22.5; DUR[s04]=15.6
DUR[s05]=15.2; DUR[s06]=17.1; DUR[s07]=13.9; DUR[s08]=12.7
DUR[s09]=18.9; DUR[s10]=12.8; DUR[s11]=14.5; DUR[s12]=13.9

# source video + trim offset (keep END for app scenes so the target view is visible)
declare -A SRC OFF
SRC[s01]="";                                     OFF[s01]=0
SRC[s02]="raw/s02/$(ls raw/s02 | head -1)";      OFF[s02]=0
SRC[s03]="raw/s03/$(ls raw/s03 | head -1)";      OFF[s03]=0        # keep first (login typing)
SRC[s04]="raw/s04/$(ls raw/s04 | head -1)";      OFF[s04]=calc
SRC[s05]="raw/s05/$(ls raw/s05 | head -1)";      OFF[s05]=calc
SRC[s06]="raw/s06/$(ls raw/s06 | head -1)";      OFF[s06]=calc
SRC[s07]="raw/s07/$(ls raw/s07 | head -1)";      OFF[s07]=calc
SRC[s08]="raw/s08/$(ls raw/s08 | head -1)";      OFF[s08]=calc
SRC[s09]="raw/s09/$(ls raw/s09 | head -1)";      OFF[s09]=calc
SRC[s10]="raw/s10/$(ls raw/s10 | head -1)";      OFF[s10]=calc
SRC[s11]="raw/s11/$(ls raw/s11 | head -1)";      OFF[s11]=calc
SRC[s12]="";                                     OFF[s12]=0

dur_of() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1" 2>/dev/null; }

for s in s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12; do
  d=${DUR[$s]}
  n="narration-fast/scene${s#s}.wav"
  if [ -s "segments/$s.mp4" ]; then echo "$s exists"; continue; fi

  if [ "${SRC[$s]}" = "" ]; then
    # card scene (intro/outro PNG)
    img="intro.png"; [ "$s" = "s12" ] && img="outro.png"
    ffmpeg -y -v error -loop 1 -i "$img" -i "$n" \
      -af "apad=whole_dur=$d" -t "$d" \
      -vf "scale=1280:720,fps=30,format=yuv420p" \
      -c:v libx264 -preset veryfast -crf 22 -c:a aac -b:a 128k "segments/$s.mp4"
  else
    src="${SRC[$s]}"
    srcdur=$(dur_of "$src")
    off=0
    if [ "${OFF[$s]}" = "calc" ]; then
      off=$(echo "$srcdur - $d" | bc -l 2>/dev/null || awk -v a="$srcdur" -v b="$d" 'BEGIN{print a-b}')
      # clamp >= 0
      off=$(awk -v o="$off" 'BEGIN{print (o<0)?0:o}')
    fi
    ffmpeg -y -v error -ss "$off" -i "$src" -t "$d" \
      -vf "scale=1280:720,fps=30,format=yuv420p" -an \
      -c:v libx264 -preset veryfast -crf 22 "segments/${s}_v.mp4"
    ffmpeg -y -v error -i "$n" -af "apad=whole_dur=$d" -t "$d" -ar 44100 \
      -c:a aac -b:a 128k "segments/${s}_a.m4a"
    ffmpeg -y -v error -i "segments/${s}_v.mp4" -i "segments/${s}_a.m4a" \
      -c:v copy -c:a copy -shortest "segments/$s.mp4"
    rm -f "segments/${s}_v.mp4" "segments/${s}_a.m4a"
  fi
  echo "$s assembled (${d}s)"
done

# 2. concat
> final/list.txt
for s in s01 s02 s03 s04 s05 s06 s07 s08 s09 s10 s11 s12; do
  echo "file '/home/z/my-project/video-work/segments/$s.mp4'" >> final/list.txt
done
ffmpeg -y -v error -f concat -safe 0 -i final/list.txt -c copy \
  -movflags +faststart /home/z/my-project/video-work/final/groway-demo.mp4

echo "=== FINAL ==="
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 /home/z/my-project/video-work/final/groway-demo.mp4
