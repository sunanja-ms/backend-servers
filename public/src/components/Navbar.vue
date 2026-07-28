<template>
  <nav class="navbar">
    <div class="navbar-left">
      <button v-if="!hideSidebar" class="sidebar-toggle" @click="$emit('toggle-sidebar')">☰</button>
      <router-link to="/" class="navbar-logo">E-Store</router-link>
    </div>
    <div class="navbar-search" v-if="showSearch">
      <input v-model="search" placeholder="Search products..." @keyup.enter="doSearch" />
    </div>
    <div class="navbar-right">
      <button class="nav-cart-btn" @click="$router.push('/cart')" title="Cart">
        🛒<span v-if="cartStore.totalItems" class="cart-badge">{{ cartStore.totalItems }}</span>
      </button>
      <router-link to="/orders" class="nav-link">Orders</router-link>
      <div class="nav-user-dropdown">
        <button class="nav-user-btn" @click="showDropdown = !showDropdown">
          {{ auth.user?.name || 'User' }} ▾
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'

defineProps({ hideSidebar: Boolean })
defineEmits(['toggle-sidebar'])

const auth = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()
const route = useRoute()
const search = ref('')
const showDropdown = ref(false)

const showSearch = computed(() => route.meta.layout === 'shop' || route.path === '/')

function doSearch() {
  if (search.value.trim()) {
    router.push({ path: '/', query: { search: search.value.trim() } })
  }
}

function logout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => cartStore.fetchCart())
</script>
