<template>
  <div id="app-root" :class="rootClass">
    <template v-if="auth.token && route.meta.layout !== 'auth'">
      <Navbar v-if="route.meta.layout !== 'auth'" @toggle-sidebar="sidebarOpen = !sidebarOpen" :hide-sidebar="route.meta.layout === 'shop'" />
      <div class="layout">
        <Sidebar v-if="route.meta.layout === 'sidebar'" :class="{ open: sidebarOpen }" @close="sidebarOpen = false" />
        <div v-if="route.meta.layout === 'sidebar' && sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false" />
        <main class="content">
          <div class="content-body">
            <router-view v-slot="{ Component }">
              <Transition name="page" mode="out-in">
                <component :is="Component" />
              </Transition>
            </router-view>
          </div>
          <Footer />
        </main>
      </div>
    </template>
    <router-view v-else v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import Footer from './components/Footer.vue'
import ToastContainer from './components/ToastContainer.vue'

const sidebarOpen = ref(false)
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const rootClass = computed(() => {
  const cls = {}
  if (sidebarOpen.value) cls['sidebar-open'] = true
  if (route.meta.layout === 'shop') cls['shop-layout'] = true
  return cls
})
useThemeStore()
auth.init()

function onAuthLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => window.addEventListener('auth:logout', onAuthLogout))
onBeforeUnmount(() => window.removeEventListener('auth:logout', onAuthLogout))
</script>

<style>
.page-enter-active, .page-leave-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.page-enter-from { opacity: 0; transform: translateY(8px); }
.page-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
