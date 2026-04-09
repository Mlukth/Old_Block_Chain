<template>
  <div class="min-h-screen flex flex-col">
    <main class="container mx-auto px-4 max-w-3xl py-8 flex-grow">
      <div class="bg-white rounded-xl shadow-card hover:shadow-lg transition-all duration-300 border border-gray-100 p-6 md:p-8 mb-6">
        <div class="text-center mb-8">
          <h2 class="text-2xl font-bold text-dark mb-2">哈希验证工具</h2>
          <p class="text-gray-500">验证图片哈希是否存在于区块链</p>
        </div>

        <!-- 状态通知 -->
        <div v-if="status.message" class="p-4 rounded-lg mb-4" :class="{
          'bg-green-100 text-green-800': status.type === 'success',
          'bg-yellow-100 text-yellow-800': status.type === 'warning',
          'bg-red-100 text-red-800': status.type === 'danger',
          'bg-blue-100 text-blue-800': status.type === 'info'
        }">
          <div class="flex items-center">
            <i v-if="status.type === 'success'" class="fa fa-check-circle mr-3"></i>
            <i v-else-if="status.type === 'warning'" class="fa fa-exclamation-circle mr-3"></i>
            <i v-else-if="status.type === 'danger'" class="fa fa-exclamation-circle mr-3"></i>
            <i v-else class="fa fa-info-circle mr-3"></i>
            <p class="text-sm font-medium">{{ status.message }}</p>
          </div>
        </div>

        <!-- 验证方式选择 -->
        <div class="mb-6">
          <div class="flex space-x-4 mb-4">
            <button
              @click="verificationMode = 'file'"
              class="px-4 py-2 rounded-lg font-medium"
              :class="verificationMode === 'file' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              <i class="fa fa-file-image mr-2"></i>
              上传文件验证
            </button>
            <button
              @click="verificationMode = 'input'"
              class="px-4 py-2 rounded-lg font-medium"
              :class="verificationMode === 'input' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              <i class="fa fa-hashtag mr-2"></i>
              直接输入哈希
            </button>
          </div>

          <!-- 文件上传验证模式 -->
          <div v-if="verificationMode === 'file'" class="space-y-4">
            <div v-if="imagePreview" class="flex justify-center">
              <img :src="imagePreview" alt="预览" class="max-w-xs max-h-48 object-contain border rounded-lg" />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">选择图片文件</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <i class="fa fa-image"></i>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleImageChange"
                  class="pl-12 w-full rounded-xl border border-gray-300 py-3 px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <p class="mt-1 text-xs text-gray-500">支持JPG/PNG/WEBP格式，最大50MB</p>
            </div>

            <button
              @click="handleCalculateHash"
              :disabled="isProcessing || !selectedImage"
              class="w-full flex items-center justify-center py-3 px-6 rounded-xl font-medium transition-all"
              :class="{
                'bg-gray-200 text-gray-500 cursor-not-allowed': isProcessing || !selectedImage,
                'bg-primary text-white hover:bg-primary/90': !isProcessing && selectedImage
              }"
            >
              <i v-if="isProcessing" class="fa fa-spinner animate-spin mr-2"></i>
              <i v-else class="fa fa-calculator mr-2"></i>
              <span>计算哈希值</span>
            </button>
          </div>

          <!-- 直接输入哈希模式 -->
          <div v-if="verificationMode === 'input'" class="space-y-4">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">输入区块链哈希值</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                  <i class="fa fa-hashtag"></i>
                </div>
                <input
                  type="text"
                  v-model="customHash"
                  placeholder="输入以0x开头的66位哈希值"
                  class="pl-12 w-full rounded-xl border border-gray-300 py-3 px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
              </div>
              <p class="mt-1 text-xs text-gray-500">请从区块链浏览器获取完整哈希值</p>
            </div>
          </div>

          <!-- 验证按钮 -->
          <button
            @click="handleVerifyHash"
            :disabled="isProcessing || (verificationMode === 'file' && !imageHash) || (verificationMode === 'input' && !customHash)"
            class="w-full mt-4 flex items-center justify-center py-3 px-6 rounded-xl font-medium transition-all"
            :class="{
              'bg-gray-200 text-gray-500 cursor-not-allowed': isProcessing || (verificationMode === 'file' && !imageHash) || (verificationMode === 'input' && !customHash),
              'bg-secondary text-white hover:bg-secondary/90': !isProcessing && ((verificationMode === 'file' && imageHash) || (verificationMode === 'input' && customHash))
            }"
          >
            <i v-if="isProcessing" class="fa fa-spinner animate-spin mr-2"></i>
            <i v-else class="fa fa-check-circle mr-2"></i>
            <span>验证哈希</span>
          </button>

          <!-- 删除哈希按钮 -->
          <button
            v-if="verificationMode === 'file' && imageHash"
            @click="handleDeleteHash"
            :disabled="isProcessing"
            class="w-full mt-4 flex items-center justify-center py-3 px-6 rounded-xl font-medium transition-all"
            :class="{
              'bg-gray-200 text-gray-500 cursor-not-allowed': isProcessing,
              'bg-red-600 text-white hover:bg-red-700': !isProcessing
            }"
          >
            <i v-if="isProcessing" class="fa fa-spinner animate-spin mr-2"></i>
            <i v-else class="fa fa-trash mr-2"></i>
            <span>从链上删除哈希</span>
          </button>
        </div>

        <!-- 结果显示 -->
        <div v-if="verifyResult || deleteResult || verificationResult" class="space-y-4 mt-6">
          <div v-if="verifyResult" class="p-4 rounded-lg" :class="getStatusStyle(verifyResult)">
            <div class="flex items-center">
              <i :class="getStatusIcon(verifyResult)"></i>
              <span class="font-medium">{{ verifyResult }}</span>
            </div>
          </div>

          <div v-if="deleteResult" class="p-4 rounded-lg" :class="getStatusStyle(deleteResult)">
            <div class="flex items-center">
              <i :class="getStatusIcon(deleteResult)"></i>
              <span class="font-medium">{{ deleteResult }}</span>
            </div>
          </div>

          <div v-if="verificationResult" class="bg-light rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border p-5" :class="{
            'border-green-500': verificationResult.type === 'success',
            'border-yellow-500': verificationResult.type === 'warning',
            'border-red-500': verificationResult.type === 'error'
          }">
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-semibold text-dark flex items-center">
                <i v-if="verificationResult.type === 'success'" class="fa fa-check-circle text-green-500 mr-2"></i>
                <i v-else-if="verificationResult.type === 'warning'" class="fa fa-exclamation-circle text-yellow-500 mr-2"></i>
                <i v-else class="fa fa-exclamation-circle text-red-500 mr-2"></i>
                验证结果
              </h3>
            </div>

            <p class="text-sm font-medium" :class="{
              'text-green-500': verificationResult.type === 'success',
              'text-yellow-500': verificationResult.type === 'warning',
              'text-red-500': verificationResult.type === 'error'
            }">
              {{ verificationResult.message }}
            </p>

            <div v-if="verificationResult.localHash" class="mt-4">
              <p class="text-xs text-gray-500 mb-1">文件哈希:</p>
              <div class="relative group">
                <code class="text-xs font-mono text-gray-700 break-all block p-2 bg-gray-50 rounded-lg">
                  {{ verificationResult.localHash }}
                </code>
                <button
                  @click="copyToClipboard(verificationResult.localHash)"
                  class="absolute top-2 right-2 text-gray-500 hover:text-primary"
                  title="复制哈希值"
                >
                  <i class="fa fa-copy"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 辅助说明卡片 -->
      <div class="bg-white/10 rounded-xl shadow-card p-5 text-white mt-6">
        <h4 class="font-medium mb-3">验证流程说明</h4>
        <ul class="text-sm space-y-2">
          <li class="flex items-start">
            <span class="mr-2 mt-1 font-bold">1.</span>
            <span>上传需要验证的图片文件</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2 mt-1 font-bold">2.</span>
            <span>点击「计算哈希值」按钮</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2 mt-1 font-bold">3.</span>
            <span>点击「验证哈希」按钮</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2 mt-1 font-bold">4.</span>
            <span>系统会自动计算文件哈希并查询区块链记录</span>
          </li>
          <li class="flex items-start">
            <span class="mr-2 mt-1 font-bold">5.</span>
            <span>显示验证结果：哈希是否存在于链上</span>
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
const verificationMode = ref<'file' | 'input'>('file')
const selectedImage = ref<File | null>(null)
const imagePreview = ref('')
const imageHash = ref('')
const customHash = ref('')
const isProcessing = ref(false)
const verifyResult = ref('')
const deleteResult = ref('')
const verificationResult = ref<any>(null)
const status = reactive<{ type: 'success' | 'warning' | 'danger' | 'info' | ''; message: string }>({
  type: '',
  message: ''
})

