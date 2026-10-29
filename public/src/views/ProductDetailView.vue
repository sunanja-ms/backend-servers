<template>
  <div class="page detail-page">
    <div v-if="loading" class="loading">Memuat produk...</div>

    <template v-else-if="product">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <router-link to="/">Beranda</router-link>
        <span>/</span>
        <router-link v-if="product.category" :to="{ path: '/', query: { categoryId: product.category.id } }">{{ product.category.name }}</router-link>
        <span v-if="product.category">/</span>
        <span class="breadcrumb-current">{{ product.name }}</span>
      </nav>

      <div class="detail-layout">
        <div class="detail-gallery">
          <div class="gallery-main">
            <img v-if="activeImage" :src="activeImage" :alt="product.name" />
            <div v-else class="card-media-empty">Tidak ada gambar</div>
          </div>
          <div v-if="product.images?.length > 1" class="gallery-thumbs">
            <button
              v-for="img in product.images"
              :key="img.id"
              class="gallery-thumb"
              :class="{ active: activeImage === img.url }"
              @click="activeUrl = img.url"
            >
              <img :src="img.url" :alt="product.name" />
            </button>
          </div>
        </div>

        <div class="buy-box">
          <h1 class="detail-title">{{ product.name }}</h1>

          <div class="detail-meta">
            <span :class="product.stock > 0 ? 'text-muted' : 'badge badge-error'">{{ product.stock > 0 ? `Stok ${product.stock}` : 'Stok habis' }}</span>
            <span class="dot">·</span>
            <span class="text-muted">{{ product.category?.name || 'Tanpa kategori' }}</span>
          </div>

          <div class="price-block">
            <span class="price-block-label">Harga</span>
            <span class="price-block-value">{{ formatIDR(product.price) }}</span>
          </div>

          <div class="qty-row">
            <span class="form-label">Jumlah</span>
            <div class="qty-stepper">
              <button type="button" :disabled="qty <= 1" @click="qty = Math.max(1, qty - 1)">−</button>
              <input v-model.number="qty" type="number" min="1" :max="Math.max(product.stock, 1)" @change="clampQty" />
              <button type="button" :disabled="qty >= product.stock" @click="qty = Math.min(product.stock, qty + 1)">+</button>
            </div>
            <span class="text-muted qty-hint">{{ product.stock > 0 ? `Sisa ${product.stock}` : 'Habis' }}</span>
          </div>

          <div class="detail-actions">
            <button class="btn btn-primary btn-full" :disabled="product.stock < 1 || adding" @click="addToCart(false)">
              {{ adding ? 'Menambahkan...' : product.stock < 1 ? 'Stok Habis' : 'Tambah ke Keranjang' }}
            </button>
            <button class="btn btn-full btn-buy" :disabled="product.stock < 1 || adding" @click="addToCart(true)">Beli Sekarang</button>
          </div>

          <button class="btn btn-ghost btn-full wish-btn" :class="{ 'is-active': wishlist.has(product.id) }" @click="toggleWish">
            <svg viewBox="0 0 24 24" width="16" height="16" :fill="wishlist.has(product.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.3-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.7 12 20 12 20z" /></svg>
            {{ wishlist.has(product.id) ? 'Tersimpan di Wishlist' : 'Simpan ke Wishlist' }}
          </button>

          <div class="seller-row">
            <div class="seller-avatar">{{ sellerInitial }}</div>
            <div>
              <div class="seller-name">{{ sellerName }}</div>
              <div class="text-muted">Penjual produk ini</div>
            </div>
          </div>
        </div>
      </div>

      <section class="detail-section">
        <h2>Deskripsi Produk</h2>
        <p class="detail-description">{{ product.description || 'Penjual belum menambahkan deskripsi.' }}</p>
      </section>

      <section class="detail-section">
        <h2>Informasi Produk</h2>
        <dl class="spec-table">
          <div><dt>Kategori</dt><dd>{{ product.category?.name || 'Tanpa kategori' }}</dd></div>
          <div><dt>Stok</dt><dd>{{ product.stock }}</dd></div>
          <div><dt>Penjual</dt><dd>{{ sellerName }}</dd></div>
          <div><dt>Diperbarui</dt><dd>{{ formatDate(product.updatedAt) }}</dd></div>
        </dl>
      </section>

      <section v-if="similar.length" class="detail-section">
        <h2>Produk Serupa</h2>
        <div class="shop-grid shop-grid-compact">
          <router-link v-for="p in similar" :key="p.id" :to="`/products/${p.id}`" class="shop-card">
            <div class="card-media">
              <img v-if="p.images?.length" :src="p.images[0].url" :alt="p.name" loading="lazy" />
              <div v-else class="card-media-empty">Tidak ada gambar</div>
            </div>
            <div class="shop-card-body">
              <div class="shop-card-name">{{ p.name }}</div>
              <div class="price-tag">{{ formatIDR(p.price) }}</div>
            </div>
          </router-link>
        </div>
      </section>
    </template>

    <div v-else class="shop-empty">
      <h3>Produk tidak ditemukan</h3>
      <router-link to="/" class="btn btn-primary">Lihat produk lain</router-link>
    </div>
  </div>
</template>

<script setup>
import { formatIDR } from '../utils/format'
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct, getProducts } from '../api/products'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'
import { useWishlistStore } from '../stores/wishlist'
import { pushRecentId } from '../utils/recent'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toast = useToastStore()
const wishlist = useWishlistStore()

const product = ref(null)
const similar = ref([])
const loading = ref(true)
const qty = ref(1)
const adding = ref(false)
const activeUrl = ref('')

const activeImage = computed(() => activeUrl.value || product.value?.images?.[0]?.url || '')
const sellerName = computed(() => product.value?.user?.name || 'Penjual')
const sellerInitial = computed(() => (product.value?.user?.name || 'P').charAt(0).toUpperCase())

const formatDate = (val) => (val ? new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-')

function clampQty() {
  const max = Math.max(product.value?.stock ?? 1, 1)
  qty.value = Math.min(Math.max(Number(qty.value) || 1, 1), max)
}

async function toggleWish() {
  try {
    const added = await wishlist.toggle(product.value.id)
    toast.success(added ? 'Disimpan ke wishlist' : 'Dihapus dari wishlist')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Wishlist gagal diperbarui')
  }
}

async function addToCart(goCheckout) {
  if (!product.value || product.value.stock < 1) return
  adding.value = true
  try {
    clampQty()
    await cartStore.addItem(product.value.id, qty.value)
    toast.success(`${qty.value} × ${product.value.name} masuk keranjang`)
    if (goCheckout) router.push('/checkout')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Gagal menambah ke keranjang')
  } finally {
    adding.value = false
  }
}

async function loadSimilar(current) {
  try {
    const params = { limit: 6, isActive: 'true' }
    if (current.categoryId) params.categoryId = current.categoryId
    const res = await getProducts(params)
    similar.value = (res.data.data || []).filter((p) => p.id !== current.id).slice(0, 5)
  } catch {
    similar.value = []
  }
}

onMounted(async () => {
  try {
    const res = await getProduct(route.params.id)
    product.value = res.data.data
    if (product.value) {
      pushRecentId(product.value.id)
      wishlist.load()
      loadSimilar(product.value)
    }
  } catch {
    product.value = null
  } finally {
    loading.value = false
  }
})
</script>
