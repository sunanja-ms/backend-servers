<template>
  <div class="page">
    <h1>Dashboard</h1>

    <div class="stats-grid">
      <div class="stat-card" @click="$router.push('/products')" style="cursor:pointer">
        <div class="stat-label">Active Products</div>
        <div class="stat-value">{{ stats.activeProducts }}</div>
        <div class="stat-detail">{{ stats.lowStockCount }} low stock</div>
      </div>
      <div class="stat-card" @click="$router.push('/orders')" style="cursor:pointer">
        <div class="stat-label">Orders</div>
        <div class="stat-value">{{ stats.totalOrders }}</div>
        <div class="stat-detail">{{ ordersLast14 }} in last 14 days</div>
      </div>
      <div class="stat-card" v-if="auth.isAdmin" @click="$router.push('/users')" style="cursor:pointer">
        <div class="stat-label">Users</div>
        <div class="stat-value">{{ stats.totalUsers }}</div>
        <div class="stat-detail">registered</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Revenue</div>
        <div class="stat-value text-idr">{{ formatIDR(stats.totalRevenue) }}</div>
        <div class="stat-detail">paid: {{ formatIDR(stats.paidRevenue) }}</div>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:1.4fr 1fr">
      <div class="card">
        <h2>Orders, last 14 days</h2>
        <svg v-if="points" class="sparkline" viewBox="0 0 300 90" preserveAspectRatio="none" role="img" aria-label="Orders per day">
          <polyline :points="points" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          <polygon :points="areaPoints" fill="var(--primary)" opacity="0.12" />
        </svg>
        <p v-else class="text-muted">No order data yet.</p>
        <p class="text-muted" style="font-size:12px;margin:0">{{ series[0]?.date }} → {{ series[series.length - 1]?.date }}</p>
      </div>

      <div class="card">
        <h2>Low stock</h2>
        <div class="inline-form" style="margin:10px 0">
          <label style="font-size:13px" for="threshold">Below</label>
          <input id="threshold" v-model.number="threshold" type="number" min="0" max="1000" style="width:90px" @change="loadLowStock" />
          <button class="btn btn-sm" @click="loadLowStock">Refresh</button>
        </div>
        <div v-if="lowStock.length">
          <div v-for="p in lowStock" :key="p.id" class="low-stock-row">
            <div>
              <div style="font-size:14px">{{ p.name }}</div>
              <div class="text-muted" style="font-size:12px">{{ p.stock }} left</div>
            </div>
            <button class="btn btn-sm btn-success" @click="restock(p)">Add 10</button>
          </div>
        </div>
        <p v-else class="text-muted">All products are above the threshold.</p>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:1fr 1fr">
      <div class="card">
        <h2>Quick Actions</h2>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">
          <button class="btn btn-primary btn-full" @click="$router.push('/products')">Manage Products</button>
          <button class="btn btn-primary btn-full" @click="$router.push('/orders')">View Orders</button>
          <button v-if="auth.isAdmin" class="btn btn-primary btn-full" @click="$router.push('/categories')">Manage Categories</button>
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
import { formatIDR } from '../utils/format'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { getOverview } from '../api/stats'
import { getLowStock, updateStock } from '../api/products'
import { getOrders } from '../api/orders'
import SkeletonTable from '../components/SkeletonTable.vue'

const auth = useAuthStore()
const toast = useToastStore()
const stats = ref({
  totalOrders: 0, totalRevenue: '0', paidRevenue: '0', totalUsers: 0,
  activeProducts: 0, lowStockCount: 0, series: [],
})
const lowStock = ref([])
const recentOrders = ref([])
const loadingOrders = ref(true)
const threshold = ref(10)

const series = computed(() => stats.value.series || [])
const ordersLast14 = computed(() => series.value.reduce((sum, day) => sum + day.orders, 0))

// Scale the 14 values into a 300x90 box.
const points = computed(() => {
  if (!series.value.length) return ''
  const peak = Math.max(1, ...series.value.map((d) => d.orders))
  return series.value
    .map((d, i) => `${(i / (series.value.length - 1)) * 300},${88 - (d.orders / peak) * 80}`)
    .join(' ')
})
const areaPoints = computed(() => (points.value ? `0,90 ${points.value} 300,90` : ''))


async function loadStats() {
  try {
    const res = await getOverview(threshold.value)
    stats.value = res.data.data || res.data
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to load stats')
  }
}

async function loadLowStock() {
  try {
    const res = await getLowStock(threshold.value)
    lowStock.value = res.data.data || []
  } catch { lowStock.value = [] }
}

async function restock(product) {
  try {
    await updateStock(product.id, { quantity: 10 })
    toast.success(`Added 10 to ${product.name}`)
    await Promise.all([loadLowStock(), loadStats()])
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed')
  }
}

onMounted(async () => {
  await Promise.all([loadStats(), loadLowStock()])
  try {
    const res = await getOrders({ page: 1, limit: 5 })
    recentOrders.value = res.data.data || []
  } catch {}
  finally { loadingOrders.value = false }
})
</script>
