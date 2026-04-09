<template>
  <div class="bg-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg border border-white/20">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-lg font-medium text-white/80">{{ title }}</h3>
        <p class="text-3xl font-bold text-white mt-2">{{ value }}</p>
      </div>
      <div class="p-3 rounded-full text-white" :class="color">
        <i :class="`fa ${icon}`"></i>
      </div>
    </div>
    <p class="text-sm text-white/60">{{ description }}</p>
    <div v-if="trend" class="mt-2 text-sm" :class="trend.value > 0 ? 'text-green-400' : 'text-red-400'">
      {{ trend.value > 0 ? '↑' : '↓' }} {{ Math.abs(trend.value) }}% {{ trend.period }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  description: string
  icon: string
  color: string
  trend?: { value: number; period: string }
}>()
</script>