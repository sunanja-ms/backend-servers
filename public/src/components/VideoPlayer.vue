<template>
  <div class="video-player">
    <div class="video-container" ref="container" @dblclick="onDblClick">
      <video ref="videoEl" class="plyr-video" :poster="poster"></video>
      <div v-if="errorMsg" class="error-overlay">{{ errorMsg }}</div>
      <div v-if="buffering && !paused" class="buffering-overlay">
        <div class="spinner"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Hls from 'hls.js'
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

const props = defineProps({
  masterUrl: { type: String, required: true },
  poster: { type: String, default: '' },
})

const container = ref(null)
const videoEl = ref(null)
let hls = null
let player = null
let switchingLevel = false
const paused = ref(true)
const buffering = ref(false)
const errorMsg = ref('')
let controlsTimer = null
let networkRetries = 0

function createAuthLoader() {
  const Loader = Hls.DefaultConfig.loader
  return class AuthLoader extends Loader {
    load(context, config, callbacks) {
      const token = localStorage.getItem('token')
      if (token) {
        context.headers = { ...context.headers, 'Authorization': `Bearer ${token}` }
      }
      super.load(context, config, callbacks)
    }
  }
}

function initPlayer() {
  if (!videoEl.value || !props.masterUrl) return
  errorMsg.value = ''
  networkRetries = 0
  const url = props.masterUrl

  if (Hls.isSupported()) {
    hls = new Hls({
      startLevel: -1,
      autoStartLoad: true,
      enableWorker: true,
      debug: false,
      loader: createAuthLoader(),
    })

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      player = new Plyr(videoEl.value, {
        controls: [
          'play-large', 'play', 'progress', 'current-time',
          'duration', 'mute', 'volume', 'captions', 'settings',
          'pip', 'airplay', 'fullscreen',
        ],
        settings: ['quality', 'speed'],
        speed: { selected: 1, options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] },
        quality: {
          default: 0,
          options: buildPlyrQualityOptions(),
          forced: true,
          onChange: (quality) => {
            if (!hls) return
            switchingLevel = true
            if (quality === 0) { hls.currentLevel = -1; switchingLevel = false; return }
            const idx = hls.levels.findIndex(l => l.height === quality)
            if (idx >= 0) hls.currentLevel = idx
          },
        },
        ratio: '16:9',
        resetOnEnd: true,
      })

      player.on('play', () => { paused.value = false })
      player.on('pause', () => { paused.value = true })

      if (player.fullscreen) {
        container.value?.addEventListener('fullscreenchange', () => {
          paused.value = videoEl.value?.paused ?? true
        })
      }
    })

    hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
      if (!player || data.level < 0) return
      const height = hls?.levels[data.level]?.height
      if (height) { switchingLevel = false; player.quality = height }
    })

    hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
      if (!player || switchingLevel) return
      player.quality = data.level === -1 ? 0 : (hls?.levels[data.level]?.height || 0)
    })

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) return
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError()
      } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR && networkRetries < 2) {
        networkRetries++
        hls.startLoad()
      } else {
        errorMsg.value = 'Stream failed to load. Sign in again and check the server.'
        hls.destroy()
        hls = null
      }
    })

    hls.on(Hls.Events.FRAG_LOADING, () => { buffering.value = true })
    hls.on(Hls.Events.FRAG_LOADED, () => { buffering.value = false })

    hls.loadSource(url)
    hls.attachMedia(videoEl.value)

  } else if (videoEl.value.canPlayType('application/vnd.apple.mpegurl')) {
    videoEl.value.src = url
    player = new Plyr(videoEl.value, {
      controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
      settings: ['speed'],
      speed: { selected: 1, options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] },
    })
  }
}

function buildPlyrQualityOptions() {
  if (!hls?.levels) return []
  const heights = [...new Set(hls.levels.map(l => l.height).filter(h => h > 0))]
  return heights.sort((a, b) => b - a).concat(0)
}

function onDblClick() {
  if (player?.fullscreen) {
    player.fullscreen.toggle()
  } else if (container.value) {
    container.value.requestFullscreen()
  }
}

onMounted(() => {
  initPlayer()
})

onBeforeUnmount(() => {
  if (player) { player.destroy(); player = null }
  if (hls) { hls.destroy(); hls = null }
  clearTimeout(controlsTimer)
})

watch(() => props.masterUrl, () => {
  if (player) { player.destroy(); player = null }
  if (hls) { hls.destroy(); hls = null }
  initPlayer()
})
</script>

<style scoped>
.video-player {
  width: 100%;
  background: #000;
  line-height: 0;
}
.video-container {
  position: relative;
  width: 100%;
}
.video-container :deep(.plyr) {
  width: 100%;
}
.video-container :deep(.plyr__video-wrapper) {
  background: #000;
}
.video-container :deep(.plyr--full-ui input[type=range]) {
  color: #e53935;
}
.buffering-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
}
.error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  font-size: 0.9rem;
  text-align: center;
  z-index: 11;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top: 3px solid #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>