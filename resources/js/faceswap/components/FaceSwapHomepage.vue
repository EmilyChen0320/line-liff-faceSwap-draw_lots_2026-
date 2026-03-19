<template>
  <div
    class="relative mx-auto my-0 w-[375px] max-md:w-full max-md:max-w-screen-md max-sm:w-full cursor-pointer overflow-hidden flex items-center justify-center bg-white"
    @click="enterFaceSwap"
    :style="{ 
      minHeight: '100vh',
      height: '100dvh'
    }"
  >
    <img
      :src="imageUrls.hpbackground"
      alt="Face Swap Homepage"
      class="absolute inset-0 w-full h-full object-contain"
    />
  </div>
</template>

<script setup>
import { imageUrls } from '@/config/imageUrls'

const emit = defineEmits(['enter-face-swap'])

function enterFaceSwap() {
  emit('enter-face-swap')
}
</script>
