<template>
  <div class="page">
    <h1>Profile</h1>
    <div class="card">
      <h2>{{ auth.user?.name }}</h2>
      <p class="text-muted">{{ auth.user?.email }}</p>
      <p>Role: <span class="badge">{{ auth.user?.role }}</span></p>
      <p>Member since: {{ new Date(auth.user?.createdAt).toLocaleDateString() }}</p>
    </div>

    <div class="card mt-4">
      <h3>Update Profile</h3>
      <form @submit.prevent="handleUpdate">
        <div class="form-group">
          <label>Name</label>
          <input v-model="profileForm.name" type="text" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="profileForm.email" type="email" />
        </div>
        <div v-if="profileMsg" :class="profileMsg.type === 'error' ? 'alert alert-error' : 'alert alert-success'">
          {{ profileMsg.text }}
        </div>
        <button type="submit" class="btn btn-primary" :disabled="updating">
          {{ updating ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </div>

    <div class="card mt-4">
      <h3>Change Password</h3>
      <form @submit.prevent="handlePassword">
        <div class="form-group">
          <label>Current Password</label>
          <input v-model="pwForm.currentPassword" type="password" required />
        </div>
        <div class="form-group">
          <label>New Password</label>
          <input v-model="pwForm.newPassword" type="password" required minlength="6" />
        </div>
        <div v-if="pwMsg" :class="pwMsg.type === 'error' ? 'alert alert-error' : 'alert alert-success'">
          {{ pwMsg.text }}
        </div>
        <button type="submit" class="btn btn-primary" :disabled="changingPw">
          {{ changingPw ? 'Changing...' : 'Change Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { updateUser, changePassword } from '../api/users'

const auth = useAuthStore()
const profileForm = reactive({ name: '', email: '' })
const pwForm = reactive({ currentPassword: '', newPassword: '' })
const profileMsg = ref(null)
const pwMsg = ref(null)
const updating = ref(false)
const changingPw = ref(false)

onMounted(() => {
  profileForm.name = auth.user?.name || ''
  profileForm.email = auth.user?.email || ''
})

async function handleUpdate() {
  updating.value = true
  profileMsg.value = null
  try {
    await updateUser(auth.user.id, { name: profileForm.name, email: profileForm.email })
    await auth.fetchUser()
    profileMsg.value = { type: 'success', text: 'Profile updated!' }
  } catch (err) {
    profileMsg.value = { type: 'error', text: err.response?.data?.message || 'Update failed' }
  } finally {
    updating.value = false
  }
}

async function handlePassword() {
  changingPw.value = true
  pwMsg.value = null
  try {
    await changePassword(auth.user.id, pwForm)
    pwMsg.value = { type: 'success', text: 'Password changed!' }
    pwForm.currentPassword = ''
    pwForm.newPassword = ''
  } catch (err) {
    pwMsg.value = { type: 'error', text: err.response?.data?.message || 'Password change failed' }
  } finally {
    changingPw.value = false
  }
}
</script>
