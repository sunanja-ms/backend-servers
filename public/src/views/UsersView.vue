<template>
  <div class="page">
    <div class="page-header">
      <h1>User Management</h1>
      <button class="btn btn-sm" @click="handleExport">Export CSV</button>
    </div>

    <div class="search-bar">
      <input v-model="search" placeholder="Search users..." @input="debouncedSearch" />
      <select v-model="isActive" @change="fetchUsers" class="form-select">
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>

    <div v-if="loading">
      <SkeletonTable :rows="5" :columns="7" />
    </div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else>
      <div class="table-wrap"><table>
        <thead>
          <tr>
            <th>ID</th>
            <th class="sortable" :class="sortState('name')" @click="toggleSort('name')">Name</th>
            <th class="sortable" :class="sortState('email')" @click="toggleSort('email')">Email</th>
            <th class="sortable" :class="sortState('role')" @click="toggleSort('role')">Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.name }}</td>
            <td>{{ u.email }}</td>
            <td><span class="badge">{{ u.role || 'user' }}</span></td>
            <td>
              <span :class="u.isActive ? 'badge-success' : 'badge-error'">
                {{ u.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="text-muted">{{ u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never' }}</td>
            <td class="actions">
              <button class="btn btn-sm" @click="openEdit(u)">Edit</button>
              <button class="btn btn-sm" :class="u.isActive ? 'btn-warning' : 'btn-success'" @click="handleToggle(u)">
                {{ u.isActive ? 'Deactivate' : 'Activate' }}
              </button>
                <button class="btn btn-sm btn-success" @click="handleRestore(u)" v-if="u.deletedAt">Restore</button>
                <button class="btn btn-sm btn-danger" @click="handleDelete(u)" v-else>Delete</button>
            </td>
          </tr>
        </tbody>
      </table></div>
      <div v-if="!users.length" class="empty-state">
        <p class="text-muted">{{ search ? 'No users match your search.' : 'No users found.' }}</p>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <span class="pagination-info">Page {{ page }} of {{ totalPages }} ({{ total }} total)</span>
        <div class="pagination-buttons">
          <button class="btn btn-sm" :disabled="page <= 1" @click="goPage(page - 1)">Prev</button>
          <button class="btn btn-sm" :disabled="page >= totalPages" @click="goPage(page + 1)">Next</button>
        </div>
      </div>
    </template>

    <Modal v-if="showEdit" @close="showEdit = false">
      <h2>Edit User: {{ editForm.name }}</h2>
      <form @submit.prevent="handleEdit">
        <div class="form-group">
          <label>Name</label>
          <input v-model="editForm.name" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="editForm.email" type="email" />
        </div>
        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
        <button type="submit" class="btn btn-primary" :disabled="isUpdating">{{ isUpdating ? 'Saving...' : 'Save' }}</button>
      </form>
    </Modal>

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete User?"
      :message="`Delete user '${deleteTarget.name}'? This cannot be undone.`"
      @confirm="confirmDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUsers, updateUser, deleteUser, toggleUserStatus, restoreUser } from '../api/users'
import { useToastStore } from '../stores/toast'
import { exportCSV } from '../utils/export'
import Modal from '../components/Modal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import SkeletonTable from '../components/SkeletonTable.vue'

const toast = useToastStore()
const users = ref([])
const loading = ref(true)
const error = ref('')
const modalError = ref('')
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const totalPages = ref(0)
const search = ref('')
const isActive = ref('')
const sortBy = ref('')
const sortOrder = ref('desc')
let searchTimer = null

const showEdit = ref(false)
const isUpdating = ref(false)
const editForm = reactive({ id: 0, name: '', email: '' })
const deleteTarget = ref(null)

function sortState(col) {
  if (sortBy.value !== col) return ''
  return sortOrder.value
}

function toggleSort(col) {
  if (sortBy.value === col) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = col
    sortOrder.value = 'asc'
  }
  fetchUsers()
}

function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchUsers() }, 300)
}

function goPage(p) { page.value = p; fetchUsers() }

async function fetchUsers() {
  loading.value = true
  try {
    const params = { page: page.value, limit: limit.value }
    if (sortBy.value) { params.sortBy = sortBy.value; params.sortOrder = sortOrder.value }
    if (search.value) params.search = search.value
    if (isActive.value) params.isActive = isActive.value
    const res = await getUsers(params)
    const data = res.data.data || []
    users.value = data
    if (res.data.total !== undefined) { total.value = res.data.total; totalPages.value = Math.ceil(res.data.total / limit.value) }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

function handleExport() {
  exportCSV(users.value, 'users', [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'isActive', label: 'Active' },
  ])
  toast.success('Users exported!')
}

function openEdit(user) {
  Object.assign(editForm, { id: user.id, name: user.name, email: user.email })
  showEdit.value = true
}

async function handleEdit() {
  isUpdating.value = true
  modalError.value = ''
  try {
    await updateUser(editForm.id, { name: editForm.name, email: editForm.email })
    showEdit.value = false
    toast.success('User updated!')
    await fetchUsers()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Update failed'
  } finally {
    isUpdating.value = false
  }
}

async function handleToggle(user) {
  try {
    await toggleUserStatus(user.id, { isActive: !user.isActive })
    toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`)
    await fetchUsers()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Toggle failed')
  }
}

async function handleRestore(user) {
  try {
    await restoreUser(user.id)
    toast.success('User restored!')
    await fetchUsers()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Restore failed')
  }
}

function handleDelete(user) {
  deleteTarget.value = user
}

async function confirmDelete() {
  try {
    await deleteUser(deleteTarget.value.id)
    toast.success('User deleted!')
    deleteTarget.value = null
    await fetchUsers()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Delete failed')
    deleteTarget.value = null
  }
}

onMounted(fetchUsers)
</script>
