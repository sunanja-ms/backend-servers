<template>
  <Transition name="modal" appear>
    <div class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal-content modal-narrow" role="alertdialog" aria-modal="true">
        <h3>{{ title }}</h3>
        <p class="text-muted" style="margin: 10px 0 0">{{ message }}</p>
        <div class="modal-actions">
          <button class="btn" @click="$emit('cancel')">Cancel</button>
          <button class="btn btn-danger" @click="$emit('confirm')">Confirm</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({ title: String, message: String })
defineEmits(['confirm', 'cancel'])
</script>
