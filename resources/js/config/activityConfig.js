export const gmatamConfig = {
  activityKey: 'GMATAM',
  activityName: '我與我同臺',
  awardName: '傳藝金曲獎',
  maxUsageLimit: 5,
  genderOptions: [
    {
      key: 'male',
      label: '男生',
      templateId: 12,
      outfit: '西裝'
    },
    {
      key: 'female',
      label: '女生',
      templateId: 13,
      outfit: '禮服'
    }
  ],
  upload: {
    maxFileSizeMb: 10,
    acceptedMimeTypes: ['image/jpeg', 'image/png'],
    acceptedExtensions: ['.jpg', '.jpeg', '.png']
  },
  copy: {
    heroTitle: '我與我同臺',
    heroSubtitle: '讓兩個時空的自己，共同站上人生舞臺。',
    uploadNotice: [
      '請上傳單人清晰正面照，避免多人合照，以利準確辨識',
      '僅支援人像照片，請勿上傳風景、動物或其他非人物圖片',
      '請確保臉部五官完整可見，避免口罩、手部、頭髮等遮擋',
      '避免模糊、晃動或低解析度圖片，以免影響生成品質'
    ]
  },
  api: {
    faceSwapPath: '/face-swap'
  }
}

export function getGenderOption(genderKey) {
  return gmatamConfig.genderOptions.find(option => option.key === genderKey) || null
}

export function isLocalLimitBypassEnabled() {
  if (typeof window === 'undefined') return false

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  return Boolean(isLocalhost && window.endpoint?.debug)
}
