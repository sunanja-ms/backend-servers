<template>
  <div class="skeleton-table">
    <div class="skeleton-header">
      <div v-for="i in columns" :key="i" class="skeleton-cell" style="height:18px;width:80px" />
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

<style scoped>
.skeleton-table { background: var(--card-bg); border-radius: 10px; overflow: hidden; box-shadow: var(--shadow); }
.skeleton-header, .skeleton-row { display: flex; gap: 16px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
.skeleton-header { background: var(--table-header-bg); }
.skeleton-row:last-child { border-bottom: none; }
.skeleton-cell { height: 14px; background: linear-gradient(90deg, var(--skeleton) 25%, var(--sidebar-hover) 50%, var(--skeleton) 75%); background-size: 200px 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: 4px; }
@keyframes shimmer { 0% { background-position: -200px 0; } 50% { background-position: 0; } 100% { background-position: 200px 0; } }
</style>
