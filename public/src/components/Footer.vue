<template>
  <footer class="footer">
    <p>© {{ year }} E-Store — Fastify · Vue 3 · HLS</p>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