// 文件选择
const handleImageChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  selectedImage.value = file
  imageHash.value = ''
  verifyResult.value = ''
  deleteResult.value = ''
  verificationResult.value = null
  status.type = 'info'
  status.message = `已选择文件: ${file.name}`

  const reader = new FileReader()
  reader.onloadend = () => {
    imagePreview.value = reader.result as string
  }
  reader.readAsDataURL(file)
}

// 计算哈希
const handleCalculateHash = async () => {
  if (!selectedImage.value) {
    verifyResult.value = '请先选择图片文件'
    return
  }

  isProcessing.value = true
  status.type = 'info'
  status.message = '正在计算本地哈希...'

  try {
    const result = await hashApi.calculateHash(selectedImage.value)
    imageHash.value = result.data.hash
    verifyResult.value = `哈希计算成功: ${result.data.hash.substring(0, 20)}...`
  } catch (error) {
    const apiError = handleApiError(error)
    verifyResult.value = `计算失败: ${apiError.message}`
  } finally {
    isProcessing.value = false
  }
}

// 验证哈希
const handleVerifyHash = async () => {
  let hashToVerify = ''

  if (verificationMode.value === 'file') {
    if (!imageHash.value) {
      verifyResult.value = '请先计算图片哈希'
      return
    }
    hashToVerify = imageHash.value
  } else {
    if (!customHash.value) {
      verifyResult.value = '请输入哈希值'
      return
    }
    if (!customHash.value.startsWith('0x') || customHash.value.length !== 66) {
      verifyResult.value = '请输入有效的66位哈希值（以0x开头）'
      return
    }
    hashToVerify = customHash.value
  }

  isProcessing.value = true
  status.type = 'info'
  status.message = '正在验证...'

  try {
    const result = await hashApi.verifyHash({ hash: hashToVerify })
    const isVerified = result.data.isVerified
    verifyResult.value = result.data.message

    verificationResult.value = {
      type: isVerified ? 'success' : 'warning',
      message: isVerified
        ? '验证成功！文件哈希已存在于区块链中'
        : '验证完成！文件哈希不存在于区块链中',
      localHash: hashToVerify,
      chainHash: isVerified ? hashToVerify : '未找到记录'
    }

    // TODO: 记录历史
    console.log('Verify success:', { hash: hashToVerify, isVerified })
  } catch (error) {
    const apiError = handleApiError(error)
    verifyResult.value = `验证失败: ${apiError.message}`
    verificationResult.value = {
      type: 'error',
      message: `验证失败: ${apiError.message || '未知错误'}`
    }
  } finally {
    isProcessing.value = false
  }
}

