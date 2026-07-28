<template>
  <div class="page" style="max-width:800px">
    <div v-if="loading" class="loading">Loading product...</div>

    <div v-else-if="product">
      <div class="page-header">
        <h1>{{ product.name }}</h1>
      </div>

      <div class="stats-grid" style="grid-template-columns:1fr 1fr">
        <div class="card">
          <div class="product-card-price text-idr" style="font-size:32px;margin-bottom:12px">{{ formatIDR(product.price) }}</div>
          <p>{{ product.description || 'No description' }}</p>
          <p style="margin-top:12px"><strong>Stock:</strong> {{ product.stock > 0 ? product.stock : 'Out of stock' }}</p>
          <p><strong>Category:</strong> {{ product.category?.name || 'Uncategorized' }}</p>
          <p><strong>Status:</strong> <span :class="product.isActive ? 'badge-success' : 'badge-error'">{{ product.isActive ? 'Active' : 'Inactive' }}</span></p>
        </div>
        <div class="card">
          <div v-if="product.images?.length">
            <img :src="product.images[0].url" :alt="product.name" style="width:100%;border-radius:8px;max-height:300px;object-fit:cover" />
          </div>
          <div v-else class="product-card-image" style="height:200px">No Image</div>
          <div class="form-group" style="margin-top:16px">
            <label>Quantity</label>
            <div class="cart-item-qty">
              <button @click="qty = Math.max(1, qty - 1)">−</button>
              <span>{{ qty }}</span>
              <button @click="qty = Math.min(product.stock, qty + 1)">+</button>
            </div>
          </div>
          <button class="btn btn-primary btn-full" :disabled="product.stock < 1 || adding" @click="addToCart">
            {{ adding ? 'Adding...' : (product.stock < 1 ? 'Out of Stock' : 'Add to Cart') }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="shop-empty">
      <h3>Product not found</h3>
      <router-link to="/" class="btn btn-primary" style="margin-top:12px;display:inline-block">Browse Products</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProduct } from '../api/products'
import { useCartStore } from '../stores/cart'
import { useToastStore } from '../stores/toast'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toast = useToastStore()
const product = ref(null)
const loading = ref(true)
const qty = ref(1)
const adding = ref(false)

const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val))

async function addToCart() {
  if (!product.value || product.value.stock < 1) return
  adding.value = true
  try {
    await cartStore.addItem(product.value.id, qty.value)
    toast.success(`Added ${qty.value} × ${product.value.name} to cart`)
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to add to cart')
  } finally { adding.value = false }
}

onMounted(async () => {
  try {
    const res = await getProduct(route.params.id)
    product.value = res.data.data
  } catch { product.value = null }
  finally { loading.value = false }
})
</script>
