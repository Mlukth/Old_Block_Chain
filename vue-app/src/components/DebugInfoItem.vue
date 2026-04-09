<template>
  <div class="border-b border-gray-200 pb-2">
    <div class="flex items-center text-sm text-gray-700">
      <i :class="`fa ${icon} mr-2`"></i>
      <span>{{ label }}</span>
    </div>
    <div class="mt-1 break-all font-mono text-sm bg-gray-100 p-2 rounded text-gray-900">
      {{ value }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string; icon: string }>()
</script>