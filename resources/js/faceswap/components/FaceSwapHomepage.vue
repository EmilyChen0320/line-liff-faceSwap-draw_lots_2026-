<template>
  <main class="figma-home" @click="enterFaceSwap">
    <img class="home-cover-image" :src="gmatamAssets.homeImage" alt="我與我同臺主視覺" />
  </main>
</template>

<script setup>
import { gmatamAssets } from '@/config/gmatamAssets'

defineProps({
  userUsage: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['enter-face-swap'])

function enterFaceSwap() {
  emit('enter-face-swap')
}

</script>
