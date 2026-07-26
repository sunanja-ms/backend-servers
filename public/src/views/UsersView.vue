<template>
  <div class="page">
    <h1>User Management</h1>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
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
              <button class="btn btn-sm btn-danger" @click="handleDelete(u)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!users.length" class="text-muted">No users found.</p>
    </template>

    <!-- Edit Modal -->
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
        <button type="submit" class="btn btn-primary">Save</button>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUsers, updateUser, deleteUser, toggleUserStatus } from '../api/users'
import Modal from '../components/Modal.vue'

const users = ref([])
const loading = ref(true)
const error = ref('')
const modalError = ref('')
const showEdit = ref(false)
const editForm = reactive({ id: 0, name: '', email: '' })

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers()
    users.value = res.data.data || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load users'
  } finally {
    loading.value = false
  }
}

function openEdit(user) {
  Object.assign(editForm, { id: user.id, name: user.name, email: user.email })
  showEdit.value = true
}

async function handleEdit() {
  modalError.value = ''
  try {
    await updateUser(editForm.id, { name: editForm.name, email: editForm.email })
    showEdit.value = false
    await fetchUsers()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Update failed'
  }
}

async function handleToggle(user) {
  try {
    await toggleUserStatus(user.id)
    await fetchUsers()
  } catch (err) {
    error.value = err.response?.data?.message || 'Toggle failed'
  }
}

async function handleDelete(user) {
  if (!confirm(`Delete user "${user.name}"?`)) return
  try {
    await deleteUser(user.id)
    await fetchUsers()
  } catch (err) {
    error.value = err.response?.data?.message || 'Delete failed'
  }
}

onMounted(fetchUsers)
</script>
