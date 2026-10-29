<template>
  <div id="app-root" :class="rootClass">
    <template v-if="auth.token && route.meta.layout !== 'auth'">
      <Navbar :hide-sidebar="route.meta.layout === 'shop'" @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <div class="layout">
        <Sidebar v-if="route.meta.layout === 'sidebar'" :class="{ open: sidebarOpen }" @close="sidebarOpen = false" />
        <div v-if="route.meta.layout === 'sidebar'" class="sidebar-overlay" @click="sidebarOpen = false" />
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useWishlistStore } from './stores/wishlist'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import Footer from './components/Footer.vue'
import ToastContainer from './components/ToastContainer.vue'

const sidebarOpen = ref(false)
const auth = useAuthStore()
const wishlist = useWishlistStore()
const router = useRouter()
const route = useRoute()

const rootClass = computed(() => ({
  'shop-layout': route.meta.layout === 'shop',
  'sidebar-open': sidebarOpen.value,
}))

auth.init()

watch(() => route.fullPath, () => { sidebarOpen.value = false })

function onAuthLogout() {
  auth.logout()
  wishlist.reset()
  router.push('/login')
}

onMounted(() => window.addEventListener('auth:logout', onAuthLogout))
onBeforeUnmount(() => window.removeEventListener('auth:logout', onAuthLogout))
</script>
