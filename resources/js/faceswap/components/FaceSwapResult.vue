<template>
  <div
    class="relative mx-auto my-0 w-[375px] max-md:w-full max-md:max-w-screen-md max-sm:w-full"
    :style="{ 
      minHeight: '100dvh',
      backgroundImage: `url(${imageUrls.background1})`, 
      backgroundSize: '100% 100%', 
      backgroundPosition: 'center center', 
      backgroundRepeat: 'no-repeat'
    }"
  >
    <!-- Face Swap History Page -->
    <FaceSwapHistory 
      v-if="showHistory" 
      :userId="props.userId || 'abc'"
      :userUsage="userUsage"
      @back="showHistory = false"
      @regenerate="handleHistoryRegenerate"
    />
    
    <!-- Main Result Page -->
    <div v-if="!showHistory" class="flex-1 flex flex-col">
      <!-- Header -->
      <div class="flex gap-5 justify-center items-center self-stretch px-5 py-6 w-full font-bold whitespace-nowrap gradient-border-bottom min-h-20">
        <div
          class="self-stretch my-auto"
          data-name="AI換臉"
        >
          <img
            :src="imageUrls.header1"
            class="h-16 object-contain"
            alt="AI換臉"
          />
        </div>
        <UsageCounter :currentCount="userUsage" />
      </div>

     <!-- 步驟 -->
     <div
      class="flex items-center mt-8 max-w-full text-base font-bold text-center text-[#EBD8B2] whitespace-nowrap w-[202px] mx-auto"
    >
      <img
        :src="imageUrls.finish"
        class="w-6 h-6 object-contain"
        alt="Step 1"
      />
      <img
        :src="imageUrls.horizontal"
        class="shrink-0 w-[65px] h-6 object-cover translate-y-2.5"
        alt="分隔線"
      />
      <img
        :src="imageUrls.step2_inprogress"
        class="w-6 h-6 object-contain"
        alt="Step 2"
      />
      <img
        :src="imageUrls.horizontal"
        class="shrink-0 w-[65px] h-6 object-cover translate-y-2.5"
        alt="分隔線"
      />
      <img
        :src="imageUrls.step3_inprogress"
        class="w-6 h-6 object-contain"
        alt="Step 3"
      />
    </div>
    <!-- 步驟文字 -->
    <div
      class="flex gap-5 justify-between max-w-full text-sm text-center w-[218px] mx-auto mb-8"
    >
      <div class="step-gradient-text" data-name="Step 1">Step 1</div>
      <div class="step-gradient-text" data-name="Step 2">Step 2</div>
      <div class="step-gradient-text" data-name="Step 3">Step 3</div>
    </div>

      
    <div class="flex justify-start items-center px-12 mb-4">
        <div class="flex items-center gap-3">
          <img 
            :src="imageUrls.step3_inprogress" 
            class="w-6 h-6 object-contain" 
            alt="Step 3"
          />
          <div class="text-base font-bold cp-font step-gradient-text">
            生成結果
          </div>
        </div>
      </div>
      <!-- Main Content -->
      <div class="flex-1">
          <!-- 載入狀態 -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center h-60">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BCA9D1] mb-4"></div>
            <div class="text-[#BCA9D1] text-center">
              <div class="text-lg font-bold mb-2">{{ loadingMessage }}</div>
              <div class="text-sm">{{ loadingSubMessage }}</div>
            </div>
          </div>
          
          <!-- 錯誤狀態 -->
          <div v-else-if="error" class="flex flex-col items-center justify-center h-60">
            <div class="text-red-400 text-center">
              <div class="text-lg font-bold mb-2">生成失敗</div>
              <div class="text-sm mb-4">{{ error }}</div>
              <button 
                @click="retryCheckStatus"
                class="px-4 py-2 bg-[#EBD8B2] text-[#333] rounded-md hover:bg-[#d4c29a] transition-colors"
              >
                重試
              </button>
            </div>
          </div>
          
          <!-- 結果內容 -->
          <div v-else-if="taskResult" class="space-y-6 px-4">
            <!-- Result Image -->
            <div v-if="generatedImages.length > 0">
              <div v-for="(image, index) in generatedImages" :key="index" class="mb-4">
                <div 
                  class="relative cursor-pointer"
                  :ref="(el) => setResultImageRef(el, index)"
                  @click="selectedImageIndex = index"
                >
                  <img 
                    class="w-full object-contain rounded-md" 
                    :src="image" 
                    :alt="`生成結果 ${index + 1}`"
                    @error="handleImageError"
                    @load="handleImageLoad"
                  />
                  <img
                    v-if="shouldShowLogo(image)"
                    :src="imageUrls.logo"
                    alt="logo"
                    class="absolute top-[24px] right-[20px] w-[15%] max-w-[72px] pointer-events-none select-none z-20"
                  />
                </div>
                <div v-if="imageLoadErrors[image]" class="text-center text-red-400 text-sm mt-2">
                  ⚠️ 圖片載入失敗，請檢查網路連線
                </div>
              </div>
            </div>
            <div v-else class="w-full h-60 bg-gray-700 rounded-md flex items-center justify-center">
              <div class="text-[#BCA9D1] text-center">
                <div class="text-lg font-bold mb-2">生成中...</div>
                <div class="text-sm">請稍候，正在處理您的圖片</div>
              </div>
            </div>
          </div>
 
      </div>

      <!-- Action Buttons -->
      <div class="px-5 py-8">
        <div class="flex justify-center gap-3 mb-8">
          <!-- Regenerate Button -->
          <button 
            class="w-[173px] h-[44px] flex justify-center items-center cursor-pointer transition-colors text-base font-bold cp-font text-[#0E0E0E]"
            style="border-radius: 30px; background: var(--Core-Purple-300, #BCA9D1);"
            @click="regenerate"
          >
            重新生成
          </button>
          
          <!-- Download Button -->
          <button 
            class="w-[173px] h-[44px] flex justify-center items-center cursor-pointer transition-all duration-300 text-base font-bold hover:shadow-lg"
            :style="
              taskResult && taskResult.status === 'completed' && !isDownloading
                ? 'border-radius: 30px; background: var(--Linear, linear-gradient(90deg, var(--Core-Purple-600, #674598) 0%, var(--Core-Purple-300, #BCA9D1) 100%)); box-shadow: -2px 3px 9px 0 #BCA9D1;'
                : 'border-radius: 30px; background: #666666;'
            "
            :class="
              taskResult && taskResult.status === 'completed' && !isDownloading
                ? ''
                : 'opacity-50 cursor-not-allowed'
            "
            @click="downloadToOfficial"
            :disabled="!taskResult || taskResult.status !== 'completed' || isDownloading"
          >
            <div v-if="isDownloading" class="flex items-center gap-[10px]">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0E0E0E]"></div>
              <div class="cp-font text-white">
                處理中...
              </div>
            </div>
            <div v-else class="cp-font text-white">
              下載至官方帳號
            </div>
          </button>
        </div>

        <!-- Generation History Title -->
        <div 
          class="text-base font-bold step-gradient-text text-center cursor-pointer transition-colors"
          @click="showHistory = true"
        >
          圖片生成紀錄
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import FaceSwapHistory from './FaceSwapHistory.vue'
import UsageCounter from './UsageCounter.vue'
import { roadshowService } from '../../services/roadshowService.js'
import { imageUrls } from '@/config/imageUrls'
import { useScreenshot } from '@/composables/useScreenshot'
import { composeImageWithLogo } from '@/utils/composeImageWithLogo'

