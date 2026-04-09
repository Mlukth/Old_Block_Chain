<template>
  <Teleport to="body">
    <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" @click="close">
      <div class="relative max-w-4xl max-h-[90vh] p-4" @click.stop>
        <img :src="imageUrl" alt="预览" class="max-w-full max-h-full object-contain" />
        <button @click="close" class="absolute top-2 right-2 text-white text-2xl hover:text-gray-300">
          <i class="fa fa-times"></i>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{ imageUrl: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const close = () => emit('close')
</script>