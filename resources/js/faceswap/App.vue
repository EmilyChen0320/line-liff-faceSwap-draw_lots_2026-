<template>
  <div class="gmatam-app">
    <main v-if="authBlocked" class="gmatam-screen grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p class="mb-3 text-sm font-bold text-[#f7d99c]">傳藝金曲獎</p>
        <h1 class="mb-4 text-2xl font-bold text-white">請先加入官方帳號好友</h1>
        <p class="mb-7 text-sm leading-6 text-white/72">完成 LINE 授權並加入好友後，即可使用「我與我同臺」AI 合成圖片服務。</p>
        <button class="primary-button h-11 w-full px-8" @click="openOfficialAccount">前往加入好友</button>
      </div>
    </main>

    <FaceSwapHomepage
      v-else-if="currentStep === 'home'"
      :userUsage="userUsage"
      @enter-face-swap="goToGenderSelection"
      @show-history="goToHistory"
    />

    <FaceSwapTemplateSelection
      v-else-if="currentStep === 'gender-selection'"
      :userUsage="userUsage"
      :userId="userId"
      @next-step="handleGenderSelection"
      @show-history="goToHistory"
      @back="currentStep = 'home'"
    />

    <FaceSwapUpload
      v-else-if="currentStep === 'upload'"
      :selectedTemplate="selectedGender"
      :userUsage="userUsage"
      :userId="userId"
      :userName="userName"
      @back="currentStep = 'gender-selection'"
      @generate="handleGenerateStarted"
      @showHistory="goToHistory"
      @refreshUsage="refreshUserUsage"
    />

    <FaceSwapResult
      v-else-if="currentStep === 'result'"
      :taskId="generationId"
      :userId="userId"
      :selectedTemplate="selectedGender"
      :userUsage="userUsage"
      :historyItem="selectedHistoryItem"
      @back="currentStep = selectedHistoryItem ? 'history' : 'upload'"
      @regenerate="handleRegenerate"
      @show-history="goToHistory"
      @completed="handleGenerationCompleted"
    />

    <FaceSwapHistory
      v-else-if="currentStep === 'history'"
      :userId="userId"
      :userUsage="userUsage"
      @back="currentStep = 'home'"
      @view-result="handleHistoryResult"
      @regenerate="handleRegenerate"
    />
  </div>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue'
import FaceSwapHomepage from './components/FaceSwapHomepage.vue'
import FaceSwapTemplateSelection from './components/FaceSwapTemplateSelection.vue'
import FaceSwapUpload from './components/FaceSwapUpload.vue'
import FaceSwapResult from './components/FaceSwapResult.vue'
import FaceSwapHistory from './components/FaceSwapHistory.vue'
import { liffService } from '../services/liffService.js'
import { gmatamService } from '../services/gmatamService.js'

const currentStep = ref('home')
const userId = ref('')
const userName = ref('')
const userUsage = ref(0)
const selectedGender = ref('')
const generationId = ref('')
const selectedHistoryItem = ref(null)
const authBlocked = ref(false)

async function initializeLiff() {
  const result = await liffService.initializeLiff()

  if (result?.userId) {
    userId.value = result.userId
    userName.value = result.displayName || result.userName || result.userId
  }

  if (result?.isLoggedIn && result?.isFriend === false) {
    authBlocked.value = true
    openOfficialAccount()
    return
  }

  try {
    const profile = await liffService.getUserProfile()
    if (profile?.displayName) {
      userName.value = profile.displayName
    }
  } catch (error) {
    console.warn('無法取得 LINE profile，使用 UID 作為名稱', error)
  }
}

function openOfficialAccount() {
  const basicId = window.endpoint?.basicId || window.LINE_BASIC_ID
  if (!basicId) return

  const url = `https://line.me/R/ti/p/${basicId}`
  if (typeof liff !== 'undefined' && liff.openWindow) {
    liff.openWindow({ url, external: false })
  } else {
    window.location.href = url
  }
}

async function refreshUserUsage() {
  if (!userId.value) return

  try {
    userUsage.value = await gmatamService.getUsage(userId.value)
  } catch (error) {
    console.warn('刷新使用量失敗，暫以 0 顯示', error)
    userUsage.value = 0
  }
}

async function goToGenderSelection() {
  await refreshUserUsage()
  selectedHistoryItem.value = null
  generationId.value = ''
  currentStep.value = 'gender-selection'
}

function handleGenderSelection({ selectedTemplate }) {
  selectedGender.value = selectedTemplate
  sessionStorage.setItem('gmatam:selectedGender', selectedTemplate)
  currentStep.value = 'upload'
}

async function handleGenerateStarted({ taskId, selectedTemplate }) {
  generationId.value = String(taskId || '')
  selectedGender.value = selectedTemplate || selectedGender.value
  selectedHistoryItem.value = null
  currentStep.value = 'result'
}

async function handleGenerationCompleted() {
  await refreshUserUsage()
}

function handleRegenerate() {
  selectedHistoryItem.value = null
  generationId.value = ''
  currentStep.value = 'gender-selection'
}

async function goToHistory() {
  await refreshUserUsage()
  selectedHistoryItem.value = null
  currentStep.value = 'history'
}

function handleHistoryResult(item) {
  selectedHistoryItem.value = item
  generationId.value = String(item?.generation_id || item?.id || '')
  selectedGender.value = item?.gender || selectedGender.value
  currentStep.value = 'result'
}

onBeforeMount(async () => {
  await initializeLiff()
  await refreshUserUsage()
})
</script>

<style scoped>
.gmatam-app {
  min-height: 100vh;
  overflow-x: hidden;
  background: #070103;
  color: #fff;
  font-family: 'GenRyuMin2 TW', system-ui, sans-serif;
}
</style>
