<template>
  <main class="gmatam-screen figma-page min-h-dvh">
    <AppHeader title="圖片生成紀錄" :userUsage="userUsage" @back="$emit('back')" />

    <section class="px-5 pb-8 pt-8">
      <div v-if="isLoading" class="grid min-h-[420px] place-items-center text-center">
        <div>
          <div class="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[#fd7bb9] border-t-transparent"></div>
          <p class="text-[#ffd8e8]">載入中...</p>
        </div>
      </div>

      <div v-else-if="errorMessage" class="grid min-h-[420px] place-items-center text-center">
        <div>
          <p class="mb-3 text-lg font-bold text-[#ffd8e8]">載入失敗</p>
          <p class="mb-5 text-sm text-white/72">{{ errorMessage }}</p>
          <button class="secondary-button h-10 px-6" @click="loadUserHistory">重試</button>
        </div>
      </div>

      <div v-else-if="historyData.length === 0" class="grid min-h-[420px] place-items-center text-center">
        <div>
          <p class="mb-2 text-lg font-bold text-[#ffd8e8]">尚無生成紀錄</p>
          <p class="text-sm text-white/72">您還沒有生成過任何圖片</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-4">
        <button
          v-for="item in historyData"
          :key="item.id"
          class="history-card"
          @click="$emit('view-result', item)"
        >
          <img v-if="item.image" class="h-[166px] w-[125px] rounded object-cover" :src="item.image" alt="生成紀錄" />
          <div v-else class="grid h-[166px] w-[125px] place-items-center rounded bg-black/20 text-xs text-white/60">無圖片</div>
          <span class="mt-3 block text-left text-xs leading-5 text-white">{{ formatDate(item.created_at) }}</span>
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import AppHeader from './shared/AppHeader.vue'
import { gmatamService } from '@/services/gmatamService'

const props = defineProps({
  userId: {
    type: String,
    default: ''
  },
  userUsage: {
    type: Number,
    default: 0
  }
})

defineEmits(['back', 'view-result', 'regenerate'])

const historyData = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

async function loadUserHistory() {
  if (!props.userId) {
    historyData.value = []
    return
  }

  try {
    isLoading.value = true
    errorMessage.value = ''
    historyData.value = await gmatamService.getUserHistory(props.userId)
  } catch (error) {
    console.error('載入歷史失敗', error)
    errorMessage.value = '載入歷史失敗，請稍後再試'
    historyData.value = []
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return '未知時間'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '未知時間'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${d} ${hh}:${mm}`
}

onMounted(loadUserHistory)
watch(() => props.userId, loadUserHistory)
</script>