// 删除哈希
const handleDeleteHash = async () => {
  const hashToDelete = imageHash.value
  if (!hashToDelete) {
    deleteResult.value = '请先计算图片哈希'
    return
  }

  if (!confirm(`确定要删除此哈希吗？\n${hashToDelete.substring(0, 30)}...`)) {
    return
  }

  isProcessing.value = true
  deleteResult.value = '正在删除...'

  try {
    const result = await hashApi.deleteHash(hashToDelete)
    if (result.data.success) {
      deleteResult.value = '🗑️ 哈希已从链上删除'
      imageHash.value = ''
    } else {
      deleteResult.value = `删除失败: ${result.data.error || '未知原因'}`
    }
  } catch (error) {
    const apiError = handleApiError(error)
    deleteResult.value = `删除失败: ${apiError.message}`
  } finally {
    isProcessing.value = false
  }
}

// 辅助函数
const getStatusStyle = (text: string) => {
  if (!text) return ''
  if (text.includes('✅') || text.includes('🗑️')) return 'bg-green-100 text-green-800'
  if (text.includes('❌')) return 'bg-red-100 text-red-800'
  return 'bg-blue-100 text-blue-800'
}

const getStatusIcon = (text: string) => {
  if (!text) return ''
  if (text.includes('✅')) return 'fa fa-check-circle text-green-500 mr-2'
  if (text.includes('❌')) return 'fa fa-exclamation-circle text-red-500 mr-2'
  if (text.includes('🗑️')) return 'fa fa-trash text-green-500 mr-2'
  return 'fa fa-exclamation-circle text-blue-500 mr-2'
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}
</script>