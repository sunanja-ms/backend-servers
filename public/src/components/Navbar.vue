<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/" class="navbar-logo">Fastify Admin</router-link>
    </div>
    <div class="navbar-menu">
      <span class="navbar-user">{{ auth.user?.name }}</span>
      <span class="badge">{{ auth.user?.role }}</span>
      <button class="btn btn-sm btn-danger" @click="handleLogout">Logout</button>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
