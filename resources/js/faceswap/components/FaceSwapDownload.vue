<template>
  <main class="gmatam-download min-h-dvh">
    <section class="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center px-5 py-6">
      <button class="mb-5 self-start text-[34px] leading-none text-white" type="button" aria-label="返回" @click="$emit('back')">
        ‹
      </button>

      <a
        v-if="imageUrl"
        :href="imageUrl"
        target="_blank"
        rel="noopener"
        class="download-image-link"
      >
        <img
          :src="imageUrl"
          alt="合成結果"
          class="block h-auto w-full"
        />
      </a>

      <div v-else class="grid min-h-[320px] w-full place-items-center text-center text-white/72">
        找不到生成圖片
      </div>

      <img
        v-if="isLineWebView && imageUrl"
        class="mt-6 h-auto w-full"
        :src="gmatamAssets.downloadGuide"
        alt="LINE 外部瀏覽器操作示範"
        draggable="false"
      />

      <p v-else-if="imageUrl" class="mt-6 text-center text-base font-bold leading-7 text-white">
        請長按圖片儲存
      </p>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { gmatamAssets } from '@/config/gmatamAssets'

defineProps({
  imageUrl: {
    type: String,
    default: ''
  }
})

defineEmits(['back'])

const userAgent = navigator.userAgent || ''
const isLineWebView = computed(() => /Line\//i.test(userAgent))
</script>

<style scoped>
.gmatam-download {
  background: #000;
  color: #fff;
  font-family: 'GenRyuMin2 TW', system-ui, sans-serif;
}

.download-image-link {
  display: block;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  background: #000;
  -webkit-touch-callout: default;
  -webkit-user-select: auto;
  user-select: auto;
}
</style>
