<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="n in toast.notifications"
          :key="n.id"
          class="toast"
          :class="'toast-' + n.type"
        >
          <span class="toast-icon">{{ icons[n.type] }}</span>
          <span class="toast-msg">{{ n.message }}</span>
          <button class="toast-close" @click="toast.dismiss(n.id)">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '../stores/toast'

const toast = useToastStore()

const icons = { success: '✓', error: '✕', info: 'ℹ' }
</script>

<style scoped>
.toast-container {
  position: fixed; bottom: 24px; right: 24px; z-index: 9999;
  display: flex; flex-direction: column; gap: 8px; max-width: 400px;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  font-size: 14px; line-height: 1.4;
}
.toast-success { background: #d4edda; color: #155724; }
.toast-error { background: #f8d7da; color: #721c24; }
.toast-info { background: #d1ecf1; color: #0c5460; }
.toast-icon { font-weight: 700; font-size: 16px; }
.toast-msg { flex: 1; }
.toast-close { background: none; border: none; font-size: 18px; cursor: pointer; opacity: 0.6; padding: 0; line-height: 1; }
.toast-close:hover { opacity: 1; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(40px); }
.toast-leave-to { opacity: 0; transform: translateX(40px); }
</style>
