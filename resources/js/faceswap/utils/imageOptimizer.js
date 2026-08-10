function getOutputName(file, mimeType) {
  const extension = mimeType === 'image/png' ? 'png' : 'jpg'
  const baseName = file.name?.replace(/\.[^.]+$/, '') || 'upload'
  return `${baseName}.${extension}`
}

function getCanvasSize(width, height, options) {
  const isLandscape = width > height
  const maxWidth = isLandscape
    ? options.landscapeMaxWidth || 960
    : options.portraitMaxWidth || 720
  const maxHeight = isLandscape
    ? options.landscapeMaxHeight || 720
    : options.portraitMaxHeight || 960

  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  const scale = Math.min(maxWidth / width, maxHeight / height)
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale)
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('圖片讀取失敗'))
    }

    image.src = url
  })
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('圖片壓縮失敗'))
      }
    }, mimeType, quality)
  })
}

export async function optimizeImageFile(file, options = {}) {
  const outputMimeType = options.outputMimeType || 'image/jpeg'
  const quality = options.quality ?? 0.85

  try {
    const image = await loadImage(file)
    const { width, height } = getCanvasSize(image.naturalWidth || image.width, image.naturalHeight || image.height, options)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = width
    canvas.height = height

    if (outputMimeType === 'image/jpeg') {
      context.fillStyle = '#fff'
      context.fillRect(0, 0, width, height)
    }

    context.drawImage(image, 0, 0, width, height)

    const blob = await canvasToBlob(canvas, outputMimeType, quality)
    const optimizedFile = new File([blob], getOutputName(file, outputMimeType), {
      type: outputMimeType,
      lastModified: file.lastModified || Date.now()
    })

    return optimizedFile.size < file.size || file.type !== outputMimeType ? optimizedFile : file
  } catch (error) {
    console.warn('圖片縮圖失敗，改用原始檔案', error)
    return file
  }
}
