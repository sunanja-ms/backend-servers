<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Register</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" type="text" required placeholder="Your name" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" required minlength="6" placeholder="Min 6 characters" />
        </div>
        <button type="submit" class="btn btn-primary btn-full" :disabled="auth.loading">
          {{ auth.loading ? 'Creating...' : 'Register' }}
        </button>
      </form>
      <p class="auth-link">Already have an account? <router-link to="/login">Login</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToastStore } from '../stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()
const form = ref({ name: '', email: '', password: '' })

async function handleRegister() {
  try {
    await auth.register(form.value.email, form.value.password, form.value.name)
    toast.success('Account created! Redirecting to login...')
    setTimeout(() => router.push('/login'), 1500)
  } catch (err) {
    toast.error(err.response?.data?.message || 'Registration failed')
  }
}
</script>
