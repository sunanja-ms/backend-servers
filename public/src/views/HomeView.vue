<template>
  <div class="page">
    <h1>Products</h1>

    <div class="search-bar">
      <input v-model="search" placeholder="Search products..." @input="debouncedSearch" />
      <select v-model="categoryId" @change="fetchProducts" class="form-select">
        <option value="">All Categories</option>
        <option v-for="c in categoryStore.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div v-if="loading" class="product-grid">
      <div v-for="n in 8" :key="n" class="product-card">
        <div class="product-card-image">Loading...</div>
        <div class="product-card-body">
          <div class="skeleton-block" style="height:16px;width:80%;margin-bottom:8px" />
          <div class="skeleton-block" style="height:24px;width:50%;margin-bottom:8px" />
          <div class="skeleton-block" style="height:12px;width:30%" />
        </div>
      </div>
    </div>

    <div v-else-if="products.length" class="product-grid">
      <div v-for="p in products" :key="p.id" class="product-card" @click="$router.push(`/products/${p.id}`)">
        <div class="product-card-image">
          {{ p.images?.length ? '' : 'No Image' }}
          <img v-if="p.images?.length" :src="p.images[0].url" :alt="p.name" class="product-card-image" />
        </div>
        <div class="product-card-body">
          <div class="product-card-name">{{ p.name }}</div>
          <div class="product-card-price text-idr">{{ formatIDR(p.price) }}</div>
          <div class="product-card-footer">
            <span class="product-card-stock">{{ p.stock > 0 ? p.stock + ' in stock' : 'Out of stock' }}</span>
            <span :class="p.stock > 0 ? 'badge-success' : 'badge-error'" class="badge">{{ p.stock > 0 ? 'Available' : 'Sold Out' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="shop-empty">
      <h3>No products found</h3>
      <p>{{ search ? 'Try a different search term.' : 'No products available yet.' }}</p>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <span class="pagination-info">Page {{ page }} of {{ totalPages }} ({{ total }} total)</span>
      <div class="pagination-buttons">
        <button class="btn btn-sm" :disabled="page <= 1" @click="goPage(page - 1)">Prev</button>
        <button class="btn btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategoryStore } from '../stores/categories'
import { getProducts } from '../api/products'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const products = ref([])
const loading = ref(true)
const search = ref(route.query.search || '')
const categoryId = ref(route.query.categoryId || '')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
let debounceTimer

const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val))

function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetchProducts() }, 300)
}

function goPage(p) { page.value = p; fetchProducts() }

async function fetchProducts() {
  loading.value = true
  try {
    const params = { page: page.value, limit: 12, search: search.value || undefined, isActive: 'true' }
    if (categoryId.value) params.categoryId = categoryId.value
    const res = await getProducts(params)
    products.value = res.data.data || []
    total.value = res.data.total ?? 0
    totalPages.value = Math.ceil(total.value / 12)
  } catch { products.value = []; total.value = 0; totalPages.value = 0 }
  finally { loading.value = false }
}

onMounted(() => {
  categoryStore.fetchCategories()
  fetchProducts()
})
</script>