// Define props
const props = defineProps({
  taskId: {
    type: [String, Number],
    default: ''
  },
  userId: {
    type: String,
    default: ''
  },
  selectedTemplate: {
    type: String,
    default: ''
  },
  userUsage: {
    type: Number,
    default: 0
  }
});

// Define emits for parent component communication
const emit = defineEmits(['back', 'regenerate', 'download'])

// State for showing history page
const showHistory = ref(false)

// 任務相關狀態
const isLoading = ref(false)
const error = ref(null)
const taskResult = ref(null)
const generatedImages = ref([])
const originalImages = ref([]) // 保存原始圖片 URL 用於下載
const imageLoadErrors = ref({})
const imageLoadedStates = ref({})
const selectedImageIndex = ref(0)
const resultImageRefs = ref({})
const brandedImageObjectUrls = ref([])
const brandedImageFlags = ref({})

// 載入狀態訊息
const loadingMessage = ref('檢查任務狀態...')
const loadingSubMessage = ref('請稍候')

// 下載相關狀態
const isDownloading = ref(false)

// 顯示訊息函數
function showMessage(message, type = 'info') {
  if (type === 'success') {
    alert(message)
  } else if (type === 'error') {
    alert(message)
  } else {
    console.log(message)
  }
}

const { captureScreenshot, compressImage, downloadToLocal, uploadImage } = useScreenshot()

