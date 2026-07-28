<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <template v-if="auth.isAdmin || auth.isModerator">
        <router-link to="/dashboard" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon">📊</span> Dashboard
        </router-link>
        <router-link to="/products" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon">📦</span> Products
        </router-link>
        <router-link to="/orders" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon">📋</span> Orders
        </router-link>
        <router-link v-if="auth.isAdmin" to="/users" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon">👥</span> Users
        </router-link>
        <router-link to="/api-keys" class="sidebar-link" active-class="active" @click="$emit('close')">
          <span class="icon">🔑</span> API Keys
        </router-link>
        <hr class="sidebar-divider" />
      </template>
      <router-link to="/" class="sidebar-link" active-class="active" @click="$emit('close')">
        <span class="icon">🏪</span> Shop
      </router-link>
      <router-link to="/stream" class="sidebar-link" active-class="active" @click="$emit('close')">
        <span class="icon">🎬</span> Stream
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
defineEmits(['close'])
</script>
