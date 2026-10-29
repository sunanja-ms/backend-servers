<template>
  <div class="page">
    <div class="page-header">
      <h1>Categories</h1>
      <button class="btn btn-primary" @click="openCreate">+ New Category</button>
    </div>

    <div v-if="loading"><SkeletonTable :rows="4" :columns="4" /></div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else>
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Slug</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="c in categories" :key="c.id">
            <td>{{ c.name }}</td>
            <td><code>{{ c.slug }}</code></td>
            <td><span :class="c.isActive ? 'badge-success' : 'badge-error'">{{ c.isActive ? 'Active' : 'Inactive' }}</span></td>
            <td class="actions">
              <button class="btn btn-sm" @click="openEdit(c)">Edit</button>
              <button class="btn btn-sm" :class="c.isActive ? 'btn-warning' : 'btn-success'" @click="handleToggle(c)">{{ c.isActive ? 'Deactivate' : 'Activate' }}</button>
              <button class="btn btn-sm btn-danger" @click="handleDelete(c)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table></div>
      <div v-if="!categories.length" class="empty-state"><p class="text-muted">No categories yet.</p></div>
    </template>

    <Modal v-if="showCreate" @close="showCreate = false">
      <h2>Create Category</h2>
      <form @submit.prevent="handleCreate">
        <div class="form-group"><label>Name</label><input v-model.trim="createForm.name" required maxlength="100" @input="suggestSlug" /></div>
        <div class="form-group"><label>Slug</label><input v-model.trim="createForm.slug" required pattern="[a-z0-9-]+" /></div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="creating">{{ creating ? 'Creating...' : 'Create' }}</button>
      </form>
    </Modal>

    <Modal v-if="editCategory" @close="editCategory = null">
      <h2>Edit Category</h2>
      <form @submit.prevent="handleEdit">
        <div class="form-group"><label>Name</label><input v-model.trim="editForm.name" required maxlength="100" /></div>
        <div class="form-group"><label>Slug</label><input v-model.trim="editForm.slug" required pattern="[a-z0-9-]+" /></div>
        <div class="form-group"><label>Status</label>
          <select v-model="editForm.isActive" class="form-select">
            <option :value="true">Active</option>
            <option :value="false">Inactive</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import { useCategoryStore } from '../stores/categories'
import { useToastStore } from '../stores/toast'
import Modal from '../components/Modal.vue'
import SkeletonTable from '../components/SkeletonTable.vue'

const toast = useToastStore()
const categoryStore = useCategoryStore()
const categories = ref([])
const loading = ref(true)
const error = ref('')
const showCreate = ref(false)
const editCategory = ref(null)
const creating = ref(false)
const saving = ref(false)
const createForm = ref({ name: '', slug: '' })
const editForm = ref({})

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const suggestSlug = () => { createForm.value.slug = slugify(createForm.value.name) }

async function load() {
  loading.value = true; error.value = ''
  try {
    const res = await getCategories()
    categories.value = res.data.data || []
    categoryStore.categories = categories.value
  } catch (e) { error.value = e.response?.data?.message || 'Failed to load categories' }
  finally { loading.value = false }
}

function openCreate() { createForm.value = { name: '', slug: '' }; showCreate.value = true }
function openEdit(c) { editCategory.value = c; editForm.value = { name: c.name, slug: c.slug, isActive: c.isActive } }

async function handleCreate() {
  creating.value = true
  try {
    await createCategory({ ...createForm.value })
    toast.success('Category created'); showCreate.value = false; load()
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  finally { creating.value = false }
}

async function handleEdit() {
  saving.value = true
  try {
    await updateCategory(editCategory.value.id, editForm.value)
    toast.success('Category updated'); editCategory.value = null; load()
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
  finally { saving.value = false }
}

async function handleToggle(c) {
  try {
    await updateCategory(c.id, { isActive: !c.isActive })
    toast.success(c.isActive ? 'Deactivated' : 'Activated'); load()
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
}

async function handleDelete(c) {
  if (!confirm(`Delete category "${c.name}"? Products keep working but lose this category.`)) return
  try {
    await deleteCategory(c.id)
    toast.success('Category deleted'); load()
  } catch (e) { toast.error(e.response?.data?.message || 'Failed') }
}

onMounted(load)
</script>
