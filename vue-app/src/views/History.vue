<template>
  <div class="min-h-screen">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-white mb-6 flex items-center">
        <i class="fa fa-history mr-3"></i> 历史记录
      </h1>

      <div class="mb-8">
        <div class="flex items-center">
          <div class="relative flex-1 mr-4">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/70">
              <i class="fa fa-search"></i>
            </div>
            <input
              type="text"
              placeholder="搜索哈希或文件名..."
              v-model="searchTerm"
              class="pl-10 w-full bg-white/20 border border-white/30 rounded-xl py-3 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div v-if="filteredHistory.length > 0" class="flex space-x-4 mb-6">
        <button
          @click="handleClearAll"
          :disabled="loading || resetting || deletedCount === 0"
          class="bg-red-600 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-xl transition duration-300 flex-1 disabled:opacity-50"
        >
          <i v-if="resetting" class="fa fa-spinner animate-spin mr-2"></i>
          <i v-else class="fa fa-trash mr-2"></i>
          清除已删除记录 (共 {{ deletedCount }} 条)
        </button>
        
        <button
          @click="handleFullReset"
          :disabled="loading || resetting"
          class="bg-purple-600 hover:bg-purple-800 text-white font-bold py-3 px-6 rounded-xl transition duration-300 flex-1 disabled:opacity-50"
        >
          <i v-if="resetting" class="fa fa-spinner animate-spin mr-2"></i>
          <i v-else class="fa fa-bomb mr-2"></i>
          完全重置环境
        </button>
      </div>

      <div v-if="loading" class="flex justify-center items-center h-64">
        <i class="fa fa-spinner animate-spin text-3xl text-white"></i>
      </div>

      <div v-else-if="filteredHistory.length === 0" class="text-center py-12 text-white/80">
        <i class="fa fa-image text-4xl mx-auto mb-4 text-primary"></i>
        <p class="text-xl">没有找到历史记录</p>
        <p class="mt-2">尝试上传一些图片并计算哈希值</p>
        <RouterLink to="/upload" class="mt-4 inline-block bg-white text-primary hover:bg-gray-100 font-bold py-3 px-6 rounded-xl transition duration-300">
          去上传图片
        </RouterLink>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="record in filteredHistory" 
          :key="record.hash" 
          class="card bg-white/10 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg border border-white/20 relative"
        >
          <div class="absolute top-4 right-4 px-3 py-1 rounded-full text-xs" :class="record.status === 'confirmed' || record.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'">
            {{ record.status === 'confirmed' || record.status === 'active' ? '已上链' : '已删除' }}
          </div>

          <div v-if="record.status === 'deleted'" class="w-full h-48 flex items-center justify-center bg-gray-800 border-2 border-dashed border-red-500">
            <div class="text-center text-red-500">
              <i class="fa fa-times-circle text-3xl mx-auto mb-2"></i>
              <p>记录已删除</p>
              <p class="text-xs mt-2">哈希: {{ record.hash.substring(0, 16) }}...</p>
              <p v-if="record.blockHeight" class="text-xs">区块高度: {{ record.blockHeight }}</p>
            </div>
          </div>
          <div v-else-if="record.imageUrl" class="mb-4 cursor-pointer group relative" @click="openPreview(record.imageUrl)">
            <div v-if="imageLoading[record.hash]" class="absolute inset-0 flex items-center justify-center">
              <i class="fa fa-spinner animate-spin text-2xl text-white"></i>
            </div>
            <div class="aspect-w-16 aspect-h-9 bg-black/20 rounded-lg overflow-hidden" :class="{ 'opacity-30': imageLoading[record.hash] }">
              <img 
                v-if="imageLoadStatus[record.hash] !== false"
                :src="record.imageUrl"
                :alt="`Preview for ${record.filename || record.hash}`"
                class="w-full h-48 object-contain transition-transform duration-300 group-hover:scale-105"
                @load="onImageLoad(record.hash)"
                @error="onImageError(record.hash)"
              />
              <div v-else class="w-full h-48 flex items-center justify-center bg-gray-800">
                <div class="text-center text-white/70">
                  <i class="fa fa-times-circle text-3xl mx-auto mb-2"></i>
                  <p>图片无法加载</p>
                </div>
              </div>
            </div>
            <div class="mt-2 text-center text-white/70 text-sm flex items-center justify-center">
              <i class="fa fa-eye mr-1"></i> 点击查看大图
            </div>
          </div>
          <div v-else class="w-full h-48 flex items-center justify-center bg-gray-800">
            <div class="text-center text-white/70">
              <i class="fa fa-times-circle text-3xl mx-auto mb-2"></i>
              <p>图片无法加载</p>
            </div>
          </div>

          <div>
            <h3 class="font-bold text-white truncate" :title="record.filename || '未命名文件'">
              {{ record.filename || '未命名文件' }}
            </h3>
            <p class="text-xs text-white/50 mt-1">
              {{ new Date(record.timestamp).toLocaleString() }}
            </p>

            <div class="mt-4 bg-black/30 rounded-lg p-3">
              <div class="text-xs text-white/70 mb-1">哈希值</div>
              <code class="text-xs text-white break-all">
                {{ record.hash }}
              </code>
            </div>

            <div v-if="record.blockHeight" class="mt-2 text-sm">
              <span class="text-white/70">区块高度: </span>
              <span class="text-white">{{ record.blockHeight }}</span>
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <button 
              v-if="record.status === 'confirmed' || record.status === 'active'"
              class="text-red-500 hover:text-red-400 flex items-center"
              @click="handleDelete(record.hash)"
            >
              <i class="fa fa-trash mr-1"></i> 删除记录
            </button>
          </div>
        </div>
      </div>
    </div>

    <ImagePreview 
      v-if="previewImage" 
      :imageUrl="previewImage" 
      @close="previewImage = null" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { historyApi } from '@/api/modules/history'
