<template>
  <div class="page">
    <h1>Dashboard</h1>

    <div class="stats-grid">
      <div class="stat-card" @click="$router.push('/products')" style="cursor:pointer">
        <div class="stat-label">Total Products</div>
        <div class="stat-value">{{ totalProducts }}</div>
        <div class="stat-detail">{{ activeProducts }} active</div>
      </div>
      <div class="stat-card" @click="$router.push('/orders')" style="cursor:pointer">
        <div class="stat-label">Orders</div>
        <div class="stat-value">{{ totalOrders }}</div>
        <div class="stat-detail">{{ pendingOrders }} pending</div>
      </div>
      <div class="stat-card" v-if="auth.isAdmin" @click="$router.push('/users')" style="cursor:pointer">
        <div class="stat-label">Users</div>
        <div class="stat-value">{{ totalUsers }}</div>
        <div class="stat-detail">{{ activeUsers }} active</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Revenue</div>
        <div class="stat-value text-idr">{{ formatIDR(revenue) }}</div>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <h2>Quick Actions</h2>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
          <button class="btn btn-primary btn-full" @click="$router.push('/products')">Manage Products</button>
          <button class="btn btn-primary btn-full" @click="$router.push('/orders')">View Orders</button>
          <button v-if="auth.isAdmin" class="btn btn-primary btn-full" @click="$router.push('/users')">Manage Users</button>
        </div>
      </div>
      <div class="card">
        <h2>Account</h2>
        <div style="margin-top:12px">
          <p><strong>{{ auth.user?.name }}</strong></p>
          <p class="text-muted">{{ auth.user?.email }}</p>
          <p>Role: <span class="badge">{{ auth.user?.role }}</span></p>
        </div>
        <button class="btn btn-sm" style="margin-top:12px" @click="$router.push('/profile')">View Profile</button>
      </div>
    </div>

    <div class="section" style="margin-top:24px">
      <h2>Recent Orders</h2>
      <div v-if="loadingOrders"><SkeletonTable :rows="3" :columns="4" /></div>
      <div class="table-wrap" v-else-if="recentOrders.length"><table>
        <thead><tr><th>Order #</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          <tr v-for="o in recentOrders" :key="o.id" @click="$router.push(`/orders/${o.id}`)" style="cursor:pointer">
            <td>#{{ o.id }}</td>
            <td>{{ o.items?.length || 0 }} item(s)</td>
            <td class="text-idr">{{ formatIDR(o.total) }}</td>
            <td><span :class="'order-status-badge order-status-' + o.status">{{ o.status }}</span></td>
          </tr>
        </tbody>
      </table></div>
      <p v-else class="text-muted">No orders yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getProducts } from '../api/products'
import { getOrders } from '../api/orders'
import { getUsers } from '../api/users'
import SkeletonTable from '../components/SkeletonTable.vue'

const auth = useAuthStore()
const totalProducts = ref(0)
const activeProducts = ref(0)
const totalOrders = ref(0)
const pendingOrders = ref(0)
const totalUsers = ref(0)
const activeUsers = ref(0)
const revenue = ref(0)
const recentOrders = ref([])
const loadingOrders = ref(true)

const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val))

onMounted(async () => {
  try {
    const prodRes = await getProducts({ page: 1, limit: 100 })
    const all = prodRes.data.data || []
    totalProducts.value = prodRes.data.total ?? all.length
    activeProducts.value = all.filter(p => p.isActive).length
  } catch {}

  try {
    const ordRes = await getOrders({ page: 1, limit: 5 })
    recentOrders.value = ordRes.data.data || []
    totalOrders.value = ordRes.data.total ?? 0
    revenue.value = recentOrders.value
      .filter(o => o.status === 'delivered')
      .reduce((s, o) => s + Number(o.total), 0)
    pendingOrders.value = recentOrders.value.filter(o => o.status === 'pending').length
  } catch {} finally { loadingOrders.value = false }

  if (auth.isAdmin) {
    try {
      const userRes = await getUsers({ page: 1, limit: 100 })
      const all = userRes.data.data || []
      totalUsers.value = userRes.data.total ?? all.length
      activeUsers.value = all.filter(u => u.isActive).length
    } catch {}
  }
})
</script>
