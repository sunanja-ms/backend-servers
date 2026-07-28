#!/bin/sh
INPUT="/root/backend/backend-server/src/storage/1.mp4"
OUTPUT="/root/backend/backend-server/src/storage/hls"
SEGMENT_TIME=4

export FFREPORT="file=/tmp/ffreport.log:level=32"

transcode() {
  NAME=$1
  W=$2
  H=$3
  BITRATE=$4
  MAXRATE=$5
  BUFSIZE=$6

  DIR="$OUTPUT/$NAME"
  mkdir -p "$DIR"

  echo "[$NAME] Transcoding ${W}x${H} @ ${BITRATE}..."

  ffmpeg -nostdin -nostats -loglevel warning \
    -i "$INPUT" \
    -r 30 \
    -c:v libx264 \
    -preset ultrafast \
    -tune zerolatency \
    -crf 28 \
    -vf "scale=$W:$H:force_original_aspect_ratio=decrease,pad=$W:$H:(ow-iw)/2:(oh-ih)/2" \
    -b:v "$BITRATE" \
    -maxrate "$MAXRATE" \
    -bufsize "$BUFSIZE" \
    -x264-params "threads=1:lookahead_threads=1:sliced_threads=1:sync_lookahead=0:rc_lookahead=0" \
    -c:a aac \
    -b:a 96k \
    -ac 2 \
    -ar 44100 \
    -f hls \
    -hls_time "$SEGMENT_TIME" \
    -hls_playlist_type vod \
    -hls_segment_filename "$DIR/segment-%03d.ts" \
    -hls_flags temp_file+independent_segments \
    -hls_list_size 0 \
    -max_muxing_queue_size 1024 \
    "$DIR/playlist.m3u8"

  if [ $? -ne 0 ]; then
    echo "[$NAME] FAILED!"
    exit 1
  fi

  local segs=$(ls "$DIR"/*.ts 2>/dev/null | wc -l)
  echo "[$NAME] Done — $segs segments"
}

rm -rf "$OUTPUT"
mkdir -p "$OUTPUT"

echo "============================================================"
echo "  HLS Transcoder — 1.mp4 → 6 resolutions"
echo "============================================================"
echo "  Input: $INPUT"
echo "  Output: $OUTPUT"
echo ""

transcode "1440p" 2560 1440 "12000k" "12800k" "25600k"
transcode "1080p" 1920 1080 "5000k" "5300k" "10600k"
transcode "720p"  1280 720  "2800k" "2996k" "5992k"
transcode "480p"  854  480  "1400k" "1498k" "2996k"
transcode "360p"  640  360  "800k"  "856k"  "1712k"
transcode "240p"  426  240  "400k"  "428k"  "856k"

echo ""
echo "Generating master playlist..."

cat > "$OUTPUT/master.m3u8" << 'MASTER'
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=12000000,RESOLUTION=2560x1440,NAME="1440p"
1440p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,NAME="1080p"
1080p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720,NAME="720p"
720p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480,NAME="480p"
480p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,NAME="360p"
360p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=426x240,NAME="240p"
240p/playlist.m3u8
MASTER

echo "Master playlist: $OUTPUT/master.m3u8"
echo ""
echo "============================================================"
echo "  Transcoding complete!"
echo "============================================================"
for d in "$OUTPUT"/*/; do
  name=$(basename "$d")
  segs=$(ls "$d"/*.ts 2>/dev/null | wc -l)
  echo "  $name  $segs segments"
done
