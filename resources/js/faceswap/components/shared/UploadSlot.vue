<template>
  <div>
    <h2 class="mb-3 text-[15px] font-bold tracking-[0.15px] text-[#ffdce2]">{{ title }}</h2>
    <label class="upload-slot" :class="{ 'has-preview': preview }" :style="previewStyle">
      <input class="hidden" type="file" accept="image/*,.heic,.heif" @change="handleChange" />
      <span v-if="preview" class="upload-preview" role="img" :aria-label="file?.name || title"></span>
      <span v-else class="flex flex-col items-center gap-[10px] text-center">
        <img class="h-[39px] w-[39px] object-contain" :src="gmatamAssets.uploadIcon" alt="" />
        <span class="text-sm font-bold leading-5 tracking-[-1.4px] text-white/80">
          點擊上傳（10MB）<br />支援常見圖片格式
        </span>
      </span>
    </label>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { gmatamAssets } from '@/config/gmatamAssets'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  file: {
    type: Object,
    default: null
  },
  preview: {
    type: String,
    default: ''
  }
})

const previewStyle = computed(() => {
  return props.preview ? { '--upload-preview-image': `url("${props.preview}")` } : null
})

const emit = defineEmits(['select'])

function handleChange(event) {
  const file = event.target.files?.[0]
  if (file) emit('select', file)
  event.target.value = ''
}
</script>
