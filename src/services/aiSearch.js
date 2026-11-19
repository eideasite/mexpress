import { ref, watch } from 'vue'
import { notifyAppError } from './errorNotifications.js'

const AI_SEARCH_QUERY_KEY = 'jeyamohan-ai-search-query-v1'

function loadSavedAiSearchQuery() {
  try {
    return localStorage.getItem(AI_SEARCH_QUERY_KEY) || ''
  } catch {
    return ''
  }
}

export const aiSearchQuery = ref(loadSavedAiSearchQuery())
let aiSearchDraftSaveErrorNotified = false

watch(aiSearchQuery, (query) => {
  try {
    if (query) localStorage.setItem(AI_SEARCH_QUERY_KEY, query)
    else localStorage.removeItem(AI_SEARCH_QUERY_KEY)
    aiSearchDraftSaveErrorNotified = false
  } catch {
    if (!aiSearchDraftSaveErrorNotified) {
      notifyAppError('Could not save your AI search draft in this browser.')
      aiSearchDraftSaveErrorNotified = true
    }
  }
}, { flush: 'sync' })

export const AI_PROVIDERS = [
  { name: 'Google Gemini', url: 'https://gemini.google.com/' },
  { name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { name: 'Meta AI', url: 'https://www.meta.ai/' },
]

export function buildGoogleAiModeUrl(query) {
  const url = new URL('https://www.google.com/search')
  url.searchParams.set('udm', '50')
  url.searchParams.set('q', query.trim())
  return url.toString()
}

export function openGoogleAiModeSearch(query) {
  if (typeof query !== 'string' || !query.trim()) return false
  const tab = window.open(buildGoogleAiModeUrl(query), '_blank')
  if (!tab) return false
  try {
    tab.opener = null
  } catch {
    // The tab has already opened; opener isolation is a best-effort safeguard.
  }
  return true
}

export async function openAiProviderTabs(text, providers = AI_PROVIDERS, image = null) {
  if (!text.trim() || !providers.length) return

  const tabs = []
  for (const provider of providers) {
    try {
      const providerUrl = new URL(provider.url)
      const handoff = JSON.stringify({ version: 1, prompt: text, image })
      providerUrl.hash = new URLSearchParams({ jeyamohan_payload: handoff }).toString()
      const tab = window.open(providerUrl.toString(), '_blank')
      if (tab) {
        tab.opener = null
        tabs.push(tab)
      }
    } catch {
      // Continue opening the other providers if one popup fails.
    }
  }

  if (!tabs.length) throw new Error('No AI tabs opened.')

  let copied = false
  let timeoutId
  try {
    if (navigator.clipboard?.writeText) {
      copied = await Promise.race([
        navigator.clipboard.writeText(text).then(() => true, () => false),
        new Promise((resolve) => {
          timeoutId = window.setTimeout(() => resolve(false), 2000)
        }),
      ])
    }
  } catch {
    copied = false
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }

  return { opened: tabs.length, total: providers.length, copied, imageIncluded: Boolean(image) }
}
