import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { hashApi } from '@/api/modules/hash'
import type { HistoryRecord } from '@/types/api'

export const useHistoryStore = defineStore('history', () => {
  const historyItems = ref<HistoryRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeRecords = computed(() => historyItems.value.filter(r => r.status !== 'deleted'))
  const deletedRecords = computed(() => historyItems.value.filter(r => r.status === 'deleted'))

  async function fetchHistory() {
    loading.value = true
    error.value = null
    try {
      const data = await hashApi.getHistory()
      historyItems.value = data.data.map((item: any) => ({
        ...item,
        status: item.status || 'active',
        imageUrl: item.imageUrl || `/images/${item.hash}.jpg`
      }))
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function addRecords(records: Partial<HistoryRecord>[]) {
    records.forEach(record => {
      if (!record.hash) return
      const existingIndex = historyItems.value.findIndex(r => r.hash === record.hash)
      const newRecord: HistoryRecord = {
        id: record.id || Date.now(),
        hash: record.hash,
        filename: record.filename || '',
        status: record.status || 'confirmed',
        timestamp: record.timestamp || new Date().toISOString(),
        blockHeight: record.blockHeight || null,
        imageUrl: record.imageUrl || `/images/${record.hash}.jpg`
      }
      if (existingIndex > -1) {
        historyItems.value[existingIndex] = newRecord
      } else {
        historyItems.value.unshift(newRecord)
      }
    })
  }

  function onUploadSuccess(record: Partial<HistoryRecord>) {
    addRecords([{ ...record, status: 'confirmed' }])
  }

  function onVerifySuccess(filename: string, hash: string, isVerified: boolean) {
    addRecords([{
      hash,
      filename,
      status: isVerified ? 'confirmed' : 'active',
      timestamp: new Date().toISOString()
    }])
  }

  function onDeleteRecord(hash: string) {
    const index = historyItems.value.findIndex(r => r.hash === hash)
    if (index > -1) {
      historyItems.value[index] = { ...historyItems.value[index], status: 'deleted' }
    }
  }

  async function refreshHistory() {
    await fetchHistory()
  }

  async function clearAllRecords() {
    historyItems.value = []
  }

  return {
    historyItems,
    loading,
    error,
    activeRecords,
    deletedRecords,
    fetchHistory,
    addRecords,
    onUploadSuccess,
    onVerifySuccess,
    onDeleteRecord,
    refreshHistory,
    clearAllRecords
  }
})