import { execSync, spawnSync } from 'child_process';
import { mkdirSync, existsSync, readdirSync, rmSync, writeFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '..', '..');
const INPUT = join(ROOT, 'src', 'storage', '1.mp4');
const OUTPUT = join(ROOT, 'src', 'storage', 'hls');
const SEGMENT_TIME = 4;

const resolutions = [
  { name: '1440p', width: 2560, height: 1440, bitrate: '12000k', maxrate: '12800k', bufsize: '25600k' },
  { name: '1080p', width: 1920, height: 1080, bitrate: '5000k', maxrate: '5300k', bufsize: '10600k' },
  { name: '720p',  width: 1280, height: 720,  bitrate: '2800k', maxrate: '2996k', bufsize: '5992k' },
  { name: '480p',  width: 854,  height: 480,  bitrate: '1400k', maxrate: '1498k', bufsize: '2996k' },
  { name: '360p',  width: 640,  height: 360,  bitrate: '800k',  maxrate: '856k',  bufsize: '1712k' },
  { name: '240p',  width: 426,  height: 240,  bitrate: '400k',  maxrate: '428k',  bufsize: '856k' },
];

if (!existsSync(INPUT)) {
  console.error('Input file not found:', INPUT);
  process.exit(1);
}

console.log('='.repeat(60));
console.log('  HLS Transcoder — 1.mp4 → 6 resolutions');
console.log('='.repeat(60));
console.log(`  Input: ${INPUT}`);
console.log(`  Output: ${OUTPUT}`);
console.log(`  Resolutions: ${resolutions.map(r => r.name).join(', ')}`);
console.log('');

if (existsSync(OUTPUT)) {
  console.log('Cleaning previous output...');
  rmSync(OUTPUT, { recursive: true });
}

mkdirSync(OUTPUT, { recursive: true });

for (const res of resolutions) {
  const outDir = join(OUTPUT, res.name);
  mkdirSync(outDir, { recursive: true });

  const playlist = join(outDir, 'playlist.m3u8');
  const segPattern = join(outDir, 'segment-%03d.ts');

  console.log(`[${res.name}] Transcoding ${res.width}x${res.height} @ ${res.bitrate}...`);

  const args = [
    '-i', INPUT,
    '-r', '30',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-crf', '28',
    '-vf', `scale=${res.width}:${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2`,
    '-b:v', res.bitrate,
    '-maxrate', res.maxrate,
    '-bufsize', res.bufsize,
    '-x264-params', 'threads=1:lookahead_threads=1:sliced_threads=1:sync_lookahead=0:rc_lookahead=0',
    '-c:a', 'aac',
    '-b:a', '96k',
    '-ac', '2',
    '-ar', '44100',
    '-f', 'hls',
    '-hls_time', String(SEGMENT_TIME),
    '-hls_playlist_type', 'vod',
    '-hls_segment_filename', segPattern,
    '-hls_flags', 'temp_file+independent_segments',
    '-hls_list_size', '0',
    '-max_muxing_queue_size', '1024',
    playlist,
  ];

  const result = spawnSync('ffmpeg', args, { stdio: 'pipe' });
  if (result.error) {
    console.error(`[${res.name}] ERROR:`, result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[${res.name}] FFmpeg failed (exit ${result.status}):`);
    console.error(result.stderr.toString().split('\n').slice(-10).join('\n'));
    process.exit(1);
  }

  const segments = readdirSync(outDir).filter(f => f.endsWith('.ts')).length;
  console.log(`[${res.name}] Done — ${segments} segments`);
}

console.log('\nGenerating master playlist...');

const masterLines = ['#EXTM3U', '#EXT-X-VERSION:3'];
for (const res of resolutions) {
  const outDir = join(OUTPUT, res.name);
  const segments = readdirSync(outDir).filter(f => f.endsWith('.ts'));
  const segmentDuration = SEGMENT_TIME * segments.length;
  masterLines.push(
    '',
    `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(res.bitrate) * 1000},RESOLUTION=${res.width}x${res.height},NAME="${res.name}"`,
    `${res.name}/playlist.m3u8`
  );
}

const masterPlaylist = join(OUTPUT, 'master.m3u8');
writeFileSync(masterPlaylist, masterLines.join('\n') + '\n');

console.log(`Master playlist: ${masterPlaylist}`);
console.log('');
console.log('='.repeat(60));
console.log('  Transcoding complete!');
console.log('='.repeat(60));
console.log(`  ${OUTPUT}/master.m3u8`);
for (const res of resolutions) {
  const outDir = join(OUTPUT, res.name);
  const segCount = readdirSync(outDir).filter(f => f.endsWith('.ts')).length;
  const playlistSize = statSync(join(outDir, 'playlist.m3u8')).size;
  console.log(`  ${res.name.padEnd(8)} ${segCount} segments, playlist ${(playlistSize / 1024).toFixed(1)} KB`);
}
