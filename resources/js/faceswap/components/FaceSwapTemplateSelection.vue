<template>
  <main class="gmatam-screen figma-page min-h-dvh">
    <AppHeader title="選擇性別" :userUsage="userUsage" :showBack="false" @back="$emit('back')" />

    <section class="px-5 pb-8 pt-8">
      <StepIndicator :step="1" />

      <div class="mt-[67px] grid grid-cols-2 gap-3">
        <button
          v-for="option in config.genderOptions"
          :key="option.key"
          class="gender-card"
          :class="{ selected: selectedGender === option.key }"
          @click="selectedGender = option.key"
        >
          <img class="h-full w-full object-contain" :src="genderImage(option.key)" :alt="option.label" />
        </button>
      </div>

      <button
        class="asset-button next-button mt-12 h-[42px] w-full"
        :class="{ disabled: !selectedGender || isAtLimit }"
        :disabled="!selectedGender || isAtLimit"
        @click="nextStep"
      >
        <span class="sr-only">下一步</span>
      </button>

      <button class="history-link-text mt-7 w-full text-center text-sm font-bold" @click="$emit('show-history')">圖片生成紀錄</button>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppHeader from './shared/AppHeader.vue'
import StepIndicator from './shared/StepIndicator.vue'
import { gmatamConfig as config, isLocalLimitBypassEnabled } from '@/config/activityConfig'
import { gmatamAssets } from '@/config/gmatamAssets'

const props = defineProps({
  userUsage: {
    type: Number,
    default: 0
  },
  userId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['next-step', 'back', 'show-history'])
const selectedGender = ref('')
const isAtLimit = computed(() => !isLocalLimitBypassEnabled() && props.userUsage >= config.maxUsageLimit)

function nextStep() {
  if (!selectedGender.value || isAtLimit.value) return
  sessionStorage.setItem('gmatam:selectedGender', selectedGender.value)
  emit('next-step', { selectedTemplate: selectedGender.value })
}

function genderImage(key) {
  if (key === 'male') {
    return selectedGender.value === key ? gmatamAssets.maleSelected : gmatamAssets.maleDefault
  }

  return selectedGender.value === key ? gmatamAssets.femaleSelected : gmatamAssets.femaleDefault
}
</script>
