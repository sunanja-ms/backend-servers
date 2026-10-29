<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <TransitionGroup name="toast" tag="div" class="toast-stack">
        <div
          v-for="n in toast.notifications"
          :key="n.id"
          class="toast"
          :class="'toast-' + n.type"
          :style="{ '--toast-duration': (n.duration || 4000) + 'ms' }"
        >
          <span class="toast-icon" v-html="icons[n.type]" />
          <div class="toast-body">
            <p class="toast-title">{{ titles[n.type] }}</p>
            <p class="toast-msg">{{ n.message }}</p>
          </div>
          <button class="toast-close" aria-label="Tutup" @click="toast.dismiss(n.id)" v-html="closeIcon" />
          <span v-if="n.duration !== 0" class="toast-progress" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

const toast = useToastStore()

const svg = (body, extra = '') =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"${extra}>${body}</svg>`

const icons = {
  success: svg('<path d="M20 6L9 17l-5-5"/>'),
  error: svg('<circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>'),
}

const titles = {
  success: 'Berhasil',
  error: 'Gagal',
  info: 'Info',
}

const closeIcon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>'
</script>
