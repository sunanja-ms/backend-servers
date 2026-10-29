import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 0
const MAX_VISIBLE = 4

export const useToastStore = defineStore('toast', () => {
  const notifications = ref([])

  function show(type, message, duration = 4000) {
    const id = ++nextId
    // Keep the stack short so old toasts never cover the page.
    if (notifications.value.length >= MAX_VISIBLE) notifications.value.shift()
    notifications.value.push({ id, type, message, duration })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id) {
    const idx = notifications.value.findIndex((n) => n.id === id)
    if (idx !== -1) notifications.value.splice(idx, 1)
  }

  function success(msg, duration) { return show('success', msg, duration) }
  function error(msg, duration) { return show('error', msg, duration) }
  function info(msg, duration) { return show('info', msg, duration) }

  return { notifications, show, dismiss, success, error, info }
})
