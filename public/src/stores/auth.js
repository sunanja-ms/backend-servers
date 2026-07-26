import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isModerator = computed(() => user.value?.role === 'moderator' || user.value?.role === 'admin')

  function init() {
    if (token.value) {
      fetchUser()
    }
  }

  async function fetchUser() {
    try {
      const res = await getMe()
      user.value = res.data.data
    } catch {
      logout()
    }
  }

  async function login(email, password) {
    loading.value = true
    try {
      const res = await apiLogin({ email, password })
      token.value = res.data.data.token
      user.value = res.data.data.user
      localStorage.setItem('token', token.value)
      return res.data
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, name) {
    loading.value = true
    try {
      const res = await apiRegister({ email, password, name })
      return res.data
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
  }

  return { token, user, loading, isAuthenticated, isAdmin, isModerator, init, fetchUser, login, register, logout }
})
