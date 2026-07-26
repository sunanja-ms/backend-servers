<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')">&times;</button>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
</script>
