<template>
  <div class="flex h-[26px] w-[97px] items-center justify-center bg-contain bg-center bg-no-repeat" :style="{ backgroundImage: `url(${gmatamAssets.statusContainer})` }">
    <div class="cp-font text-[13px] font-bold leading-[13px] tracking-[-0.13px] text-[#0E0E0E]">
      已生成：{{ currentCount }}/{{ maxLimit }}
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { gmatamConfig } from '@/config/activityConfig'
import { gmatamAssets } from '@/config/gmatamAssets'

const props = defineProps({
  currentCount: {
    type: Number,
    default: 0
  },
  maxLimit: {
    type: Number,
    default: gmatamConfig.maxUsageLimit
  }
})

// 監聽 currentCount 的變化，用於調試
watch(() => props.currentCount, (newCount, oldCount) => {
  if (oldCount !== newCount) {
    console.log('📊 使用量更新:', `${oldCount || 0} → ${newCount}`)
  }
}, { immediate: true })
</script>
