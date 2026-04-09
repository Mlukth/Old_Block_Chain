<template>
  <div class="batch-verification-container p-6">
    <h2 class="text-2xl font-bold mb-6">批量验证哈希</h2>

    <div class="form-group mb-4">
      <label for="hashes-textarea" class="block text-sm font-medium mb-2">
        输入多个哈希值（每行一个）:
      </label>
      <textarea
        id="hashes-textarea"
        v-model="hashesText"
        rows="8"
        placeholder="输入要验证的哈希值，每行一个"
        class="w-full p-3 border rounded-lg"
      />
    </div>

    <button
      @click="handleVerifyHashes"
      :disabled="isVerifying || !hashesText.trim()"
      class="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {{ isVerifying ? '验证中...' : '批量验证' }}
    </button>

    <div v-if="results" class="results-container mt-6">
      <h3 class="text-xl font-semibold mb-4">验证结果</h3>
      <div class="results-list space-y-2">
        <div
          v-for="(result, index) in results"
          :key="index"
          class="result-item p-3 rounded-lg border"
          :class="{
            'bg-green-50 border-green-300': result.exists,
            'bg-red-50 border-red-300': result.error,
            'bg-yellow-50 border-yellow-300': !result.exists && !result.error
          }"
        >
          <div class="result-hash font-mono text-sm break-all">{{ result.hash || '错误' }}</div>
          <div class="result-status text-sm mt-1 font-medium" :class="{
            'text-green-700': result.exists,
            'text-red-700': result.error,
            'text-yellow-700': !result.exists && !result.error
          }">
            {{ result.exists ? '✅ 存在于区块链' : result.error ? `❌ ${result.error}` : '⚠️ 不存在于区块链' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { hashApi } from '@/api/modules/hash'

const hashesText = ref('')
const results = ref<any[] | null>(null)
const isVerifying = ref(false)

const handleVerifyHashes = async () => {
  if (!hashesText.value.trim()) {
    alert('请输入要验证的哈希列表')
    return
  }

  const hashes = hashesText.value
    .split('\n')
    .map(hash => hash.trim())
    .filter(hash => hash)

  isVerifying.value = true
  const verificationResults: any[] = []

  for (const hash of hashes) {
    try {
      const result = await hashApi.verifyHash({ hash })
      verificationResults.push({
        hash,
        exists: result.data.isVerified,
        error: null
      })
    } catch (error: any) {
      verificationResults.push({
        hash,
        exists: false,
        error: error.message || '验证出错'
      })
    }
  }

  results.value = verificationResults
  isVerifying.value = false
}
</script>