<template>
  <main class="gmatam-screen figma-page min-h-dvh">
    <AppHeader title="合成結果" :userUsage="userUsage" :showBack="false" @back="$emit('back')" />

    <section class="px-5 pb-8 pt-8">
      <StepIndicator :step="3" />

      <div class="mt-8">
        <div v-if="isLoading" class="result-panel grid min-h-[420px] place-items-center text-center">
          <div>
            <div class="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#fd7bb9] border-t-transparent"></div>
            <p class="mb-2 text-lg font-bold text-[#ffd8e8]">{{ loadingMessage }}</p>
            <p class="text-sm leading-6 text-white/72">如使用人數眾多可能會花費較多時間，可以稍後再回來查看唷！</p>
          </div>
        </div>

        <div v-else-if="errorMessage" class="result-panel grid min-h-[420px] place-items-center text-center">
          <div>
            <p class="mb-3 text-lg font-bold text-[#ffd8e8]">生成失敗</p>
            <p class="text-sm text-white/72">{{ errorMessage }}</p>
          </div>
        </div>

        <div v-else class="result-panel">
          <img
            v-if="resultImage"
            class="w-full rounded-md object-contain"
            :src="resultImage"
            alt="合成結果"
          />
          <div v-else class="grid min-h-[420px] place-items-center text-center text-white/72">尚無合成結果</div>
        </div>
      </div>

      <div class="mt-8 grid grid-cols-2 gap-4">
        <button
          class="asset-button regenerate-button h-10"
          :class="{ disabled: isAtLimit }"
          :disabled="isAtLimit"
          @click="$emit('regenerate')"
        >
          <span class="sr-only">重新生成</span>
        </button>
        <button
          class="asset-button download-button h-10"
          :class="{ disabled: !resultImage }"
          :disabled="!resultImage"
          @click="downloadImage"
        >
          <span class="sr-only">下載圖片</span>
        </button>
      </div>

      <!-- <div v-if="showDownloadGuide" class="mt-5 rounded-md border border-[#f6c771]/40 bg-black/24 p-4 text-sm leading-6 text-white">
        <p class="font-bold text-[#f7d99c]">怎麼開啟瀏覽器下載圖片？</p>
        <template v-if="isAndroid">
          <p>1. 點擊右下角三個點</p>
          <p>2. 點擊在瀏覽器中開啟，進入後長按圖片下載</p>
        </template>
        <p v-else>長按圖片下載</p>
      </div> -->

      <button class="history-link-text mt-7 w-full text-center text-sm font-bold" @click="$emit('show-history')">圖片生成紀錄</button>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppHeader from './shared/AppHeader.vue'
import StepIndicator from './shared/StepIndicator.vue'
import { gmatamConfig as config, isLocalLimitBypassEnabled } from '@/config/activityConfig'
import { gmatamService } from '@/services/gmatamService'

const props = defineProps({
  taskId: {
    type: String,
    default: ''
  },
  userId: {
    type: String,
    default: ''
  },
  selectedTemplate: {
    type: String,
    default: ''
  },
  userUsage: {
    type: Number,
    default: 0
  },
  historyItem: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['back', 'regenerate', 'show-history', 'completed'])

const isLoading = ref(false)
const loadingMessage = ref('生成進行中')
const errorMessage = ref('')
const result = ref(null)
const showDownloadGuide = ref(false)
let pollTimer = null

const resultImage = computed(() => result.value?.image || props.historyItem?.image || '')
const isAtLimit = computed(() => !isLocalLimitBypassEnabled() && props.userUsage >= config.maxUsageLimit)
const isAndroid = computed(() => {
  if (typeof liff !== 'undefined' && liff.getOS) return liff.getOS() === 'android'
  return /Android/i.test(navigator.userAgent)
})

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer)
    pollTimer = null
  }
}

async function pollGeneration() {
  if (!props.taskId || props.historyItem) return

  try {
    isLoading.value = true
    errorMessage.value = ''
    const record = await gmatamService.pollGeneration(props.taskId)
    result.value = record

    if (record.status === 'completed') {
      isLoading.value = false
      await gmatamService.saveCompletedHistory(props.userId, record)
      emit('completed', record)
      return
    }

    if (record.status === 'failed') {
      isLoading.value = false
      errorMessage.value = getResultErrorMessage(record)
      emit('completed', record)
      return
    }

    loadingMessage.value = record.status === 'pending' ? '任務排隊中' : '生成進行中'
    pollTimer = setTimeout(pollGeneration, 3000)
  } catch (error) {
    console.error('輪詢生成狀態失敗', error)
    isLoading.value = false
    errorMessage.value = getResultErrorMessage(error)
  }
}

function getResultErrorMessage(error) {
  const fallback = '生成失敗，請稍後再試'
  if (error?.status === 413) return '上傳檔案太大'

  const payload = error?.payload
  if (payload) {
    return payload.result?.message ||
      payload.result?.error ||
      payload.message ||
      payload.error ||
      fallback
  }

  const directMessage = error?.error_message || error?.message || error?.original?.message || error?.original?.error_message || ''
  if (!directMessage) return fallback

  try {
    const data = JSON.parse(directMessage)
    return data.result?.message ||
      data.result?.error ||
      data.message ||
      data.error ||
      fallback
  } catch {
    if (error?.status) return `生成失敗：HTTP ${error.status} ${directMessage || error.statusText || ''}`.trim()
    return directMessage
  }
}

function downloadImage() {
  if (!resultImage.value) return
  showDownloadGuide.value = true

  if (typeof liff !== 'undefined' && liff.openWindow) {
    liff.openWindow({ url: resultImage.value, external: false })
  } else {
    window.open(resultImage.value, '_blank')
  }
}

function loadInitialState() {
  stopPolling()
  errorMessage.value = ''
  showDownloadGuide.value = false

  if (props.historyItem) {
    result.value = props.historyItem
    isLoading.value = false
    return
  }

  result.value = null
  isLoading.value = true
  loadingMessage.value = '生成進行中'
  pollTimer = setTimeout(pollGeneration, 3000)
}

watch(() => [props.taskId, props.historyItem], loadInitialState, { immediate: true })
onMounted(loadInitialState)
onBeforeUnmount(stopPolling)
</script>
