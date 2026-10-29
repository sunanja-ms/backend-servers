<template>
  <Transition name="modal" appear>
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content" role="dialog" aria-modal="true">
        <button class="modal-close" aria-label="Close" @click="$emit('close')">×</button>
        <h2 v-if="title">{{ title }}</h2>
        <slot />
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({ title: String })
defineEmits(['close'])
</script>
