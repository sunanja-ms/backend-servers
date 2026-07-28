<template>
  <div class="stream-view">
    <div class="stream-header">
      <h1>Video Stream</h1>
      <p class="stream-subtitle">HLS Adaptive Streaming — 6 resolutions available</p>
    </div>
    <div class="player-wrapper">
      <VideoPlayer :master-url="masterUrl" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VideoPlayer from '../components/VideoPlayer.vue'
import { getMasterUrl } from '../api/stream'

const masterUrl = ref('')

onMounted(() => {
  masterUrl.value = getMasterUrl()
})
</script>

<style scoped>
.stream-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}
.stream-header {
  margin-bottom: 24px;
}
.stream-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: var(--text-primary, #e0e0e0);
}
.stream-subtitle {
  margin: 0;
  color: var(--text-secondary, #888);
  font-size: 14px;
}
.player-wrapper {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
}
</style>
