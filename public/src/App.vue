<template>
  <div id="app-root">
    <Navbar v-if="auth.token" />
    <div class="layout" v-if="auth.token">
      <Sidebar />
      <main class="content">
        <router-view />
      </main>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'

const auth = useAuthStore()
auth.init()
</script>
