import { useThemeStore } from '../stores/theme'

// Applies the saved theme before mount so the first paint already has data-theme.
export default {
  install(app) {
    const theme = useThemeStore()
    theme.apply()
    app.provide('theme', theme)
  },
}
