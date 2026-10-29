<template>
  <div class="page" style="max-width:760px">
    <h1>Profile</h1>

    <div class="card">
      <div class="profile-head">
        <div class="avatar">
          <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" :alt="displayName" />
          <span v-else>{{ initials }}</span>
        </div>
        <div class="profile-meta">
          <h2>{{ displayName }}</h2>
          <p>{{ auth.user?.email }}</p>
          <p>
            <span class="badge" :class="auth.isAdmin ? 'badge-info' : ''">{{ auth.user?.role || 'user' }}</span>
          </p>
        </div>
      </div>

      <div class="actions" style="margin-top:16px">
        <label class="btn btn-sm" style="cursor:pointer">
          {{ auth.user?.avatarUrl ? 'Change photo' : 'Upload photo' }}
          <input type="file" accept="image/*" hidden :disabled="uploading" @change="handleAvatar" />
        </label>
        <button v-if="auth.user?.avatarUrl" class="btn btn-sm btn-danger" :disabled="uploading" @click="handleRemoveAvatar">Remove photo</button>
      </div>

      <div class="stats-grid" style="grid-template-columns:1fr 1fr;margin-top:16px">
        <div>
          <p class="text-muted" style="font-size:12px;margin:0">Member since</p>
          <p style="margin:0">{{ formatDate(auth.user?.createdAt) }}</p>
        </div>
        <div>
          <p class="text-muted" style="font-size:12px;margin:0">Last login</p>
          <p style="margin:0">{{ formatDate(auth.user?.lastLoginAt) || 'This session' }}</p>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <h3>Account details</h3>
      <form @submit.prevent="handleUpdate">
        <div class="form-group">
          <label>Name</label>
          <input v-model.trim="profileForm.name" type="text" minlength="2" maxlength="100" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model.trim="profileForm.email" type="email" required />
        </div>
        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="updating || !profileDirty">
            {{ updating ? 'Saving...' : 'Save changes' }}
          </button>
          <button v-if="profileDirty" type="button" class="btn" :disabled="updating" @click="resetProfile">Reset</button>
        </div>
      </form>
    </div>

    <div class="card mt-4">
      <h3>Security</h3>
      <form @submit.prevent="handlePassword">
        <div class="form-group">
          <label>Current password</label>
          <div class="inline-form">
            <input v-model="pwForm.currentPassword" :type="showCurrent ? 'text' : 'password'" required minlength="6" autocomplete="current-password" />
            <button type="button" class="btn btn-sm" @click="showCurrent = !showCurrent">{{ showCurrent ? 'Hide' : 'Show' }}</button>
          </div>
        </div>
        <div class="form-group">
          <label>New password</label>
          <input v-model="pwForm.newPassword" :type="showNew ? 'text' : 'password'" required minlength="6" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label>Confirm new password</label>
          <input v-model="pwForm.confirmPassword" :type="showNew ? 'text' : 'password'" required minlength="6" autocomplete="new-password" />
        </div>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:12px">
          <input type="checkbox" v-model="showNew" style="width:auto" /> Show new password
        </label>
        <p v-if="pwMismatch" class="text-error" style="font-size:13px">Passwords do not match.</p>
        <button type="submit" class="btn btn-primary" :disabled="changingPw || pwMismatch || !pwForm.newPassword">
          {{ changingPw ? 'Updating...' : 'Update password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'
import { updateUser, changePassword, uploadAvatar, deleteAvatar } from '../api/users'

const auth = useAuthStore()
const toast = useToastStore()
const profileForm = reactive({ name: '', email: '' })
const pwForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const updating = ref(false)
const changingPw = ref(false)
const uploading = ref(false)
const showCurrent = ref(false)
const showNew = ref(false)

const displayName = computed(() => auth.user?.name || 'User')
const initials = computed(() =>
  displayName.value.split(' ').filter(Boolean).map((word) => word[0]).join('').slice(0, 2).toUpperCase()
)
const profileDirty = computed(() =>
  profileForm.name !== (auth.user?.name || '') || profileForm.email !== (auth.user?.email || '')
)
const pwMismatch = computed(() => !!pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword)

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''
}

function resetProfile() {
  profileForm.name = auth.user?.name || ''
  profileForm.email = auth.user?.email || ''
}

async function handleAvatar(event) {
  const file = event.target.files?.[0]
  if (!file || !auth.user?.id) return
  const form = new FormData()
  form.append('file', file)
  uploading.value = true
  try {
    await uploadAvatar(auth.user.id, form)
    await auth.fetchUser()
    toast.success('Photo updated')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Upload failed')
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

async function handleRemoveAvatar() {
  if (!auth.user?.id || !confirm('Remove your profile photo?')) return
  uploading.value = true
  try {
    await deleteAvatar(auth.user.id)
    await auth.fetchUser()
    toast.success('Photo removed')
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed')
  } finally {
    uploading.value = false
  }
}

async function handleUpdate() {
  if (!auth.user?.id) return
  updating.value = true
  try {
    await updateUser(auth.user.id, { name: profileForm.name, email: profileForm.email })
    await auth.fetchUser()
    toast.success('Profile updated')
  } catch (err) {
    toast.error(err.response?.data?.message || 'Update failed')
  } finally {
    updating.value = false
  }
}

async function handlePassword() {
  if (!auth.user?.id || pwMismatch.value) return
  changingPw.value = true
  try {
    await changePassword(auth.user.id, { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
    toast.success('Password updated')
    pwForm.currentPassword = ''
    pwForm.newPassword = ''
    pwForm.confirmPassword = ''
  } catch (err) {
    toast.error(err.response?.data?.message || 'Password change failed')
  } finally {
    changingPw.value = false
  }
}

onMounted(() => {
  resetProfile()
  auth.fetchUser()
})
</script>
