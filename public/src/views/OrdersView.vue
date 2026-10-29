<template>
  <div class="page" style="max-width:800px">
    <h1>My Orders</h1>

    <div v-if="loading" class="loading">Loading orders...</div>

    <div v-else-if="orders.length">
      <div v-for="order in orders" :key="order.id" class="order-card" @click="$router.push(`/orders/${order.id}`)" style="cursor:pointer">
        <div class="order-card-header">
          <div>
            <div class="order-card-id">Order #{{ order.id }}</div>
            <div class="order-card-date">{{ new Date(order.createdAt).toLocaleDateString('en-GB') }}</div>
          </div>
          <span :class="'order-status-badge order-status-' + order.status">{{ order.status }}</span>
        </div>
        <div class="order-card-items">{{ order.items?.length || 0 }} item(s)</div>
        <div class="order-card-total text-idr">{{ formatIDR(order.total) }}</div>
      </div>
      <div class="pagination" v-if="totalPages > 1">
        <span class="pagination-info">Page {{ page }} of {{ totalPages }} ({{ total }} total)</span>
        <div class="pagination-buttons">
          <button class="btn btn-sm" :disabled="page <= 1" @click="goPage(page - 1)">Prev</button>
          <button class="btn btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">Next</button>
        </div>
      </div>
    </div>

    <div v-else class="shop-empty">
      <h3>No orders yet</h3>
      <p>Start shopping to see your orders here.</p>
      <router-link to="/" class="btn btn-primary" style="margin-top:12px;display:inline-block">Browse Products</router-link>
    </div>
  </div>
</template>

<script setup>
import { formatIDR } from '../utils/format'
import { ref, onMounted } from 'vue'
import { getOrders } from '../api/orders'

const orders = ref([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)


function goPage(p) { page.value = p; fetchOrders() }

async function fetchOrders() {
  loading.value = true
  try {
    const res = await getOrders({ page: page.value, limit: 10 })
    orders.value = res.data.data || []
    total.value = res.data.total ?? 0
    totalPages.value = Math.ceil(total.value / 10)
  } catch { orders.value = []; total.value = 0; totalPages.value = 0 }
  finally { loading.value = false }
}

onMounted(fetchOrders)
</script>
