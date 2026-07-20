<template>
  <header class="figma-header">
    <div class="flex min-w-0 items-center gap-3">
      <button
        v-if="showBack"
        class="grid h-8 w-8 place-items-center text-[34px] leading-none text-white"
        @click="$emit('back')"
        aria-label="返回"
      >
        ‹
      </button>
      <div v-if="title === '圖片生成紀錄'" class="min-w-0">
        <h1 class="truncate text-xl font-bold text-white">{{ title }}</h1>
      </div>
      <img v-else class="h-[22px] w-[246px] object-contain object-left" :src="gmatamAssets.logo" alt="傳藝金曲獎" />
    </div>
    <UsageCounter :currentCount="userUsage" />
  </header>
</template>

<script setup>
import UsageCounter from '../UsageCounter.vue'
import { gmatamAssets } from '@/config/gmatamAssets'

defineProps({
  title: {
    type: String,
    default: '我與我同臺'
  },
  userUsage: {
    type: Number,
    default: 0
  },
  showBack: {
    type: Boolean,
    default: true
  }
})

defineEmits(['back'])
</script>
