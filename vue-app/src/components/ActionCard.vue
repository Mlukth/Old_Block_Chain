<template>
  <button 
    class="bg-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/20 border border-white/20 text-left w-full"
  >
    <div class="flex items-center">
      <div class="p-3 rounded-full text-white mr-4" :class="color">
        <i :class="`fa ${icon} text-xl`"></i>
      </div>
      <div>
        <h3 class="text-xl font-bold text-white">{{ title }}</h3>
        <p class="text-sm text-white/60 mt-1">{{ description }}</p>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description: string
  color: string
}>()
</script>