function setResultImageRef(el, index) {
  if (el) {
    resultImageRefs.value[index] = el
  } else {
    delete resultImageRefs.value[index]
  }
}

function revokeBrandedObjectUrls() {
  brandedImageObjectUrls.value.forEach((url) => {
    if (typeof url === 'string' && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  })
  brandedImageObjectUrls.value = []
}

function buildProcessedImageUrl(imageUrl) {
  const config = window.endpoint || {}
  const apiUrl = config.imageProcessApi || 'https://stg-api.fanpokka.ai/api/static-resource'
  const params = config.imageProcessParams || { scale: 2, format: 'jpg', quality: 90, width: 800, height: 600 }

  const queryParams = new URLSearchParams()
  queryParams.append('url', imageUrl)
  if (params.scale) queryParams.append('scale', params.scale)
  if (params.format) queryParams.append('format', params.format)
  if (params.quality) queryParams.append('quality', params.quality)
  if (params.width) queryParams.append('width', params.width)
  if (params.height) queryParams.append('height', params.height)

  return `${apiUrl}?${queryParams.toString()}`
}

async function buildBrandedImageUrl(imageUrl, index) {
  const tryComposeAndUpload = async (baseImageUrl) => {
    const blob = await composeImageWithLogo({
      baseImageUrl,
      logoUrl: imageUrls.logo,
      marginPx: 20,
      logoWidthRatio: 0.15
    })

    const uploadedUrl = await uploadImage(blob, props.userId || 'abc', `faceswap-result-${index + 1}`)
    if (uploadedUrl) {
      return uploadedUrl
    }

    const objectUrl = URL.createObjectURL(blob)
    brandedImageObjectUrls.value.push(objectUrl)
    return objectUrl
  }

  try {
    return await tryComposeAndUpload(buildProcessedImageUrl(imageUrl))
  } catch (processedError) {
    console.warn('⚠️ 含 Logo 圖片處理失敗，改用原始圖片重試:', processedError)
    return tryComposeAndUpload(imageUrl)
  }
}

// 透過 LIFF 發送圖片
async function sendViaLiff(imageUrl) {
  try {
    if (typeof liff === 'undefined') {
      throw new Error('LIFF SDK 未載入，請確保在 LINE 環境中使用')
    }
    
    if (!liff.isInClient()) {
      throw new Error('不在 LINE 應用內，無法發送訊息。請在 LINE 應用中開啟此頁面。')
    }
    
    if (!liff.isLoggedIn()) {
      throw new Error('用戶未登入，無法發送訊息。請先登入 LINE 帳號。')
    }
    await liff.sendMessages([
      {
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: imageUrl
      }
    ])
  } catch (error) {
    console.error('❌ 發送訊息失敗:', error)
    if (error.message) {
      throw error
    } else {
      throw new Error(`發送失敗: ${error.toString()}`)
    }
  }
}

// 監聽taskId變化
watch(() => props.taskId, (newTaskId) => {
  if (newTaskId) {
    checkTaskStatus()
  }
}, { immediate: true })

// 監聽selectedTemplate變化，處理顯示歷史的請求
watch(() => props.selectedTemplate, (newTemplate) => {
  if (newTemplate === 'show_history') {
    // 設置顯示歷史
    showHistory.value = true
  }
}, { immediate: true })

// 監聽 userUsage 變化
watch(() => props.userUsage, (newUsage, oldUsage) => {
  // 用戶使用量變化時的處理邏輯
}, { immediate: true })

// 檢查任務狀態
async function checkTaskStatus() {
  if (!props.taskId) {
    return
  }
  
  try {
    isLoading.value = true
    error.value = null
    loadingMessage.value = '檢查任務狀態...'
    loadingSubMessage.value = '請稍候'
    
    const normalizedTaskId = String(props.taskId)
    const result = await roadshowService.checkTaskStatus(normalizedTaskId)
    
    // 新 API 響應格式: { success: true, id, status, images, template_id, result }
    if (result && (result.success || result.status === 'completed' || result.status === 'pending' || result.status === 'processing')) {
      taskResult.value = result;

      // 根據狀態處理
      await handleTaskStatus(result);
    } else if (result && result.error) {
      error.value = result.error.message || '檢查任務狀態失敗';
      console.error('❌ 檢查任務狀態失敗:', result.error);
    } else {
      error.value = '檢查任務狀態失敗';
      console.error('❌ 檢查任務狀態失敗: 未知錯誤');
    }
  } catch (err) {
    error.value = '網路錯誤，請檢查連線'
    console.error('❌ 檢查任務狀態時發生錯誤:', err)
  } finally {
    isLoading.value = false
  }
}

// 處理任務狀態
async function handleTaskStatus(data) {
  const status = data.status
  
  switch (status) {
    case 'pending':
      loadingMessage.value = '任務等待中'
      loadingSubMessage.value = '正在排隊處理...'
      // 延遲後再次檢查
      setTimeout(checkTaskStatus, 3000)
      break
      
    case 'processing':
      loadingMessage.value = '正在處理中'
      loadingSubMessage.value = '請稍候，正在生成您的頭像...'
      // 延遲後再次檢查
      setTimeout(checkTaskStatus, 2000)
      break
      
    case 'completed':
      loadingMessage.value = '生成完成！'
      loadingSubMessage.value = ''
      const images = data.images || data.result?.images || []
      
      if (images && Array.isArray(images) && images.length > 0) {
        // 保存原始圖片 URL
        originalImages.value = images
        imageLoadErrors.value = {}
        imageLoadedStates.value = {}
        brandedImageFlags.value = {}

        revokeBrandedObjectUrls()
        loadingMessage.value = '正在套用 Logo...'
        loadingSubMessage.value = '請稍候'

        const processedImages = await Promise.all(images.map(async (imageUrl, index) => {
          try {
            const brandedUrl = await buildBrandedImageUrl(imageUrl, index)
            brandedImageFlags.value[brandedUrl] = true
            return brandedUrl
          } catch (error) {
            console.error('❌ 處理含 Logo 圖片時發生錯誤:', error)
            return buildProcessedImageUrl(imageUrl)
          }
        }))

        generatedImages.value = processedImages
      }
      break
      
    case 'failed':
      error.value = '任務處理失敗，請重新生成'
      console.error('❌ 任務處理失敗')
      break
      
    default:
      error.value = '未知的任務狀態'
  }
}

// 重試檢查狀態
function retryCheckStatus() {
  error.value = null
  checkTaskStatus()
}

// Handle regenerate button click
function regenerate() {
  emit('regenerate')
}

// Handle regenerate from history
function handleHistoryRegenerate() {
  // 關閉歷史頁面
  showHistory.value = false
  // 發送重新生成事件到父組件
  emit('regenerate')
}

// Handle download to official account button click
async function downloadToOfficial() {
  if (!taskResult.value || taskResult.value.status !== 'completed') {
    console.warn('⚠️ 任務尚未完成，無法下載')
    showMessage('任務尚未完成，無法下載', 'error')
    return
  }

  if (isDownloading.value) {
    console.log('⏳ 正在處理中，請稍候...')
    return
  }

  if (!generatedImages.value || generatedImages.value.length === 0) {
    showMessage('沒有生成的圖片，無法下載', 'error')
    return
  }

  try {
    isDownloading.value = true
    
    const imageIndex = selectedImageIndex.value >= 0 && selectedImageIndex.value < generatedImages.value.length 
      ? selectedImageIndex.value 
      : 0

    const displayImageUrl = generatedImages.value[imageIndex]
    if (!displayImageUrl) {
      showMessage('無法獲取圖片 URL，無法下載', 'error')
      return
    }

    if (brandedImageFlags.value[displayImageUrl] && !displayImageUrl.startsWith('blob:')) {
      loadingMessage.value = '正在發送到官方帳號...'
      loadingSubMessage.value = '請稍候'
      await sendViaLiff(displayImageUrl)
      showMessage('圖片已成功發送到官方帳號！', 'success')
      return
    }

    const targetContainer = resultImageRefs.value[imageIndex]
    if (!targetContainer) {
      showMessage('找不到結果圖片區域，請稍後再試', 'error')
      return
    }

    loadingMessage.value = '正在處理圖片...'
    loadingSubMessage.value = '請稍候'

    const canvas = await captureScreenshot(targetContainer, {
      padding: 0,
      scaleFactor: 1,
      backgroundColor: null
    })
    const blob = await compressImage(canvas)

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const forceUploadOnLocal = Boolean(window.endpoint?.forceUploadOnLocal)

    // 本地測試預設下載到本機；若有開 forceUploadOnLocal，則改走 API
    if (isLocalhost && !forceUploadOnLocal) {
      downloadToLocal(blob, `faceswap-result-${imageIndex + 1}`)
      showMessage('圖片已下載到本機', 'success')
      return
    }

    // 生產環境：上傳後再透過 LIFF 發送
    loadingMessage.value = '正在上傳圖片...'
    loadingSubMessage.value = '請稍候'
    const uploadedUrl = await uploadImage(blob, props.userId || 'abc', `faceswap-result-${imageIndex + 1}`)
    if (!uploadedUrl) {
      downloadToLocal(blob, `faceswap-result-${imageIndex + 1}`)
      showMessage('尚未設定圖片上傳 API，已改為下載到本機', 'success')
      return
    }

    loadingMessage.value = '正在發送到官方帳號...'
    loadingSubMessage.value = '請稍候'
    await sendViaLiff(uploadedUrl)
    showMessage('圖片已成功發送到官方帳號！', 'success')
    
  } catch (error) {
    console.error('❌ 下載流程失敗:', error)
    showMessage(`下載失敗: ${error.message}`, 'error')
  } finally {
    isDownloading.value = false
    loadingMessage.value = '檢查任務狀態...'
    loadingSubMessage.value = '請稍候'
  }
}


// 處理圖片載入錯誤
function handleImageError(event) {
  const imageUrl = event.target.src;
  console.error('❌ 圖片載入失敗:', imageUrl);
  imageLoadErrors.value[imageUrl] = true;
  imageLoadedStates.value[imageUrl] = false;
}

// 處理圖片載入成功
function handleImageLoad(event) {
  const imageUrl = event.target.src;
  if (imageLoadErrors.value[imageUrl]) {
    delete imageLoadErrors.value[imageUrl];
  }
  imageLoadedStates.value[imageUrl] = true;
}

function shouldShowLogo(imageUrl) {
  return Boolean(
    imageUrl &&
    imageLoadedStates.value[imageUrl] &&
    !imageLoadErrors.value[imageUrl] &&
    !brandedImageFlags.value[imageUrl]
  )
}

function getTemplateImage(templateId) {
  const imageMap = {
    'a1art1': imageUrls.a1art1,
    'a1art2': imageUrls.a1art2,
    'a1art3': imageUrls.a1art3,
    'a1art4': imageUrls.a1art4
  };
  
  return imageMap[templateId] || imageUrls.a1art1;
}

function getTemplateName(templateId) {
  return '預設模板';
}

// 組件掛載時檢查狀態
onMounted(() => {
  if (props.taskId) {
    checkTaskStatus()
  }
})
</script>

