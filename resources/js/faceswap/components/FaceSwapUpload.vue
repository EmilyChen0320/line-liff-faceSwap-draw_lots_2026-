<template>
  <main class="gmatam-screen figma-page min-h-dvh">
    <AppHeader title="上傳照片" :userUsage="userUsage" :showBack="false" @back="goBack" />

    <section class="px-5 pb-8 pt-8">
      <StepIndicator :step="2" />

      <div class="mt-8 space-y-8">
        <UploadSlot
          title="1. 請上傳一張【現在】的照片"
          :file="currentPhoto"
          :preview="currentPreview"
          @select="handleSelect('current', $event)"
        />
        <UploadSlot
          title="2. 請上傳一張【過去】的照片"
          :file="pastPhoto"
          :preview="pastPreview"
          @select="handleSelect('past', $event)"
        />
      </div>

      <div class="mt-8">
        <h2 class="mb-3 text-base font-bold text-white">上傳注意事項：</h2>
        <ol class="text-[13px] leading-[22px] text-white">
          <li v-for="(notice, index) in config.copy.uploadNotice" :key="notice">{{ index + 1 }}. {{ notice }}</li>
        </ol>
      </div>

      <p v-if="errorMessage" class="mt-4 rounded-md bg-[#3a101f] px-4 py-3 text-sm text-[#ffd8e8]">{{ errorMessage }}</p>

      <button
        class="asset-button generate-button mt-8 h-[42px] w-full"
        :class="{ disabled: !canGenerate }"
        :disabled="!canGenerate"
        @click="generateFaceSwap"
      >
        <span class="sr-only">{{ isGenerating ? '生成中' : '開始生成' }}</span>
      </button>

      <button class="history-link-text mt-7 w-full text-center text-sm font-bold" @click="$emit('showHistory')">圖片生成紀錄</button>
    </section>

    <div v-if="isGenerating" class="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
      <div class="w-full max-w-[276px] rounded-md border border-[#f6c771]/50 bg-white p-6 text-center text-[#261328]">
        <p class="mb-3 text-lg font-bold">生成進行中</p>
        <p class="text-sm leading-6">如使用人數眾多可能會花費較多時間，可以稍後再回來查看唷！</p>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import AppHeader from './shared/AppHeader.vue'
import StepIndicator from './shared/StepIndicator.vue'
import UploadSlot from './shared/UploadSlot.vue'
import { getGenderOption, gmatamConfig as config, isLocalLimitBypassEnabled } from '@/config/activityConfig'
import { gmatamService } from '@/services/gmatamService'

const props = defineProps({
  selectedTemplate: {
    type: String,
    default: ''
  },
  userUsage: {
    type: Number,
    default: 0
  },
  userId: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['back', 'generate', 'showHistory', 'refreshUsage'])

const currentPhoto = ref(null)
const pastPhoto = ref(null)
const currentPreview = ref('')
const pastPreview = ref('')
const isGenerating = ref(false)
const errorMessage = ref('')

const isAtLimit = computed(() => !isLocalLimitBypassEnabled() && props.userUsage >= config.maxUsageLimit)
const selectedTemplateKey = computed(() => props.selectedTemplate || sessionStorage.getItem('gmatam:selectedGender') || '')
const hasRequiredPhotos = computed(() => {
  return Boolean(currentPhoto.value && pastPhoto.value && currentPreview.value && pastPreview.value)
})
const canGenerate = computed(() => {
  return Boolean(hasRequiredPhotos.value && selectedTemplateKey.value && !isAtLimit.value && !isGenerating.value)
})

function revokePreview(preview) {
  if (preview) URL.revokeObjectURL(preview)
}

function validateFile(file) {
  if (!file) return '請重新選擇照片'
  if (!config.upload.acceptedMimeTypes.includes(file.type)) return '不符合照片格式，請重新上傳'
  if (file.size > config.upload.maxFileSizeMb * 1024 * 1024) return '檔案超過上限，請重新上傳'
  return ''
}

function handleSelect(type, file) {
  const validationMessage = validateFile(file)
  if (validationMessage) {
    errorMessage.value = validationMessage
    return
  }

  errorMessage.value = ''
  const preview = URL.createObjectURL(file)

  if (type === 'current') {
    revokePreview(currentPreview.value)
    currentPhoto.value = file
    currentPreview.value = preview
  } else {
    revokePreview(pastPreview.value)
    pastPhoto.value = file
    pastPreview.value = preview
  }
}

async function generateFaceSwap() {
  if (!canGenerate.value) return

  const genderOption = getGenderOption(selectedTemplateKey.value)
  if (!genderOption) {
    errorMessage.value = '請重新選擇性別'
    return
  }

  try {
    isGenerating.value = true
    errorMessage.value = ''

    const result = await gmatamService.generateComposite({
      userId: props.userId,
      userName: props.userName,
      gender: selectedTemplateKey.value,
      templateId: genderOption.templateId,
      pastPhoto: pastPhoto.value,
      currentPhoto: currentPhoto.value
    })

    emit('refreshUsage')
    emit('generate', {
      taskId: result.generation_id || result.id,
      selectedTemplate: selectedTemplateKey.value
    })
  } catch (error) {
    console.error('生成失敗', error)
    errorMessage.value = getGenerateErrorMessage(error)
  } finally {
    isGenerating.value = false
  }
}

function getGenerateErrorMessage(error) {
  const fallback = '生成失敗，請稍後再試'
  const rawMessage = error?.message || ''
  if (!rawMessage) return fallback

  try {
    const data = JSON.parse(rawMessage)
    return data.result?.message || data.message || fallback
  } catch {
    return rawMessage.startsWith('HTTP ') ? fallback : rawMessage
  }
}

function goBack() {
  emit('back')
}

onUnmounted(() => {
  revokePreview(currentPreview.value)
  revokePreview(pastPreview.value)
})
</script>
