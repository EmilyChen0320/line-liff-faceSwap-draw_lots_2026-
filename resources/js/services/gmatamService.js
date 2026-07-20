import { gmatamConfig } from '@/config/activityConfig'

function getRuntimeConfig() {
  return window.endpoint?.gmatam || {}
}

function trimSlash(value = '') {
  return value.replace(/\/+$/, '')
}

function resolveAliBaseURL() {
  return trimSlash(getRuntimeConfig().aliBaseURL || gmatamConfig.api.aliBaseURL)
}

function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl
  return `${resolveAliBaseURL()}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

function getLocalHistoryKey(userId) {
  return `${gmatamConfig.activityKey}:history:${userId || 'anonymous'}`
}

function appendQuery(url, params) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const queryString = query.toString()
  if (!queryString) return url
  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`
}

function readLocalHistory(userId) {
  try {
    return JSON.parse(localStorage.getItem(getLocalHistoryKey(userId)) || '[]')
  } catch {
    return []
  }
}

function writeLocalHistory(userId, history) {
  localStorage.setItem(getLocalHistoryKey(userId), JSON.stringify(history))
}

function normalizeGeneration(record) {
  const result = record?.result || record || {}
  const output = result.outputs?.[0] || result.images?.[0] || null
  const outputUrl = typeof output === 'string'
    ? output
    : output?.url || output?.thumb_url || output?.image_url || output?.result_image || ''
  const imageUrl = result.image ||
    result.result_image_url ||
    result.image_url ||
    result.result_image ||
    result.generated_image ||
    result.output_url ||
    result.url ||
    outputUrl

  return {
    id: result.id || result.generation_id || result.task_id,
    generation_id: result.id || result.generation_id || result.task_id,
    request_id: result.request_id || '',
    status: result.status || 'pending',
    image: resolveUrl(imageUrl),
    rawImage: imageUrl || '',
    created_at: result.created_at || result.generated_at || new Date().toISOString(),
    duration_ms: result.duration_ms || null,
    error_message: result.error_message || result.message || '',
    template_id: result.template_id || result.templateId || null,
    original: result
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {})
    }
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

export const gmatamService = {
  async getUsage(userId) {
    const config = getRuntimeConfig()

    if (config.usageEndpoint) {
      const url = config.usageEndpoint.replace(':userId', encodeURIComponent(userId))
      const data = await requestJson(url)
      return Number(data.count ?? data.usage ?? data.result?.count ?? 0)
    }

    const history = await this.getUserHistory(userId)
    return history.filter(item => item.status === 'completed' && item.image).length
  },

  async getUserHistory(userId) {
    const config = getRuntimeConfig()
    const endpoint = config.historyEndpoint
      ? config.historyEndpoint.replace(':userId', encodeURIComponent(userId))
      : `${resolveAliBaseURL()}${gmatamConfig.api.historyEndpoint}`

    if (endpoint) {
      try {
        const url = appendQuery(endpoint, {
          limit: config.historyLimit || 50,
          user_id: config.historyEndpoint?.includes(':userId') ? '' : userId
        })
        const data = await requestJson(url)
        const records = Array.isArray(data)
          ? data
          : data.result?.avatars ||
            data.result?.history ||
            data.result?.items ||
            data.data?.history ||
            data.data?.items ||
            data.items ||
            data.history ||
            []
        const normalizedRecords = records.map(normalizeGeneration)

        if (normalizedRecords.length > 0) {
          return normalizedRecords
        }
      } catch (error) {
        console.warn('讀取後端歷史失敗，改用本機歷史', error)
      }
    }

    return readLocalHistory(userId).map(normalizeGeneration)
  },

  async generateComposite({ userId, userName, gender, templateId, pastPhoto, currentPhoto }) {
    const config = getRuntimeConfig()
    const endpoint = config.generateEndpoint
      ? config.generateEndpoint.replace(':templateId', templateId)
      : `${resolveAliBaseURL()}${gmatamConfig.api.templateGenerateEndpoint.replace(':templateId', templateId)}`

    const formData = new FormData()
    formData.append('user_id', userId)
    formData.append('userId', userId)
    formData.append('userName', userName || userId)
    formData.append('gender', gender)
    formData.append('template_id', String(templateId))
    formData.append('images', pastPhoto, pastPhoto.name || 'past-photo.jpg')
    formData.append('images', currentPhoto, currentPhoto.name || 'current-photo.jpg')

    if (window.endpoint?.debug) {
      console.log('GMATAM 生成送出檔案順序:', [
        {
          field: 'images[0]',
          role: 'past',
          name: pastPhoto?.name,
          size: pastPhoto?.size,
          type: pastPhoto?.type,
          lastModified: pastPhoto?.lastModified
        },
        {
          field: 'images[1]',
          role: 'current',
          name: currentPhoto?.name,
          size: currentPhoto?.size,
          type: currentPhoto?.type,
          lastModified: currentPhoto?.lastModified
        }
      ])
    }

    const data = await requestJson(endpoint, {
      method: 'POST',
      body: formData
    })

    return normalizeGeneration({
      ...(data.result || data),
      template_id: templateId
    })
  },

  async pollGeneration(generationId) {
    const config = getRuntimeConfig()
    const endpoint = config.pollEndpoint
      ? config.pollEndpoint.replace(':generationId', encodeURIComponent(generationId))
      : `${resolveAliBaseURL()}${gmatamConfig.api.historyEndpoint}/${encodeURIComponent(generationId)}`

    const data = await requestJson(endpoint)
    return normalizeGeneration(data)
  },

  async saveCompletedHistory(userId, record) {
    if (!userId || !record?.image || record.status !== 'completed') return

    const history = readLocalHistory(userId)
    const normalized = normalizeGeneration(record)
    const exists = history.some(item => String(item.id) === String(normalized.id))
    if (!exists) {
      writeLocalHistory(userId, [normalized, ...history])
    }
  }
}
