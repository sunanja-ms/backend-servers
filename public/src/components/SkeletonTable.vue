<template>
  <div class="skeleton-table" aria-hidden="true">
    <div class="skeleton-header">
      <div v-for="i in columns" :key="i" class="skeleton-cell" style="height: 10px; width: 80px" />
    </div>
    <div v-for="row in rows" :key="row" class="skeleton-row">
      <div
        v-for="col in columns"
        :key="col"
        class="skeleton-cell"
        :style="{ width: colWidths[Math.min(col - 1, colWidths.length - 1)] }"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 5 },
  columns: { type: Number, default: 6 },
})

const colWidths = ['120px', '160px', '80px', '60px', '80px', '100px']
</script>
