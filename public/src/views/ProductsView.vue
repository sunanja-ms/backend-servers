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
          <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>
              <div class="image-cell">
                <img v-if="p.images?.length" :src="p.images.find(i => i.isPrimary)?.url || p.images[0].url" :alt="p.name" />
                <span v-else class="text-muted">-</span>
                <button v-if="canEdit(p)" class="btn btn-sm" @click="openImages(p)">Images ({{ p.images?.length || 0 }})</button>
              </div>
            </td>
            <td><router-link :to="`/products/${p.id}`">{{ p.name }}</router-link></td>
            <td class="text-muted">{{ p.category?.name || '-' }}</td>
            <td class="text-idr">{{ formatIDR(p.price) }}</td>
            <td><span :class="p.stock < 10 ? 'text-error' : ''">{{ p.stock }}</span></td>
            <td><span :class="p.isActive ? 'badge-success' : 'badge-error'">{{ p.isActive ? 'Active' : 'Inactive' }}</span></td>
            <td class="actions">
              <template v-if="canEdit(p)">
                <button class="btn btn-sm" @click="openEdit(p)">Edit</button>
                <button class="btn btn-sm btn-warning" @click="openStock(p)">Stock</button>
                <button class="btn btn-sm" :class="p.isActive ? 'btn-warning' : 'btn-success'" @click="handleToggle(p)">{{ p.isActive ? 'Deactivate' : 'Activate' }}</button>
                <button class="btn btn-sm btn-success" @click="handleRestore(p)" v-if="p.deletedAt">Restore</button>
                <button class="btn btn-sm btn-danger" @click="handleDelete(p)" v-else>Delete</button>
              </template>
              <span v-else class="text-muted">View only</span>
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
        <div class="form-group"><label>Name</label><input v-model="createForm.name" maxlength="120" required /></div>
        <div class="form-group"><label>Description</label><textarea v-model="createForm.description" rows="3" maxlength="5000"></textarea></div>
        <div class="form-group"><label>Price (IDR)</label><input :value="formatInputValue(createForm.price)" type="text" inputmode="numeric" placeholder="0" required @input="createForm.price = formatNumericInput($event)" /></div>
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
        <div class="form-group"><label>Name</label><input v-model="editForm.name" maxlength="120" required /></div>
        <div class="form-group"><label>Description</label><textarea v-model="editForm.description" rows="3" maxlength="5000"></textarea></div>
        <div class="form-group"><label>Price (IDR)</label><input :value="formatInputValue(editForm.price)" type="text" inputmode="numeric" placeholder="0" required @input="editForm.price = formatNumericInput($event)" /></div>
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

    <Modal v-if="imageProduct" @close="imageProduct = null">
      <h2>Images: {{ imageProduct.name }}</h2>
      <p class="text-muted" style="font-size:13px">Max 5 images. First image is shown in the shop.</p>
      <div v-if="imageProduct.images?.length" class="image-cell" style="flex-direction:column;align-items:stretch;gap:10px">
        <div v-for="img in imageProduct.images" :key="img.id" class="image-cell" style="justify-content:space-between">
          <img :src="img.url" :alt="imageProduct.name" style="width:64px;height:64px" />
          <span class="badge" :class="img.isPrimary ? 'badge-success' : ''">{{ img.isPrimary ? 'Primary' : 'Image' }}</span>
          <span class="image-actions">
            <button v-if="!img.isPrimary" class="btn btn-sm btn-success" @click="handleSetPrimary(imageProduct, img)">Set primary</button>
            <button class="btn btn-sm btn-danger" @click="handleDeleteImage(imageProduct, img)">Delete</button>
          </span>
        </div>
      </div>
      <p v-else class="text-muted">No images yet.</p>
      <div class="form-group" style="margin-top:12px">
        <label>Add image (JPEG, PNG, WebP, GIF - max 5 MB)</label>
        <input type="file" accept="image/*" :disabled="(imageProduct.images?.length || 0) >= 5 || uploading" @change="handleUploadImage" />
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { formatIDR, formatInputValue, formatNumericInput } from '../utils/format'
import { ref, onMounted } from 'vue'
import {
  getProducts, createProduct, updateProduct, deleteProduct, updateStock,
  toggleProductStatus, restoreProduct, uploadProductImage, deleteProductImage, setPrimaryProductImage,
} from '../api/products'
import { getCategories } from '../api/categories'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import Modal from '../components/Modal.vue'
import SkeletonTable from '../components/SkeletonTable.vue'

const auth = useAuthStore()
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
const imageProduct = ref(null)
const creating = ref(false)
const saving = ref(false)
const uploading = ref(false)
const createForm = ref({ name: '', description: '', price: 0, stock: 0, categoryId: undefined })
const editForm = ref({})
const stockQty = ref(1)
let debounceTimer


const canEdit = (p) => auth.isAdmin || p.userId === auth.user?.id

function debouncedSearch() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => { page.value = 1; fetchProducts() }, 300) }
function goPage(p) { page.value = p; fetchProducts() }

async function fetchProducts() {
  loading.value = true; error.value = ''
  try {
    const params = { page: page.value, limit: 10, search: search.value || undefined, isActive: isActive.value || undefined }
    if (auth.isAdmin) params.includeDeleted = true
    if (categoryFilter.value) params.categoryId = categoryFilter.value
    const res = await getProducts(params)
    products.value = res.data.data || []
    total.value = res.data.total ?? 0
    totalPages.value = Math.ceil(total.value / 10)
    // Keep the open image modal in sync after an upload or delete.
    if (imageProduct.value) {
      imageProduct.value = products.value.find((p) => p.id === imageProduct.value.id) || null
    }
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

function openCreate() {
  createForm.value = { name: '', description: '', price: 0, stock: 0, categoryId: undefined }
  showCreate.value = true
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

function openImages(p) { imageProduct.value = p }

async function handleUploadImage(event) {
  const file = event.target.files?.[0]
  if (!file || !imageProduct.value) return
  const form = new FormData()
  form.append('file', file)
  uploading.value = true
  try {
    await uploadProductImage(imageProduct.value.id, form)
    toast.success('Image uploaded')
    await fetchProducts()
  } catch (e) { toast.error(e.response?.data?.message || 'Upload failed') }
  finally { uploading.value = false; event.target.value = '' }
}

async function handleDeleteImage(product, image) {
  if (!confirm('Delete this image?')) return
  try {
    await deleteProductImage(product.id, image.id)
    toast.success('Image deleted')
    await fetchProducts()
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
}

async function handleSetPrimary(product, image) {
  try {
    await setPrimaryProductImage(product.id, image.id)
    toast.success('Primary image updated')
    await fetchProducts()
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
