<template>
  <div class="stream-view">
    <div class="stream-header">
      <h1>HLS Streaming</h1>
      <p class="stream-subtitle">Adaptive bitrate playback · 1440p → 240p · authenticated segments</p>
    </div>
    <div class="player-wrapper">
      <VideoPlayer :master-url="masterUrl" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VideoPlayer from '../components/VideoPlayer.vue'
import { getMasterUrl } from '../api/stream'

const masterUrl = ref(getMasterUrl())
</script>
