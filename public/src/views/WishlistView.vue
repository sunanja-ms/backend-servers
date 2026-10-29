<template>
  <div class="page">
    <div class="page-header">
      <h1>Wishlist</h1>
      <span class="text-muted">{{ items.length }} saved</span>
    </div>

    <div v-if="loading" class="loading">Loading wishlist...</div>

    <div v-else-if="items.length" class="product-grid">
      <div v-for="item in items" :key="item.id" class="product-card" @click="$router.push(`/products/${item.id}`)">
        <button class="product-card-fav is-active" title="Remove from wishlist" @click.stop="remove(item)">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.3-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.7 12 20 12 20z"/></svg>
        </button>
        <div class="product-card-image">
          <img v-if="item.images?.length" :src="item.images.find(i => i.isPrimary)?.url || item.images[0].url" :alt="item.name" />
          <template v-else>No Image</template>
        </div>
        <div class="product-card-body">
          <div class="product-card-name">{{ item.name }}</div>
          <div class="product-card-price text-idr">{{ formatIDR(item.price) }}</div>
          <div class="product-card-footer">
            <span class="product-card-stock">{{ item.stock > 0 ? item.stock + ' in stock' : 'Out of stock' }}</span>
            <button class="btn btn-sm btn-primary" :disabled="item.stock < 1" @click.stop="addToCart(item)">Add</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="shop-empty">
      <h3>Nothing saved yet</h3>
      <p>Tap the heart on a product to keep it here.</p>
      <router-link to="/" class="btn btn-primary" style="margin-top:12px;display:inline-block">Browse products</router-link>
    </div>
  </div>
</template>

<script setup>
import { formatIDR } from '../utils/format'
import { ref, onMounted } from 'vue'
import { getWishlist } from '../api/wishlist'
import { useWishlistStore } from '../stores/wishlist'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'

const wishlist = useWishlistStore()
const cartStore = useCartStore()
const toast = useToastStore()
const items = ref([])
const loading = ref(true)


async function load() {
  loading.value = true
  try {
    const res = await getWishlist()
    items.value = res.data.data || []
    wishlist.loaded = true
    wishlist.ids = items.value.map((i) => i.id)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to load wishlist')
  } finally {
    loading.value = false
  }
}

async function remove(item) {
  try {
    await wishlist.toggle(item.id)
    items.value = items.value.filter((i) => i.id !== item.id)
    toast.success('Removed from wishlist')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed')
  }
}

async function addToCart(item) {
  try {
    await cartStore.addItem(item.id, 1)
    toast.success(`Added ${item.name} to cart`)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed')
  }
}

onMounted(load)
</script>
