<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-content" style="max-width:400px;text-align:center">
      <h3>{{ title }}</h3>
      <p style="margin:12px 0 20px;color:var(--text-muted)">{{ message }}</p>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="btn" @click="$emit('cancel')">Cancel</button>
        <button class="btn btn-danger" @click="$emit('confirm')">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ title: String, message: String })
defineEmits(['confirm', 'cancel'])
</script>
