<template>
  <div class="page shop-page">
    <div class="shop-toolbar">
      <div class="shop-toolbar-row">
        <div class="shop-search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
          <input v-model="search" placeholder="Cari produk..." aria-label="Cari produk" @input="debouncedSearch" />
          <button v-if="search" class="shop-search-clear" title="Hapus pencarian" @click="clearSearch">×</button>
        </div>

        <div class="sort-tabs" role="tablist">
          <button
            v-for="option in SORTS"
            :key="option.key"
            class="sort-tab"
            :class="{ active: sort === option.key }"
            :aria-selected="sort === option.key"
            role="tab"
            @click="setSort(option.key)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <div class="category-chips">
        <button class="chip" :class="{ active: !categoryId }" @click="setCategory('')">Semua</button>
        <button
          v-for="c in categoryStore.categories"
          :key="c.id"
          class="chip"
          :class="{ active: String(categoryId) === String(c.id) }"
          @click="setCategory(c.id)"
        >
          {{ c.name }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="shop-grid">
      <div v-for="n in SKELETONS" :key="n" class="skeleton-card">
        <div class="skeleton-block" style="aspect-ratio:1;width:100%;margin-bottom:10px" />
        <div class="skeleton-block" style="height:12px;width:85%;margin-bottom:8px" />
        <div class="skeleton-block" style="height:18px;width:55%" />
      </div>
    </div>

    <div v-else-if="products.length" class="shop-grid">
      <router-link v-for="p in products" :key="p.id" :to="`/products/${p.id}`" class="shop-card">
        <div class="card-media">
          <img v-if="p.images?.length" :src="p.images[0].url" :alt="p.name" loading="lazy" />
          <div v-else class="card-media-empty">Tidak ada gambar</div>
          <span v-if="p.stock < 1" class="sold-out-ribbon">Habis</span>
          <button
            class="product-card-fav"
            :class="{ 'is-active': wishlist.has(p.id) }"
            :title="wishlist.has(p.id) ? 'Hapus dari wishlist' : 'Simpan ke wishlist'"
            :aria-label="wishlist.has(p.id) ? 'Hapus dari wishlist' : 'Simpan ke wishlist'"
            @click.prevent.stop="toggleWish(p)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" :fill="wishlist.has(p.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.3-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.7 12 20 12 20z" /></svg>
          </button>
        </div>
        <div class="shop-card-body">
          <div class="shop-card-name">{{ p.name }}</div>
          <div class="price-tag">{{ formatIDR(p.price) }}</div>
          <div class="stock-line">{{ p.stock > 0 ? `Stok ${p.stock}` : 'Stok habis' }}</div>
        </div>
      </router-link>
    </div>

    <div v-else class="shop-empty">
      <h3>Produk tidak ditemukan</h3>
      <p>{{ search ? 'Coba kata kunci lain.' : 'Belum ada produk pada filter ini.' }}</p>
      <button v-if="hasFilters" class="btn btn-primary" @click="resetFilters">Reset filter</button>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <span class="pagination-info">Halaman {{ page }} dari {{ totalPages }} ({{ total }} produk)</span>
      <div class="pagination-buttons">
        <button class="btn btn-sm" :disabled="page <= 1" @click="goPage(page - 1)">Sebelumnya</button>
        <button class="btn btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">Berikutnya</button>
      </div>
    </div>

    <div v-if="recent.length" class="recent-section">
      <h3>Baru dilihat</h3>
      <div class="recent-strip">
        <router-link v-for="p in recent" :key="p.id" :to="`/products/${p.id}`" class="recent-item">
          <img v-if="p.images?.length" :src="p.images[0].url" :alt="p.name" />
          <div v-else class="no-img">No Image</div>
          <span>{{ p.name }}</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatIDR } from '../utils/format'
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCategoryStore } from '../stores/categories'
import { useWishlistStore } from '../stores/wishlist'
import { useToastStore } from '../stores/toast'
import { getProducts, getProduct } from '../api/products'
import { getRecentIds } from '../utils/recent'

const PAGE_SIZE = 20
const SKELETONS = 10
const SORTS = [
  { key: 'new', label: 'Terbaru', sortBy: 'createdAt', sortOrder: 'desc' },
  { key: 'price-asc', label: 'Harga ↑', sortBy: 'price', sortOrder: 'asc' },
  { key: 'price-desc', label: 'Harga ↓', sortBy: 'price', sortOrder: 'desc' },
  { key: 'stock', label: 'Stok', sortBy: 'stock', sortOrder: 'desc' },
]

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()
const wishlist = useWishlistStore()
const toast = useToastStore()

const products = ref([])
const recent = ref([])
const loading = ref(true)
const search = ref(route.query.search || '')
const categoryId = ref(route.query.categoryId || '')
const sort = ref(SORTS.some((s) => s.key === route.query.sort) ? route.query.sort : 'new')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
let debounceTimer

const hasFilters = computed(() => Boolean(search.value || categoryId.value || sort.value !== 'new'))


function syncQuery() {
  const query = {}
  if (search.value) query.search = search.value
  if (categoryId.value) query.categoryId = String(categoryId.value)
  if (sort.value !== 'new') query.sort = sort.value
  router.replace({ query })
}

function applyFilters() {
  page.value = 1
  syncQuery()
  fetchProducts()
}

function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(applyFilters, 300)
}

function clearSearch() {
  search.value = ''
  applyFilters()
}

function setSort(key) {
  sort.value = key
  applyFilters()
}

function setCategory(id) {
  categoryId.value = id
  applyFilters()
}

function resetFilters() {
  search.value = ''
  categoryId.value = ''
  sort.value = 'new'
  applyFilters()
}

function goPage(p) {
  page.value = p
  fetchProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function toggleWish(p) {
  try {
    const added = await wishlist.toggle(p.id)
    toast.success(added ? 'Disimpan ke wishlist' : 'Dihapus dari wishlist')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Wishlist gagal diperbarui')
  }
}

async function fetchProducts() {
  loading.value = true
  try {
    const active = SORTS.find((s) => s.key === sort.value) || SORTS[0]
    const params = {
      page: page.value,
      limit: PAGE_SIZE,
      isActive: 'true',
      sortBy: active.sortBy,
      sortOrder: active.sortOrder,
    }
    if (search.value) params.search = search.value
    if (categoryId.value) params.categoryId = categoryId.value

    const res = await getProducts(params)
    products.value = res.data.data || []
    total.value = res.data.total ?? 0
    totalPages.value = Math.ceil(total.value / PAGE_SIZE)
  } catch {
    products.value = []
    total.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}

async function loadRecent() {
  const ids = getRecentIds()
  if (!ids.length) return
  const results = await Promise.allSettled(ids.map((id) => getProduct(id)))
  recent.value = results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value.data.data)
    .filter((p) => p && p.isActive)
}

onMounted(() => {
  categoryStore.fetchCategories()
  fetchProducts()
  loadRecent()
  wishlist.load()
})
</script>
