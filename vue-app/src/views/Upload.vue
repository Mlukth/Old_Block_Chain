<template>
  <div class="min-h-screen flex flex-col">
    <main class="container mx-auto px-4 max-w-3xl py-8 flex-grow">
      <!-- 页面标题 -->
      <div class="text-center mb-8">
        <h2 class="text-2xl font-bold text-white mb-2">图片哈希上链工具</h2>
        <p class="text-white/80">生成并上传图片的唯一哈希值至区块链</p>
      </div>

      <!-- 主卡片 -->
      <div class="card mb-6">
        <!-- 状态通知 -->
        <div v-if="status.message" class="mb-4" :class="statusStyles[status.type]">
          <i v-if="status.type === 'success'" class="fa fa-check-circle mr-3"></i>
          <i v-else-if="status.type === 'warning'" class="fa fa-exclamation-circle mr-3"></i>
          <i v-else-if="status.type === 'danger'" class="fa fa-exclamation-circle mr-3"></i>
          <i v-else-if="status.type === 'info'" class="fa fa-info-circle mr-3"></i>
          <p class="text-sm font-medium">{{ status.message }}</p>
        </div>

        <!-- 文件上传区 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-white mb-3">选择图片文件</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <i class="fa fa-image"></i>
            </div>
            <input
              type="file"
              accept="image/*"
              @change="handleImageChange"
              class="pl-12 w-full rounded-xl border border-gray-300 py-4 px-6 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
          <p class="mt-2 text-xs text-white/70 bg-white/10 p-2 rounded border border-white/20">
            最大支持50MB，哈希算法采用SHA-256标准
          </p>
        </div>

        <!-- 操作按钮区 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            @click="handleCalculateHash"
            :disabled="isProcessing || !selectedImage || !!imageHash"
            class="flex items-center justify-center py-3 px-6 rounded-xl font-medium transition-all duration-300"
            :class="{
              'bg-gray-200 text-gray-500 cursor-not-allowed': isProcessing || !selectedImage || imageHash,
              'bg-primary text-white hover:bg-primary/90 hover:-translate-y-1 hover:shadow-lg': !isProcessing && selectedImage && !imageHash
            }"
          >
            <i v-if="isProcessing" class="fa fa-spinner animate-spin mr-2"></i>
            <i v-else class="fa fa-calculator mr-2"></i>
            <span>计算哈希值</span>
          </button>

          <button
            @click="handleUploadToBlockchain()"
            :disabled="isProcessing || !imageHash || isHashUploaded"
            class="flex items-center justify-center py-3 px-6 rounded-xl font-medium transition-all"
            :class="{
              'bg-green-500 text-white': isHashUploaded,
              'bg-gray-400 text-gray-200 cursor-not-allowed': isProcessing || !imageHash,
              'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02]': !isProcessing && imageHash && !isHashUploaded
            }"
          >
            <i v-if="isProcessing" class="fa fa-spinner animate-spin mr-2"></i>
            <i v-else-if="isHashUploaded" class="fa fa-check-circle mr-2"></i>
            <i v-else class="fa fa-cloud-upload mr-2"></i>
            <span>{{ isHashUploaded ? '上链成功' : '上传到区块链' }}</span>
          </button>
        </div>

        <!-- 哈希结果区 -->
        <div v-if="imageHash" class="bg-light rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 p-5">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-semibold text-dark flex items-center">
              <i class="fa fa-info-circle text-primary mr-2"></i>
              计算结果
            </h3>
            <span class="text-xs px-3 py-2 bg-primary/10 text-primary rounded-full font-medium">
              SHA-256
            </span>
          </div>
          <div class="relative group">
            <code class="text-sm font-mono text-gray-700 break-all block p-3 bg-gray-50 rounded-lg">
              {{ imageHash }}
            </code>
            <button
              @click="copyToClipboard(imageHash)"
              class="absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-primary"
            >
              <span class="bg-white px-2 py-1 rounded shadow-sm text-xs flex items-center">
                <i class="fa fa-copy mr-1"></i> 复制
              </span>
            </button>
          </div>

          <div v-if="isHashUploaded" class="mt-3 text-sm text-success flex items-center">
            <i class="fa fa-check-circle mr-1"></i> 已上传到区块链
          </div>

          <div v-if="isHashUploaded && uploadResult?.txHash" class="mt-3">
            <a
              :href="`https://sepolia.etherscan.io/tx/${uploadResult.txHash}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-400 hover:underline flex items-center"
            >
              <span class="flex items-center">
                <i class="fa fa-external-link mr-1"></i> 在区块链浏览器中查看交易
              </span>
            </a>
          </div>
        </div>
      </div>

      <!-- 批量上传区域 -->
      <div class="mt-8">
        <h3 class="text-xl font-bold mb-4 text-white">批量图片上传</h3>

        <div class="bg-white/10 rounded-xl p-6">
          <div class="mb-4">
            <label class="block text-sm font-medium text-white mb-3">
              选择多个图片文件
            </label>
            <input
              type="file"
              accept="image/*"
              @change="handleBatchImageChange"
              multiple
              :disabled="isBatchUploading"
              class="w-full rounded-xl border border-white/30 py-3 px-4 text-white placeholder-white/50 bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
            <p class="mt-2 text-xs text-white/70 bg-white/10 p-2 rounded border border-white/20">
              最大支持50MB，可多选
            </p>
          </div>

          <button
            v-if="batchFiles.length > 0 && !isBatchUploading"
            @click="handleBatchUpload"
            class="w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-purple-700 flex items-center justify-center"
          >
            <i class="fa fa-cloud-upload mr-2"></i>
            批量上传 ({{ batchFiles.length }}个文件)
          </button>

          <div v-if="isBatchUploading" class="mt-6">
            <div class="flex justify-between mb-2">
              <span class="text-white">上传进度</span>
              <span class="text-white">{{ batchProgress }}%</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-2.5">
              <div
                class="bg-blue-500 h-2.5 rounded-full"
                :style="{ width: batchProgress + '%' }"
              ></div>
            </div>
            <p class="mt-2 text-center text-white/80">
              正在上传 {{ batchFiles.length }} 个文件...
            </p>
          </div>

          <div v-if="batchResult && !isBatchUploading" class="mt-6 p-4 bg-dark rounded-lg">
            <h4 class="text-lg font-bold text-white mb-3">批量上传结果</h4>
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div class="bg-green-900/30 p-3 rounded-lg">
                <p class="text-2xl font-bold text-green-400">{{ batchResult.success }}</p>
                <p class="text-white/80">成功</p>
              </div>
              <div class="bg-red-900/30 p-3 rounded-lg">
                <p class="text-2xl font-bold text-red-400">{{ batchResult.failed }}</p>
                <p class="text-white/80">失败</p>
              </div>
            </div>

            <button
              class="text-blue-400 underline text-sm"
              @click="showBatchDetails = !showBatchDetails"
            >
              {{ showBatchDetails ? '隐藏详情' : '查看失败详情' }}
            </button>

            <div v-if="showBatchDetails && batchResult.failed > 0" class="mt-4">
              <h5 class="font-medium text-white mb-2">失败文件列表:</h5>
              <div class="max-h-40 overflow-y-auto">
                <div
                  v-for="(result, index) in batchResult.results.filter(r => !r.success)"
                  :key="index"
                  class="p-2 bg-red-900/20 rounded mb-2"
                >
                  <p class="text-white truncate">{{ result.file }}</p>
                  <p class="text-red-300 text-sm">{{ result.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 辅助说明卡片 -->
      <div class="card p-5 text-white mt-8">
        <h4 class="font-medium mb-3 text-lg">操作说明</h4>
        <ul class="space-y-3">
          <li class="flex items-start">
            <span class="mr-2 mt-1 font-bold text-primary">1.</span>
            <span>选择图片文件（支持JPG/PNG/WEBP，最大50MB）</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2 mt-1 font-bold text-primary">2.</span>
            <span>计算图片的唯一哈希值（基于SHA-256算法）</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2 mt-1 font-bold text-primary">3.</span>
            <span>将哈希值上传至区块链永久存证</span>
          </li>
        </ul>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { hashApi } from '@/api/modules/hash'
import { handleApiError } from '@/utils/errorHandler'

// 状态
const selectedImage = ref<File | null>(null)
const imageHash = ref('')
const isProcessing = ref(false)
const isHashUploaded = ref(false)
const uploadResult = ref<any>(null)
const status = reactive<{ type: 'success' | 'warning' | 'danger' | 'info' | ''; message: string }>({
  type: '',
  message: ''
})

// 批量上传状态
const batchFiles = ref<File[]>([])
const batchProgress = ref(0)
const isBatchUploading = ref(false)
const batchResult = ref<any>(null)
const showBatchDetails = ref(false)

// 状态样式映射
const statusStyles: Record<string, string> = {
  success: 'bg-success/10 text-success border-l-4 border-success p-4 rounded-lg flex items-center',
  warning: 'bg-warning/10 text-warning border-l-4 border-warning p-4 rounded-lg flex items-center',
  danger: 'bg-danger/10 text-danger border-l-4 border-danger p-4 rounded-lg flex items-center',
  info: 'bg-info/10 text-info border-l-4 border-info p-4 rounded-lg flex items-center'
}

// 文件选择
const handleImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const maxSize = 50 * 1024 * 1024
  if (file.size > maxSize) {
    status.type = 'danger'
    status.message = `文件过大（最大支持50MB），当前${(file.size / (1024 * 1024)).toFixed(1)}MB`
    return
  }

  selectedImage.value = file
  imageHash.value = ''
  isHashUploaded.value = false
  uploadResult.value = null
  status.type = 'success'
  status.message = `已选择：${file.name}`
}

// 计算哈希
const handleCalculateHash = async () => {
  if (!selectedImage.value) {
    status.type = 'danger'
    status.message = '请先选择图片文件'
    return
  }

  isProcessing.value = true
  status.type = 'info'
  status.message = '正在计算图片哈希...'

  try {
    const result = await hashApi.calculateHash(selectedImage.value)
    const hash = result.data.hash
    if (!hash || !/^(0x)?[0-9a-f]{64}$/i.test(hash)) {
      throw new Error('返回的哈希格式无效')
    }
    imageHash.value = hash.startsWith('0x') ? hash : `0x${hash}`
    isHashUploaded.value = false
    status.type = 'success'
    status.message = '哈希计算完成！'
  } catch (error) {
    console.error('哈希计算错误:', error)
    const apiError = handleApiError(error)
    status.type = 'danger'
    status.message = `计算失败: ${apiError.message}`
  } finally {
    isProcessing.value = false
  }
}

// 上传到区块链
const handleUploadToBlockchain = async (retryCount = 0): Promise<void> => {
  if (!imageHash.value) {
    status.type = 'danger'
    status.message = '哈希值未计算'
    return
  }

  const formData = new FormData()
  formData.append('hash', imageHash.value)
  if (selectedImage.value) {
    formData.append('image', selectedImage.value)
  }

  isProcessing.value = true
  status.type = 'info'
  status.message = '正在上传哈希到区块链...'

  try {
    const result = await hashApi.uploadToBlockchain(selectedImage.value!, imageHash.value)
    isHashUploaded.value = true
    uploadResult.value = result.data
    status.type = 'success'
    status.message = '哈希已成功上传到区块链！'

    // TODO: 记录历史（分块 6 接入 store）
    console.log('Upload success:', { hash: imageHash.value, result: result.data })
  } catch (error) {
    console.error('上传到区块链失败:', error)
    const apiError = handleApiError(error)
    let errorMessage = `上传失败: ${apiError.message}`

    if (apiError.message.includes('404')) {
      errorMessage = '区块链服务未响应，请检查后端状态'
    } else if (apiError.message.includes('认证令牌无效')) {
      errorMessage = '会话已过期，即将跳转登录...'
      setTimeout(() => window.location.href = '/login', 2000)
    } else if (apiError.message.includes('网络错误')) {
      errorMessage = '网络连接异常，请检查网络设置'
    }

    if (retryCount < 3) {
      status.type = 'warning'
      status.message = `尝试重新上传 (${retryCount + 1}/3)...`
      await new Promise(resolve => setTimeout(resolve, 2000))
      return handleUploadToBlockchain(retryCount + 1)
    }

    status.type = 'danger'
    status.message = errorMessage
  } finally {
    isProcessing.value = false
  }
}

// 批量文件选择
const handleBatchImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  const maxSize = 50 * 1024 * 1024

  const validFiles = files.filter(file => file.size <= maxSize)

  if (validFiles.length !== files.length) {
    status.type = 'warning'
    status.message = `部分文件超过50MB限制，已过滤${files.length - validFiles.length}个文件`
  } else {
    status.type = 'success'
    status.message = `已选择${validFiles.length}个文件`
  }

  batchFiles.value = validFiles
}

