<template>
  <div class="page">
    <button class="btn btn-sm" @click="$router.push('/products')">← Back to Products</button>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else-if="product">
      <h1>{{ product.name }}</h1>
      <div class="card">
        <p><strong>Description:</strong> {{ product.description || 'No description' }}</p>
        <p><strong>Price:</strong> ${{ product.price }}</p>
        <p><strong>Stock:</strong> {{ product.stock }}</p>
        <p>
          <strong>Status:</strong>
          <span :class="product.isActive ? 'badge-success' : 'badge-error'">
            {{ product.isActive ? 'Active' : 'Inactive' }}
          </span>
        </p>
        <p class="text-muted">Created: {{ new Date(product.createdAt).toLocaleString() }}</p>
        <p class="text-muted">Updated: {{ new Date(product.updatedAt).toLocaleString() }}</p>
      </div>

      <div class="card mt-4">
        <h3>Quick Stock Update</h3>
        <form @submit.prevent="handleStock" class="inline-form">
          <input v-model.number="stockQty" type="number" placeholder="Quantity (+/-)" />
          <button type="submit" class="btn btn-primary" :disabled="!stockQty">Update</button>
        </form>
        <div v-if="stockMsg" :class="stockMsg.type === 'error' ? 'alert alert-error' : 'alert alert-success'">
          {{ stockMsg.text }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProduct, updateStock } from '../api/products'

const route = useRoute()
const product = ref(null)
const loading = ref(true)
const error = ref('')
const stockQty = ref(0)
const stockMsg = ref(null)

async function fetchProduct() {
  try {
    const res = await getProduct(route.params.id)
    product.value = res.data.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Product not found'
  } finally {
    loading.value = false
  }
}

async function handleStock() {
  stockMsg.value = null
  try {
    await updateStock(product.value.id, { quantity: stockQty.value })
    await fetchProduct()
    stockMsg.value = { type: 'success', text: 'Stock updated!' }
    stockQty.value = 0
  } catch (err) {
    stockMsg.value = { type: 'error', text: err.response?.data?.message || 'Failed' }
  }
}

onMounted(fetchProduct)
</script>
