import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const THEME_MODES = ['light', 'dark', 'system']

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('theme')
  const mode = ref(THEME_MODES.includes(saved) ? saved : 'system')

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const systemDark = ref(media.matches)

  const dark = computed(() => (mode.value === 'system' ? systemDark.value : mode.value === 'dark'))

  function apply() {
    document.documentElement.setAttribute('data-theme', dark.value ? 'dark' : 'light')
  }

  function setMode(next) {
    if (!THEME_MODES.includes(next)) return
    mode.value = next
    localStorage.setItem('theme', next)
  }

  function toggle() {
    setMode(dark.value ? 'light' : 'dark')
  }

  watch(dark, apply, { immediate: true })

  media.addEventListener('change', (e) => {
    systemDark.value = e.matches
  })

  return { mode, dark, setMode, toggle, apply }
})
