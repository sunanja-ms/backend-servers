<template>
  <aside class="sidebar">
    <nav class="sidebar-nav">
      <router-link to="/" class="sidebar-link" exact-active-class="active">
        <span class="icon">📊</span> Dashboard
      </router-link>
      <router-link to="/profile" class="sidebar-link" active-class="active">
        <span class="icon">👤</span> Profile
      </router-link>
      <router-link to="/products" class="sidebar-link" active-class="active">
        <span class="icon">📦</span> Products
      </router-link>
      <router-link v-if="auth.isAdmin" to="/users" class="sidebar-link" active-class="active">
        <span class="icon">👥</span> Users
      </router-link>
      <a href="/docs" target="_blank" class="sidebar-link">
        <span class="icon">📚</span> API Docs
      </a>
    </nav>
  </aside>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>