import { hashApi } from '@/api/modules/hash'
import ImagePreview from '@/components/ImagePreview.vue'
import { RouterLink } from 'vue-router'

const store = useHistoryStore()
const loading = ref(true)
const resetting = ref(false)
const searchTerm = ref('')
const previewImage = ref<string | null>(null)
const imageLoading = ref<Record<string, boolean>>({})
const imageLoadStatus = ref<Record<string, boolean>>({})

const history = computed(() => store.historyItems)
const filteredHistory = computed(() => {
  if (!searchTerm.value) return history.value
  return history.value.filter(item => 
    item.hash.includes(searchTerm.value) || 
    (item.filename && item.filename.includes(searchTerm.value))
  )
})
const deletedCount = computed(() => filteredHistory.value.filter(r => r.status === 'deleted').length)

const fetchHistory = async () => {
  loading.value = true
  try {
    await store.refreshHistory()
  } catch (err) {
    console.error('获取历史失败', err)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (hash: string) => {
  if (!confirm('确定要删除这个哈希记录吗？')) return
  try {
    await hashApi.deleteHash(hash)
    store.onDeleteRecord(hash)
  } catch (err: any) {
    alert('删除失败: ' + err.message)
  }
}

const handleClearAll = async () => {
  if (!confirm('确定要清空所有已删除记录吗？这将永久删除这些记录！')) return
  resetting.value = true
  try {
    await historyApi.clearAll()
    window.location.reload()
  } catch (err: any) {
    alert('清空失败: ' + err.message)
  } finally {
    resetting.value = false
  }
}

const handleFullReset = async () => {
  const msg = `确定要完全重置所有记录吗？这将永久删除：
- 所有数据库记录
- 所有上传的图片
- 所有处理过的图片
- 所有报告文件
此操作不可撤销！`
  if (!confirm(msg)) return
  resetting.value = true
  try {
    const response = await historyApi.resetAll()
    alert(`✅ 重置成功！
删除记录: ${response.data.stats.deletedRecords || 0} 条
删除文件: ${response.data.stats.deletedFiles || 0} 个
删除目录: ${response.data.stats.deletedDirectories || 0} 个`)
    window.location.reload()
  } catch (err: any) {
    alert('❌ 完全重置失败: ' + err.message)
  } finally {
    resetting.value = false
  }
}

const openPreview = (url: string) => {
  previewImage.value = url
}

const onImageLoad = (hash: string) => {
  imageLoading.value[hash] = false
  imageLoadStatus.value[hash] = true
}
const onImageError = (hash: string) => {
  imageLoading.value[hash] = false
  imageLoadStatus.value[hash] = false
}

onMounted(() => {
  fetchHistory()
})
</script>