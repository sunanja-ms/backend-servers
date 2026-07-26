<template>
  <div class="page">
    <h1>Dashboard</h1>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Server Status</div>
        <div class="stat-value" :class="health ? 'text-success' : 'text-error'">
          {{ health ? 'Online' : 'Checking...' }}
        </div>
        <div class="stat-detail" v-if="health">
          Uptime: {{ formatUptime(health.uptime) }}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Database</div>
        <div class="stat-value" :class="health?.database?.status === 'connected' ? 'text-success' : 'text-error'">
          {{ health?.database?.status || 'unknown' }}
        </div>
        <div class="stat-detail" v-if="health?.database">
          Pool: {{ health.database.totalCount }} total, {{ health.database.idleCount }} idle
        </div>
      </div>
      <div class="stat-card" @click="$router.push('/products')" style="cursor:pointer">
        <div class="stat-label">Products</div>
        <div class="stat-value">{{ products.length }}</div>
        <div class="stat-detail">Click to manage</div>
      </div>
      <div class="stat-card" v-if="auth.isAdmin" @click="$router.push('/users')" style="cursor:pointer">
        <div class="stat-label">Users</div>
        <div class="stat-value">{{ users.length }}</div>
        <div class="stat-detail">Click to manage</div>
      </div>
    </div>
    <div class="section">
      <h2>Recent Products</h2>
      <table v-if="products.length">
        <thead>
          <tr><th>Name</th><th>Price</th><th>Stock</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in products.slice(0, 5)" :key="p.id" @click="$router.push(`/products/${p.id}`)" style="cursor:pointer">
            <td>{{ p.name }}</td>
            <td>${{ p.price }}</td>
            <td>{{ p.stock }}</td>
            <td><span :class="p.isActive ? 'badge-success' : 'badge-error'">{{ p.isActive ? 'Active' : 'Inactive' }}</span></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-muted">No products yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getProducts } from '../api/products'
import { getUsers } from '../api/users'
import axios from 'axios'

const auth = useAuthStore()
const health = ref(null)
const products = ref([])
const users = ref([])

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

onMounted(async () => {
  try {
    const [healthRes, prodRes] = await Promise.all([
      axios.get('/health'),
      getProducts(),
    ])
    health.value = healthRes.data
    products.value = prodRes.data.data || []
  } catch {}

  if (auth.isAdmin) {
    try {
      const userRes = await getUsers()
      users.value = userRes.data.data || []
    } catch {}
  }
})
</script>
