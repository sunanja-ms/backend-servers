<template>
  <div class="page">
    <div class="page-header">
      <h1>API Keys</h1>
      <button class="btn btn-primary" @click="openCreate">+ New Key</button>
    </div>

    <div v-if="loading" class="loading"><SkeletonTable :rows="3" :columns="5" /></div>
    <div v-else-if="error" class="alert alert-error">{{ error }}</div>
    <template v-else>
      <div class="table-wrap"><table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Prefix</th>
            <th>Expires</th>
            <th>Last Used</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="key in keys" :key="key.id">
            <td>{{ key.name }}</td>
            <td><code>{{ key.prefix }}...</code></td>
            <td>{{ formatDate(key.expiresAt) }}</td>
            <td class="text-muted">{{ key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never' }}</td>
            <td class="text-muted">{{ formatDate(key.createdAt) }}</td>
            <td class="actions">
              <button class="btn btn-sm btn-danger" @click="handleRevoke(key)">Revoke</button>
            </td>
          </tr>
        </tbody>
      </table></div>
      <div v-if="!keys.length" class="empty-state">
        <p class="text-muted">No API keys yet. Create one to get started.</p>
        <button class="btn btn-primary btn-sm" style="margin-top:8px" @click="openCreate">+ Create API Key</button>
      </div>
    </template>

    <Modal v-if="showCreate" @close="showCreate = false">
      <h2>Create API Key</h2>
      <form v-if="!createdKey" @submit.prevent="handleCreate">
        <div class="form-group">
          <label>Name</label>
          <input v-model="createForm.name" required maxlength="100" placeholder="e.g. CI/CD Pipeline" />
        </div>
        <div v-if="modalError" class="alert alert-error">{{ modalError }}</div>
        <button type="submit" class="btn btn-primary" :disabled="creating">
          {{ creating ? 'Creating...' : 'Create Key' }}
        </button>
      </form>
      <div v-else class="key-display">
        <p class="alert alert-success">Key created! Copy it now — it won't be shown again.</p>
        <div class="key-box">
          <code>{{ createdKey }}</code>
          <button class="btn btn-sm btn-primary" @click="copyKey">Copy</button>
        </div>
        <button class="btn btn-full" style="margin-top:12px" @click="doneCreate">Done</button>
      </div>
    </Modal>

    <ConfirmModal
      v-if="revokeTarget"
      title="Revoke API Key?"
      :message="`Revoke '${revokeTarget.name}'? This cannot be undone.`"
      @confirm="confirmRevoke"
      @cancel="revokeTarget = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listKeys, createKey, revokeKey } from '../api/apikeys'
import { useToastStore } from '../stores/toast'
import Modal from '../components/Modal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import SkeletonTable from '../components/SkeletonTable.vue'

const toast = useToastStore()
const keys = ref([])
const loading = ref(true)
const error = ref('')
const modalError = ref('')
const showCreate = ref(false)
const creating = ref(false)
const createForm = ref({ name: '' })
const createdKey = ref('')
const revokeTarget = ref(null)

function formatDate(d) { return new Date(d).toLocaleDateString() }

async function fetchKeys() {
  loading.value = true
  try {
    const res = await listKeys()
    keys.value = res.data.data || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load API keys'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createForm.value = { name: '' }
  createdKey.value = ''
  modalError.value = ''
  showCreate.value = true
}

async function handleCreate() {
  creating.value = true
  modalError.value = ''
  try {
    const res = await createKey({ name: createForm.value.name })
    createdKey.value = res.data.data.key
    toast.success('API key created!')
    await fetchKeys()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Create failed'
  } finally {
    creating.value = false
  }
}

function copyKey() {
  navigator.clipboard.writeText(createdKey.value)
  toast.success('Copied to clipboard!')
}

function doneCreate() {
  showCreate.value = false
  createdKey.value = ''
}

function handleRevoke(key) {
  revokeTarget.value = key
}

async function confirmRevoke() {
  try {
    await revokeKey(revokeTarget.value.id)
    toast.success('API key revoked')
    revokeTarget.value = null
    await fetchKeys()
  } catch (err) {
    toast.error(err.response?.data?.message || 'Revoke failed')
    revokeTarget.value = null
  }
}

onMounted(fetchKeys)
</script>

<style scoped>
.key-display { text-align: center; }
.key-box { display: flex; align-items: center; gap: 8px; background: var(--card-bg); padding: 12px 16px; border-radius: 8px; border: 2px dashed var(--primary); margin: 12px 0; }
.key-box code { flex: 1; word-break: break-all; font-size: 13px; }
</style>
