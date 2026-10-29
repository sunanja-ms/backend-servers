<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <template v-if="auth.isAdmin || auth.isModerator">
        <router-link to="/dashboard" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon" v-html="icons.dashboard" /> Dashboard
        </router-link>
        <router-link to="/products" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon" v-html="icons.products" /> Products
        </router-link>
        <router-link v-if="auth.isAdmin" to="/categories" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon" v-html="icons.categories" /> Categories
        </router-link>
        <router-link to="/orders" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon" v-html="icons.orders" /> Orders
        </router-link>
        <router-link v-if="auth.isAdmin" to="/users" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon" v-html="icons.users" /> Users
        </router-link>
        <router-link to="/api-keys" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon" v-html="icons.keys" /> API Keys
        </router-link>
        <hr class="sidebar-divider" />
      </template>
      <router-link to="/" class="sidebar-link" active-class="active" @click="$emit('close')">
        <span class="icon" v-html="icons.shop" /> Shop
      </router-link>
      <router-link to="/wishlist" class="sidebar-link" active-class="active" @click="$emit('close')">
        <span class="icon" v-html="icons.heart" /> Wishlist
        <span v-if="wishlist.count" class="badge badge-info sidebar-count">{{ wishlist.count }}</span>
      </router-link>
      <router-link to="/stream" class="sidebar-link" active-class="active" @click="$emit('close')">
        <span class="icon" v-html="icons.stream" /> Stream
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useWishlistStore } from '../stores/wishlist'
const auth = useAuthStore()
const wishlist = useWishlistStore()
defineEmits(['close'])

const svg = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`

const icons = {
  dashboard: svg('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  products: svg('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'),
  orders: svg('<path d="M8 3h8a2 2 0 0 1 2 2v14l-6-3-6 3V5a2 2 0 0 1 2-2z"/><path d="M9 8h6M9 12h4"/>'),
  users: svg('<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M18 20a5 5 0 0 0-2-4"/>'),
  keys: svg('<circle cx="8" cy="12" r="4"/><path d="M12 12h9"/><path d="M18 12v3M15.5 12v2"/>'),
  shop: svg('<path d="M4 9h16l-1 11H5L4 9z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/>'),
  heart: svg('<path d="M12 20s-7-4.3-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.7 12 20 12 20z"/>'),
  categories: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  stream: svg('<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M10 9.5l5 2.5-5 2.5z"/>'),
}
</script>
