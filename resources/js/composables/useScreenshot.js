import html2canvas from 'html2canvas'

export function useScreenshot() {
  function isLikelyCrossOrigin(src) {
    if (!src || typeof src !== 'string') return false
    if (src.startsWith('data:') || src.startsWith('blob:')) return false
    try {
      const resolved = new URL(src, window.location.href)
      return resolved.origin !== window.location.origin
    } catch {
      // If URL parsing fails, treat it as non-cross-origin
      return false
    }
  }

  async function waitForImageReady(img, timeout = 3000) {
    if (!img) return

    if (!img.complete) {
      await Promise.race([
        new Promise((resolve) => {
          const cleanup = () => {
            img.removeEventListener('load', handleDone)
            img.removeEventListener('error', handleDone)
          }
          const handleDone = () => {
            cleanup()
            resolve()
          }

          img.addEventListener('load', handleDone)
          img.addEventListener('error', handleDone)
        }),
        new Promise((resolve) => setTimeout(resolve, timeout))
      ])
    }

    if (typeof img.decode === 'function') {
      try {
        await img.decode()
      } catch {
        // Ignore decode errors and let html2canvas use current image state
      }
    }

    await new Promise((resolve) => requestAnimationFrame(() => resolve()))
  }

  // 預載入並轉換跨域圖片為 base64
  async function preloadAndConvertImages(container) {
    const images = container.querySelectorAll('img')
    const originalSrcs = new Map() // 儲存原始 src
    
    const convertPromises = Array.from(images).map(async (img) => {
      // 儲存原始 src
      originalSrcs.set(img, img.src)
      
      // 如果是跨域圖片，嘗試轉換為 base64（避免 html2canvas 截圖漏掉圖片）
      if (isLikelyCrossOrigin(img.src)) {
        try {
          console.log('🔄 正在轉換跨域圖片:', img.src)
          // fetch 方式通常比 Image+Canvas 更穩定（避免 tainted canvas）
          const base64 = await fetchImageAsBase64(img.src)
          img.src = base64
          await waitForImageReady(img)
          console.log('✅ 跨域圖片已轉換為 base64')
        } catch (error) {
          console.warn('⚠️ 無法轉換跨域圖片，將使用佔位符:', error)
          // 使用佔位符
          const width = img.naturalWidth || img.width || 300
          const height = img.naturalHeight || img.height || 200
          img.src = createPlaceholderImage(width, height)
          await waitForImageReady(img)
        }
      } else {
        // 確保本地圖片已載入
        await waitForImageReady(img)
      }
    })
    
    await Promise.all(convertPromises)
    console.log('🖼️ 圖片預處理完成')
    
    return originalSrcs
  }

  // 恢復原始圖片 src
  function restoreOriginalImages(originalSrcs) {
    originalSrcs.forEach((originalSrc, img) => {
      img.src = originalSrc
    })
    console.log('🔄 已恢復原始圖片 src')
  }

  // 將圖片轉換為 base64
  async function convertImageToBase64(imageUrl) {
    return new Promise((resolve, reject) => {
      // 使用 Image 方法，設置 crossOrigin
      const img = new Image()
      img.crossOrigin = 'anonymous'
      let timeoutId = null
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          
          ctx.drawImage(img, 0, 0)
          
          const base64 = canvas.toDataURL('image/jpeg', 0.9)
          if (timeoutId) clearTimeout(timeoutId)
          resolve(base64)
        } catch (error) {
          console.warn('Canvas 轉換失敗，嘗試 fetch 方法:', error)
          // 如果 Canvas 方法失敗，嘗試 fetch
          fetchImageAsBase64(imageUrl).then(resolve).catch(reject)
        }
      }
      
      img.onerror = () => {
        console.warn('Image 載入失敗，嘗試 fetch 方法')
        // 如果 Image 方法失敗，嘗試 fetch
        fetchImageAsBase64(imageUrl).then(resolve).catch(reject)
      }
      
      // 設置超時
      timeoutId = setTimeout(() => {
        reject(new Error('圖片載入超時'))
      }, 10000)
      
      img.src = imageUrl
    })
  }

  // 使用 fetch 獲取圖片並轉換為 base64
  async function fetchImageAsBase64(imageUrl) {
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const blob = await response.blob()
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('FileReader 錯誤'))
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      throw new Error(`Fetch 失敗: ${error.message}`)
    }
  }

  // 創建佔位符圖片
  function createPlaceholderImage(width = 300, height = 200) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = width
    canvas.height = height
    
    // 繪製背景
    ctx.fillStyle = '#333333'
    ctx.fillRect(0, 0, width, height)
    
    // 繪製邊框
    ctx.strokeStyle = '#EBD8B2'
    ctx.lineWidth = 3
    ctx.strokeRect(15, 15, width - 30, height - 30)
    
    // 繪製內部背景
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(20, 20, width - 40, height - 40)
    
    // 繪製圖標（簡單的相機圖標）
    const iconSize = Math.min(width, height) * 0.15
    const iconX = width / 2 - iconSize / 2
    const iconY = height / 2 - iconSize / 2 - 10
    
    ctx.strokeStyle = '#EBD8B2'
    ctx.lineWidth = 2
    ctx.strokeRect(iconX, iconY, iconSize, iconSize * 0.7)
    ctx.strokeRect(iconX + iconSize * 0.1, iconY - iconSize * 0.1, iconSize * 0.8, iconSize * 0.2)
    
    // 繪製文字
    ctx.fillStyle = '#EBD8B2'
    ctx.font = `${Math.max(12, width / 20)}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText('AI 生成圖片', width / 2, height / 2 + 20)
    
    return canvas.toDataURL('image/jpeg', 0.9)
  }

  // 截圖功能
  async function captureScreenshot(container, options = {}) {
    if (!container) {
      throw new Error('找不到截圖區域')
    }

    const {
      padding = 40,
      scaleFactor = 0.8,
      backgroundColor = '#333333'
    } = options

    // 預載入並轉換跨域圖片
    const originalSrcs = await preloadAndConvertImages(container)

    try {
      // 使用高解析度配置
      const originalCanvas = await html2canvas(container, {
        backgroundColor,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false
      })

      // 不需要額外邊距或縮放時，直接回傳原圖
      if (padding === 0 && scaleFactor === 1) {
        return originalCanvas
      }

      // 創建高品質 Canvas 並添加邊距，同時縮放圖片
      const newCanvas = document.createElement('canvas')
      const ctx = newCanvas.getContext('2d')

      // 設定新 Canvas 的尺寸（縮放後的尺寸 + 邊距）
      newCanvas.width = (originalCanvas.width * scaleFactor) + (padding * 2)
      newCanvas.height = (originalCanvas.height * scaleFactor) + (padding * 2)

      // 設定高品質渲染
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 填充背景色
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height)
      }

      // 將原始 Canvas 縮放後繪製到新 Canvas 上，留出邊距
      ctx.drawImage(
        originalCanvas,
        padding,
        padding,
        originalCanvas.width * scaleFactor,
        originalCanvas.height * scaleFactor
      )

      return newCanvas
    } finally {
      // 恢復原始圖片 src
      restoreOriginalImages(originalSrcs)
    }
  }

  // 圖片壓縮功能 - 高品質 PNG 輸出
  async function compressImage(canvas) {
    return new Promise((resolve, reject) => {
      // 使用高品質 PNG 格式
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Canvas 轉換為高品質 Blob 成功，大小:', blob.size)
          resolve(blob)
        } else {
          reject(new Error('無法生成圖片 blob'))
        }
      }, 'image/png', 1.0) // PNG 格式，100% 品質
    })
  }

  // 本地測試：下載截圖到本機
  function downloadToLocal(blob, filename = 'screenshot') {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    console.log('📥 截圖已下載到本機')
  }

  function resolveUploadImageUrl() {
    const endpoint = window.endpoint || {}
    const directUrl = endpoint.uploadImageUrl
    if (typeof directUrl === 'string' && directUrl.trim()) {
      return directUrl.trim()
    }

    const uploadPath = endpoint.uploadImagePath
    const baseURL = endpoint.baseURL
    if (typeof uploadPath === 'string' && uploadPath.trim() && typeof baseURL === 'string' && baseURL.trim()) {
      const normalizedBaseURL = baseURL.replace(/\/$/, '')
      const normalizedPath = uploadPath.replace(/^\//, '')
      return `${normalizedBaseURL}/${normalizedPath}`
    }

    return null
  }

  function resolveStatusUrl(taskId) {
    const endpoint = window.endpoint || {}
    if (typeof endpoint.uploadStatusUrl === 'string' && endpoint.uploadStatusUrl.trim()) {
      return endpoint.uploadStatusUrl.replace('{taskId}', taskId)
    }

    const baseURL = typeof endpoint.baseURL === 'string' ? endpoint.baseURL.trim() : ''
    if (!baseURL) return null
    return `${baseURL.replace(/\/$/, '')}/face-swap/status/${taskId}`
  }

  function getAuthHeaders() {
    const headers = {
      'X-Requested-With': 'XMLHttpRequest'
    }
    const authToken = window.endpoint?.authToken
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`
    }
    return headers
  }

  function extractImageUrl(data) {
    return data?.result?.path ||
      data?.result?.url ||
      data?.result?.file_url ||
      data?.path ||
      data?.url ||
      data?.file_url ||
      data?.data?.url ||
      data?.data?.file_url ||
      data?.result?.image_url ||
      data?.result?.result_image ||
      data?.result?.image ||
      data?.image_url ||
      data?.result_image ||
      data?.image ||
      data?.result?.images?.[0] ||
      data?.images?.[0] ||
      null
  }

  async function pollTaskImageUrl(taskId) {
    const statusUrl = resolveStatusUrl(taskId)
    if (!statusUrl) {
      throw new Error('找不到任務狀態 API，無法取得圖片網址')
    }

    const maxAttempts = 20
    const intervalMs = 3000

    for (let i = 0; i < maxAttempts; i += 1) {
      const res = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...getAuthHeaders()
        }
      })

      if (res.ok) {
        const statusData = await res.json().catch(() => ({}))
        const imageUrl = extractImageUrl(statusData)
        if (imageUrl) return imageUrl
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }

    throw new Error('等待圖片生成逾時，請稍後重試')
  }

  // 上傳圖片到伺服器
  async function uploadImage(blob, userId = 'abc', filename = 'screenshot') {
    const uploadImageUrl = resolveUploadImageUrl()
    if (!uploadImageUrl) {
      return null
    }

    const formData = new FormData()
    formData.append('file', blob, `${filename}.png`)
    formData.append('uid', userId)
    formData.append('userId', userId)
    formData.append('userName', userId)
    formData.append('template_id', window.endpoint?.uploadTemplateId || '1')
    
    const response = await fetch(uploadImageUrl, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `上傳失敗: ${response.status}`)
    }
    
    const data = await response.json()
    const imageUrl = extractImageUrl(data)
    if (imageUrl) {
      return imageUrl
    }

    const taskId = data?.result?.task_id || data?.task_id || data?.result?.id || data?.id
    if (taskId) {
      return pollTaskImageUrl(taskId)
    }

    if (!imageUrl) {
      throw new Error('上傳成功，但未取得圖片網址')
    }

    return imageUrl
  }

  // 透過 LIFF 發送圖片
  async function sendViaLiff(imageUrl) {
    // 檢查 LIFF 是否可用
    if (typeof liff === 'undefined') {
      throw new Error('LIFF 不可用，無法發送圖片')
    }
    
    // 檢查是否在 LINE 應用內
    if (!liff.isInClient()) {
      throw new Error('請在 LINE 應用內使用此功能')
    }
    
    // 檢查是否已登入
    if (!liff.isLoggedIn()) {
      throw new Error('請先登入 LINE')
    }
    
    // 發送圖片
    await liff.sendMessages([{
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl: imageUrl
    }]).then(() => {
      //
    })
    .catch((err) => {
      throw new Error(`發送圖片失敗: ${err.message || err.toString()}`)
    });
  }

  // 顯示訊息提示
  function showMessage(message, type = 'info') {
    // 創建提示元素
    const messageEl = document.createElement('div')
    messageEl.className = `fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-md text-white text-sm font-medium transition-all duration-300`
    
    // 根據類型設置樣式
    switch (type) {
      case 'success':
        messageEl.className += ' bg-green-500'
        break
      case 'error':
        messageEl.className += ' bg-red-500'
        break
      case 'info':
      default:
        messageEl.className += ' bg-blue-500'
        break
    }
    
    messageEl.textContent = message
    document.body.appendChild(messageEl)
    
    // 3秒後移除提示
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl)
      }
    }, 3000)
  }

  return {
    captureScreenshot,
    compressImage,
    downloadToLocal,
    uploadImage,
    sendViaLiff,
    showMessage
  }
}