// 批量上传
const handleBatchUpload = async () => {
  if (batchFiles.value.length === 0) {
    status.type = 'danger'
    status.message = '请先选择文件'
    return
  }

  isBatchUploading.value = true
  batchProgress.value = 0
  const results: any[] = []

  for (let i = 0; i < batchFiles.value.length; i++) {
    const file = batchFiles.value[i]
    try {
      const hashResult = await hashApi.calculateHash(file)
      const hash = hashResult.data.hash

      const formData = new FormData()
      formData.append('image', file)
      formData.append('hash', hash)

      const uploadResult = await hashApi.uploadToBlockchain(file, hash)

      results.push({
        file: file.name,
        hash,
        success: true,
        message: '上传成功',
        txHash: uploadResult.data.txHash
      })

      // TODO: 记录历史
      console.log('Batch upload success:', { file: file.name, hash })
    } catch (error) {
      console.error(`文件上传失败: ${file.name}`, error)
      const apiError = handleApiError(error)
      results.push({
        file: file.name,
        success: false,
        message: apiError.message || '上传失败'
      })
    }

    batchProgress.value = Math.round(((i + 1) / batchFiles.value.length) * 100)
  }

  const finalResult = {
    total: batchFiles.value.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  }

  isBatchUploading.value = false
  batchResult.value = finalResult

  status.type = 'success'
  status.message = `批量上传完成，成功${finalResult.success}/${batchFiles.value.length}个文件`
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}
</script>