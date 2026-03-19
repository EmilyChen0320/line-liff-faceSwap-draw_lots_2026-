<template>
  <div
    class="flex justify-center items-center w-[114px] h-8"
    style="border-radius: 30px; background: var(--Linear, linear-gradient(90deg, var(--Core-Purple-600, #674598) 0%, var(--Core-Purple-300, #BCA9D1) 100%));"
  >
    <div class="cp-font text-xs font-bold text-white">
      已生成：{{ currentCount }}/{{ maxLimit }}
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { appConfig } from '@/config/appConfig'

const props = defineProps({
  currentCount: {
    type: Number,
    default: 0
  },
  maxLimit: {
    type: Number,
    default: appConfig.maxUsageLimit
  }
})

// 監聽 currentCount 的變化，用於調試
watch(() => props.currentCount, (newCount, oldCount) => {
  if (oldCount !== newCount) {
    console.log('📊 使用量更新:', `${oldCount || 0} → ${newCount}`)
  }
}, { immediate: true })
</script>
