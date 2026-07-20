<template>
  <div class="figma-steps">
    <img class="step-connector step-connector-left" :src="gmatamAssets.stepLine" alt="" aria-hidden="true" />
    <img class="step-connector step-connector-right" :src="gmatamAssets.stepLine" alt="" aria-hidden="true" />
    <img class="step-item" :src="stepOneAsset" alt="選擇性別" />
    <img class="step-item" :src="stepTwoAsset" alt="上傳照片" />
    <img class="step-item" :src="stepThreeAsset" alt="生成圖片" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gmatamAssets } from '@/config/gmatamAssets'

const props = defineProps({
  step: {
    type: Number,
    default: 1
  }
})

const stepOneAsset = computed(() => props.step > 1 ? gmatamAssets.step1Done : gmatamAssets.step1Active)
const stepTwoAsset = computed(() => {
  if (props.step > 2) return gmatamAssets.step2Done
  if (props.step === 2) return gmatamAssets.step2Active
  return gmatamAssets.step2Inactive
})
const stepThreeAsset = computed(() => props.step === 3 ? gmatamAssets.step3Active : gmatamAssets.step3Inactive)
</script>
