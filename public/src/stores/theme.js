import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('theme')
  const osDark = window.matchMedia('(prefers-color-scheme: dark)')
  const dark = ref(saved ? saved === 'dark' : osDark.matches)
  const followSystem = ref(!saved)

  function apply(val) {
    document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
  }

  function toggle() {
    followSystem.value = false
    dark.value = !dark.value
    localStorage.setItem('theme', dark.value ? 'dark' : 'light')
  }

  function onOSChange(e) {
    if (followSystem.value) {
      dark.value = e.matches
    }
  }

  watch(dark, apply, { immediate: true })

  osDark.addEventListener('change', onOSChange)

  return { dark, toggle, followSystem }
})
