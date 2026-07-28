<template>
  <div class="skeleton-card">
    <div class="skeleton-block" style="width:60%;height:24px;margin-bottom:16px" />
    <div class="skeleton-block" style="width:100%;height:14px" />
    <div class="skeleton-block" style="width:80%;height:14px;margin-top:8px" />
    <div class="skeleton-block" style="width:40%;height:14px;margin-top:8px" />
  </div>
</template>

<style scoped>
.skeleton-card { background: var(--card-bg); padding: 24px; border-radius: 10px; box-shadow: var(--shadow); }
.skeleton-block { background: linear-gradient(90deg, var(--skeleton) 25%, var(--sidebar-hover) 50%, var(--skeleton) 75%); background-size: 200px 100%; animation: shimmer 1.5s ease-in-out infinite; border-radius: 4px; }
@keyframes shimmer { 0% { background-position: -200px 0; } 50% { background-position: 0; } 100% { background-position: 200px 0; } }
</style>
