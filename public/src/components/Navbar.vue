<template>
  <nav class="navbar">
    <div class="navbar-left">
      <button v-if="!hideSidebar" class="sidebar-toggle" aria-label="Toggle sidebar" @click="$emit('toggle-sidebar')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <router-link to="/" class="navbar-logo">E-Store</router-link>
    </div>

    <div v-if="showSearch" class="navbar-search">
      <input v-model="search" placeholder="Search products..." aria-label="Search products" @keyup.enter="doSearch" />
    </div>

    <div class="navbar-right">
      <div class="theme-switch" role="group" aria-label="Color theme">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          :aria-pressed="theme.mode === opt.value"
          :title="opt.label"
          :aria-label="opt.label"
          @click="theme.setMode(opt.value)"
          v-html="opt.icon"
        />
      </div>

      <button class="nav-cart-btn" title="Cart" aria-label="Cart" @click="$router.push('/cart')">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M3 4h2l2.4 10.4a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.6L21 7H6" /></svg>
        <span v-if="cartStore.totalItems" class="cart-badge">{{ cartStore.totalItems }}</span>
      </button>

      <router-link to="/orders" class="nav-link">Orders</router-link>

      <div ref="dropdownEl" class="nav-user-dropdown" @keydown.esc="showDropdown = false">
        <button class="nav-user-btn" :aria-expanded="showDropdown" @click="showDropdown = !showDropdown">
          {{ auth.user?.name || 'User' }}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <div v-if="showDropdown" class="dropdown-menu" @click="showDropdown = false">
          <router-link to="/profile" class="dropdown-item">Profile</router-link>
          <router-link v-if="auth.isAdmin" to="/dashboard" class="dropdown-item">Admin</router-link>
          <router-link to="/api-keys" class="dropdown-item">API Keys</router-link>
          <hr />
          <button class="dropdown-item" @click="logout">Logout</button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useThemeStore } from '../stores/theme'

defineProps({ hideSidebar: Boolean })
defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const cartStore = useCartStore()
const theme = useThemeStore()
const router = useRouter()
const route = useRoute()
const search = ref('')
const showDropdown = ref(false)
const dropdownEl = ref(null)

function onDocumentClick(event) {
  if (showDropdown.value && dropdownEl.value && !dropdownEl.value.contains(event.target)) {
    showDropdown.value = false
  }
}

const showSearch = computed(() => route.meta.layout === 'shop' || route.path === '/')

const svg = (body) =>
  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

const themeOptions = [
  { value: 'light', label: 'Light', icon: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>') },
  { value: 'dark', label: 'Dark', icon: svg('<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z"/>') },
  { value: 'system', label: 'Follow system', icon: svg('<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>') },
]

function doSearch() {
  if (search.value.trim()) {
    router.push({ path: '/', query: { search: search.value.trim() } })
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  cartStore.fetchCart()
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))
</script>
