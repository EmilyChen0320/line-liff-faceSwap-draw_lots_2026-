function resolveBaseURL() {
  if (typeof window !== 'undefined' && window.endpoint && window.endpoint.baseURL) {
    return window.endpoint.baseURL
  }
  return 'https://line.uat.sport115ntp.aitago.tw/api'
}

function resolveUploadImageUrl() {
  if (typeof window !== 'undefined' && window.endpoint) {
    const directUrl = window.endpoint.uploadImageUrl
    if (typeof directUrl === 'string' && directUrl.trim()) {
      return directUrl.trim()
    }

    const uploadPath = window.endpoint.uploadImagePath
    if (typeof uploadPath === 'string' && uploadPath.trim()) {
      const baseURL = resolveBaseURL().replace(/\/$/, '')
      return `${baseURL}/${uploadPath.replace(/^\//, '')}`
    }
  }

  return null
}

async function fetchAsBlobUrl(url) {
  // If it's already a blob url, just use it
  if (typeof url === 'string' && url.startsWith('blob:')) {
    return { blobUrl: url, revoke: false }
  }

  const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) {
    throw new Error(`Fetch image failed: HTTP ${res.status}`)
  }
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  return { blobUrl, revoke: true }
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

/**
 * Compose an image with a logo in the top-right corner.
 * - baseImageUrl: remote URL or blob URL
 * - logoUrl: same-origin URL (e.g. Vite asset import)
 * Returns: PNG Blob
 */
export async function composeImageWithLogo({
  baseImageUrl,
  logoUrl,
  marginPx = 20,
  logoWidthRatio = 0.15
}) {
  const base = await fetchAsBlobUrl(baseImageUrl)
  try {
    const [baseImg, logoImg] = await Promise.all([loadImage(base.blobUrl), loadImage(logoUrl)])

    const canvas = document.createElement('canvas')
    canvas.width = baseImg.naturalWidth || baseImg.width
    canvas.height = baseImg.naturalHeight || baseImg.height
    const ctx = canvas.getContext('2d')

    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height)

    // Logo sizing: 15% of image width (default), keep aspect ratio
    const logoW = Math.max(1, Math.round(canvas.width * logoWidthRatio))
    const ratio = (logoImg.naturalHeight || logoImg.height) / (logoImg.naturalWidth || logoImg.width || 1)
    const logoH = Math.max(1, Math.round(logoW * ratio))

    const x = canvas.width - marginPx - logoW
    const y = marginPx

    ctx.drawImage(logoImg, x, y, logoW, logoH)

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))), 'image/png', 1.0)
    })

    return blob
  } finally {
    if (base.revoke) {
      URL.revokeObjectURL(base.blobUrl)
    }
  }
}

export async function uploadPngBlob({ blob, userId = 'abc', filename = 'image-with-logo' }) {
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

  const headers = {
    'X-Requested-With': 'XMLHttpRequest'
  }
  const authToken = window.endpoint?.authToken
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const res = await fetch(uploadImageUrl, {
    method: 'POST',
    headers,
    body: formData
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.message || `Upload failed: HTTP ${res.status}`)
  }

  const data = await res.json()
  const imageUrl = data?.result?.path ||
    data?.result?.url ||
    data?.result?.file_url ||
    data?.path ||
    data?.url ||
    data?.file_url ||
    data?.data?.url ||
    data?.data?.file_url
  if (!imageUrl) {
    throw new Error('Upload succeeded but no image URL returned')
  }

  return imageUrl
}

