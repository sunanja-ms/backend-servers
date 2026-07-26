<template>
  <div class="page">
    <div class="page-header">
      <h1>Products</h1>
      <button class="btn btn-primary" @click="showCreate = true">+ New Product</button>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>
              <router-link :to="`/products/${product.id}`">{{ product.name }}</router-link>
            </td>
            <td class="text-muted">{{ product.description || '-' }}</td>
            <td>${{ product.price }}</td>
            <td>
              <span :class="product.stock < 10 ? 'text-error' : ''">{{ product.stock }}</span>
            </td>
            <td>
              <span :class="product.isActive ? 'badge-success' : 'badge-error'">
                {{ product.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn btn-sm" @click="openEdit(product)">Edit</button>
              <button class="btn btn-sm btn-warning" @click="openStock(product)">Stock</button>
              <button class="btn btn-sm" :class="product.isActive ? 'btn-warning' : 'btn-success'" @click="handleToggle(product)">
                {{ product.isActive ? 'Deactivate' : 'Activate' }}
              </button>
              <button class="btn btn-sm btn-danger" @click="handleDelete(product)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!products.length" class="text-muted">No products found.</p>
    </template>

    <!-- Create Modal -->
    <Modal v-if="showCreate" @close="showCreate = false">
      <h2>Create Product</h2>
      <form @submit.prevent="handleCreate">
        <div class="form-group">
          <label>Name</label>
          <input v-model="createForm.name" required />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input v-model="createForm.description" />
        </div>
        <div class="form-group">
          <label>Price</label>
          <input v-model.number="createForm.price" type="number" step="0.01" min="0.01" required />
        </div>
        <div class="form-group">
          <label>Stock</label>
          <input v-model.number="createForm.stock" type="number" min="0" />
        </div>
        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
        <button type="submit" class="btn btn-primary">Create</button>
      </form>
    </Modal>

    <!-- Edit Modal -->
    <Modal v-if="showEdit" @close="showEdit = false">
      <h2>Edit Product</h2>
      <form @submit.prevent="handleEdit">
        <div class="form-group">
          <label>Name</label>
          <input v-model="editForm.name" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input v-model="editForm.description" />
        </div>
        <div class="form-group">
          <label>Price</label>
          <input v-model.number="editForm.price" type="number" step="0.01" />
        </div>
        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
        <button type="submit" class="btn btn-primary">Save</button>
      </form>
    </Modal>

    <!-- Stock Modal -->
    <Modal v-if="showStock" @close="showStock = false">
      <h2>Update Stock: {{ stockProduct?.name }}</h2>
      <p>Current stock: <strong>{{ stockProduct?.stock }}</strong></p>
      <form @submit.prevent="handleStock">
        <div class="form-group">
          <label>Quantity (negative to decrease)</label>
          <input v-model.number="stockQty" type="number" required />
        </div>
        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
        <button type="submit" class="btn btn-primary">Update Stock</button>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getProducts, createProduct, updateProduct, deleteProduct, updateStock, toggleProductStatus } from '../api/products'
import Modal from '../components/Modal.vue'

const products = ref([])
const loading = ref(true)
const error = ref('')
const modalError = ref('')

const showCreate = ref(false)
const showEdit = ref(false)
const showStock = ref(false)
const createForm = reactive({ name: '', description: '', price: 0, stock: 0 })
const editForm = reactive({ id: 0, name: '', description: '', price: 0 })
const stockProduct = ref(null)
const stockQty = ref(0)

async function fetchProducts() {
  loading.value = true
  try {
    const res = await getProducts()
    products.value = res.data.data || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load products'
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  modalError.value = ''
  try {
    await createProduct(createForm)
    showCreate.value = false
    Object.assign(createForm, { name: '', description: '', price: 0, stock: 0 })
    await fetchProducts()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Create failed'
  }
}

function openEdit(product) {
  Object.assign(editForm, { id: product.id, name: product.name, description: product.description || '', price: product.price })
  showEdit.value = true
}

async function handleEdit() {
  modalError.value = ''
  try {
    await updateProduct(editForm.id, { name: editForm.name, description: editForm.description, price: editForm.price })
    showEdit.value = false
    await fetchProducts()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Update failed'
  }
}

function openStock(product) {
  stockProduct.value = product
  stockQty.value = 0
  showStock.value = true
}

async function handleStock() {
  modalError.value = ''
  try {
    await updateStock(stockProduct.value.id, { quantity: stockQty.value })
    showStock.value = false
    await fetchProducts()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Stock update failed'
  }
}

async function handleToggle(product) {
  try {
    await toggleProductStatus(product.id)
    await fetchProducts()
  } catch (err) {
    error.value = err.response?.data?.message || 'Toggle failed'
  }
}

async function handleDelete(product) {
  if (!confirm(`Delete "${product.name}"?`)) return
  try {
    await deleteProduct(product.id)
    await fetchProducts()
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}

onMounted(fetchProducts)
</script>
