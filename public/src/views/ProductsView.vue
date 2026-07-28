<template>
  <div class="page">
    <div class="page-header">
      <h1>Manage Products</h1>
      <button class="btn btn-primary" @click="openCreate">+ New Product</button>
    </div>

    <div class="search-bar">
      <input v-model="search" placeholder="Search products..." @input="debouncedSearch" />
      <select v-model="isActive" @change="fetchProducts" class="form-select">
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
      <select v-model="categoryFilter" @change="fetchProducts" class="form-select">
        <option value="">All Categories</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div v-if="loading"><SkeletonTable :rows="5" :columns="7" /></div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else>
      <div class="table-wrap"><table>
        <thead><tr>
          <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td><router-link :to="`/products/${p.id}`">{{ p.name }}</router-link></td>
            <td class="text-muted">{{ p.category?.name || '-' }}</td>
            <td class="text-idr">{{ formatIDR(p.price) }}</td>
            <td><span :class="p.stock < 10 ? 'text-error' : ''">{{ p.stock }}</span></td>
            <td><span :class="p.isActive ? 'badge-success' : 'badge-error'">{{ p.isActive ? 'Active' : 'Inactive' }}</span></td>
            <td class="actions">
              <button class="btn btn-sm" @click="openEdit(p)">Edit</button>
              <button class="btn btn-sm btn-warning" @click="openStock(p)">Stock</button>
              <button class="btn btn-sm" :class="p.isActive ? 'btn-warning' : 'btn-success'" @click="handleToggle(p)">{{ p.isActive ? 'Deactivate' : 'Activate' }}</button>
              <button class="btn btn-sm btn-success" @click="handleRestore(p)" v-if="p.deletedAt">Restore</button>
              <button class="btn btn-sm btn-danger" @click="handleDelete(p)" v-else>Delete</button>
            </td>
          </tr>
        </tbody>
      </table></div>
      <div v-if="!products.length" class="empty-state">
        <p class="text-muted">{{ search ? 'No products match.' : 'No products yet.' }}</p>
        <button v-if="!search" class="btn btn-primary btn-sm" style="margin-top:8px" @click="openCreate">+ Create your first product</button>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <span class="pagination-info">Page {{ page }} of {{ totalPages }} ({{ total }} total)</span>
        <div class="pagination-buttons">
          <button class="btn btn-sm" :disabled="page <= 1" @click="goPage(page - 1)">Prev</button>
          <button class="btn btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">Next</button>
        </div>
      </div>
    </template>

    <Modal v-if="showCreate" @close="showCreate = false">
      <h2>Create Product</h2>
      <form @submit.prevent="handleCreate">
        <div class="form-group"><label>Name</label><input v-model="createForm.name" required /></div>
        <div class="form-group"><label>Description</label><textarea v-model="createForm.description" rows="3"></textarea></div>
        <div class="form-group"><label>Price (IDR)</label><input v-model.number="createForm.price" type="number" min="0" required /></div>
        <div class="form-group"><label>Stock</label><input v-model.number="createForm.stock" type="number" min="0" /></div>
        <div class="form-group"><label>Category</label>
          <select v-model.number="createForm.categoryId">
            <option :value="undefined">None</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="creating">{{ creating ? 'Creating...' : 'Create' }}</button>
      </form>
    </Modal>

    <Modal v-if="editProduct" @close="editProduct = null">
      <h2>Edit Product</h2>
      <form @submit.prevent="handleEdit">
        <div class="form-group"><label>Name</label><input v-model="editForm.name" required /></div>
        <div class="form-group"><label>Description</label><textarea v-model="editForm.description" rows="3"></textarea></div>
        <div class="form-group"><label>Price (IDR)</label><input v-model.number="editForm.price" type="number" min="0" required /></div>
        <div class="form-group"><label>Stock</label><input v-model.number="editForm.stock" type="number" min="0" /></div>
        <div class="form-group"><label>Category</label>
          <select v-model.number="editForm.categoryId">
            <option :value="undefined">None</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
      </form>
    </Modal>

    <Modal v-if="stockProduct" @close="stockProduct = null">
      <h2>Update Stock: {{ stockProduct.name }}</h2>
      <form @submit.prevent="handleStock">
        <div class="form-group"><label>Quantity to Add</label><input v-model.number="stockQty" type="number" min="1" required /></div>
        <button type="submit" class="btn btn-primary btn-full">Update</button>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getProducts, createProduct, updateProduct, deleteProduct, updateStock, toggleProductStatus, restoreProduct } from '../api/products'
import { getCategories } from '../api/categories'
import { useToastStore } from '../stores/toast'
import Modal from '../components/Modal.vue'
import SkeletonTable from '../components/SkeletonTable.vue'

const toast = useToastStore()
const products = ref([])
const categories = ref([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const isActive = ref('')
const categoryFilter = ref('')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
const showCreate = ref(false)
const editProduct = ref(null)
const stockProduct = ref(null)
const creating = ref(false)
const saving = ref(false)
const createForm = ref({ name: '', description: '', price: 0, stock: 0, categoryId: undefined })
const editForm = ref({})
const stockQty = ref(1)
let debounceTimer

const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(val))

function debouncedSearch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { page.value = 1; fetchProducts() }, 300) }
function goPage(p) { page.value = p; fetchProducts() }

async function fetchProducts() {
  loading.value = true; error.value = ''
  try {
    const params = { page: page.value, limit: 10, search: search.value || undefined, isActive: isActive.value || undefined, includeDeleted: true }
    if (categoryFilter.value) params.categoryId = categoryFilter.value
    const res = await getProducts(params)
    products.value = res.data.data || []
    total.value = res.data.total ?? 0
    totalPages.value = Math.ceil(total.value / 10)
  } catch (e) { error.value = e.response?.data?.message || 'Failed to load products' }
  finally { loading.value = false }
}

async function handleCreate() {
  creating.value = true
  try {
    await createProduct({ ...createForm.value })
    toast.success('Product created')
    showCreate.value = false; createForm.value = { name: '', description: '', price: 0, stock: 0, categoryId: undefined }
    fetchProducts()
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  finally { creating.value = false }
}

function openEdit(p) { editProduct.value = p; editForm.value = { name: p.name, description: p.description, price: Number(p.price), stock: p.stock, categoryId: p.categoryId } }
async function handleEdit() {
  saving.value = true
  try {
    await updateProduct(editProduct.value.id, editForm.value)
    toast.success('Product updated'); editProduct.value = null; fetchProducts()
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  finally { saving.value = false }
}

function openStock(p) { stockProduct.value = p; stockQty.value = 1 }
async function handleStock() {
  try {
    await updateStock(stockProduct.value.id, { quantity: stockQty.value })
    toast.success('Stock updated'); stockProduct.value = null; fetchProducts()
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
}
async function handleToggle(p) { try { await toggleProductStatus(p.id, { isActive: !p.isActive }); toast.success(p.isActive ? 'Deactivated' : 'Activated'); fetchProducts() } catch (e) { toast.error(e.response?.data?.message || 'Failed') } }
async function handleRestore(p) { try { await restoreProduct(p.id); toast.success('Product restored'); fetchProducts() } catch (e) { toast.error(e.response?.data?.message || 'Failed') } }
async function handleDelete(p) { if (!confirm('Delete this product?')) return; try { await deleteProduct(p.id); toast.success('Deleted'); fetchProducts() } catch (e) { toast.error(e.response?.data?.message || 'Failed') } }

onMounted(async () => {
  try { const res = await getCategories(); categories.value = res.data.data || [] } catch {}
  fetchProducts()
})
</script>
