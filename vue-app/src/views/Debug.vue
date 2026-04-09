<template>
  <div class="container mx-auto p-6 max-w-4xl text-gray-800">
    <h1 class="text-3xl font-bold mb-8 flex items-center text-white">
      <i class="fa fa-cog mr-3 text-blue-500"></i>
      图片存储调试工具
    </h1>
    
    <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold flex items-center text-gray-800">
          <i class="fa fa-folder mr-2 text-gray-600"></i>
          存储测试
        </h2>
        <button
          @click="runStorageTest"
          :disabled="loading"
          class="px-4 py-2 rounded-lg flex items-center"
          :class="loading ? 'bg-gray-300 text-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'"
        >
          <i class="fa" :class="loading ? 'fa-spinner animate-spin' : 'fa-sync'"></i>
          <span class="ml-2">运行存储测试</span>
        </button>
      </div>
      
      <div v-if="error" class="bg-red-100 text-red-700 p-4 rounded-lg mb-4">
        <i class="fa fa-times-circle mr-2"></i>
        {{ error }}
      </div>
      
      <div v-if="testResult" class="border border-gray-200 rounded-lg p-4">
        <h3 class="font-bold mb-3 text-gray-800">测试结果:</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DebugInfoItem label="存储目录" :value="testResult.storageDir" icon="fa-folder" />
          <DebugInfoItem label="测试图片" :value="testResult.testImage" icon="fa-file-image" />
          <DebugInfoItem label="保存路径" :value="testResult.savedImage" icon="fa-file-image" />
          <DebugInfoItem label="文件存在" :value="testResult.fileExists ? '✅ 是' : '❌ 否'" :icon="testResult.fileExists ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'" />
          <DebugInfoItem label="哈希值" :value="testResult.hash" icon="fa-database" />
          <DebugInfoItem label="状态" :value="testResult.success ? '✅ 成功' : '❌ 失败'" :icon="testResult.success ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'" />
        </div>
        
        <div v-if="testResult.savedImage" class="mt-6">
          <h4 class="font-bold mb-2 text-gray-800">图片预览:</h4>
          <div class="flex flex-col md:flex-row gap-4">
            <div>
              <p class="text-sm mb-1 text-gray-800">测试图片:</p>
              <img src="/images/test_image.jpg" alt="测试图片" class="w-48 h-48 object-contain border" />
            </div>
            <div>
              <p class="text-sm mb-1 text-gray-800">保存的图片:</p>
              <div v-if="!imageLoaded" class="w-48 h-48 flex items-center justify-center bg-gray-100">
                <i class="fa fa-spinner animate-spin text-blue-500 mr-2"></i>加载中...
              </div>
              <img
                v-show="imageLoaded"
                :src="`http://localhost:3002/images/${savedImageFilename}`"
                alt="保存的图片" 
                class="w-48 h-48 object-contain border"
                @load="imageLoaded = true"
                @error="onImageError"
              />
              <p class="text-xs text-gray-600 mt-1 break-all">{{ savedImageFilename }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl shadow-lg p-6">
      <h2 class="text-xl font-bold mb-4 flex items-center text-gray-800">
        <i class="fa fa-info-circle mr-2 text-gray-600"></i>
        存储目录信息
      </h2>
      
      <div v-if="storageInfo">
        <DebugInfoItem label="存储路径" :value="storageInfo.storageDir" icon="fa-folder" />
        <DebugInfoItem label="目录存在" :value="storageInfo.exists ? '✅ 是' : '❌ 否'" :icon="storageInfo.exists ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'" />
        <DebugInfoItem label="文件数量" :value="storageInfo.fileCount" icon="fa-file-image" />
        
        <div v-if="storageInfo.fileCount > 0" class="mt-4">
          <h3 class="font-bold mb-2 text-gray-800">文件列表:</h3>
          <div class="border rounded-lg overflow-hidden">
            <table class="min-w-full">
              <thead class="bg-gray-200">
                <tr>
                  <th class="py-2 px-4 text-left text-gray-800">文件名</th>
                  <th class="py-2 px-4 text-left text-gray-800">大小</th>
                  <th class="py-2 px-4 text-left text-gray-800">创建时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(file, idx) in storageInfo.files" :key="idx" :class="idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'">
                  <td class="py-2 px-4 text-gray-800">{{ file.name }}</td>
                  <td class="py-2 px-4 text-gray-800">{{ (file.size / 1024).toFixed(2) }} KB</td>
                  <td class="py-2 px-4 text-gray-800">{{ new Date(file.created).toLocaleString() }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p v-else class="text-gray-800">加载存储信息中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { debugApi } from '@/api/modules/debug'

const loading = ref(false)
const error = ref<string | null>(null)
const testResult = ref<any>(null)
const storageInfo = ref<any>(null)
const imageLoaded = ref(false)

const savedImageFilename = computed(() => {
  if (!testResult.value?.savedImage) return ''
  return testResult.value.savedImage.split(/[\\/]/).pop().toLowerCase()
})

const runStorageTest = async () => {
  imageLoaded.value = false
  loading.value = true
  error.value = null
  try {
    const res = await debugApi.getStorage()
    testResult.value = res.data
    const infoRes = await debugApi.getStorage()
    storageInfo.value = infoRes.data
  } catch (err: any) {
    error.value = err.message || '未知错误'
  } finally {
    loading.value = false
  }
}

const fetchStorageInfo = async () => {
  try {
    const res = await debugApi.getStorage()
    storageInfo.value = res.data
  } catch (err: any) {
    error.value = err.message
  }
}

const onImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = '/images/placeholder.jpg'
  imageLoaded.value = true
}

onMounted(() => {
  fetchStorageInfo()
})
</script>