<script setup>
/* eslint-disable vue/no-v-html -- Rich article content is sanitized before rendering. */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Archive,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  FilePlus2,
  Maximize2,
  Minimize2,
  MoreVertical,
  House,
  ImagePlus,
  Mic,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Send,
  Smile,
  Sparkles,
  Trash2,
  Undo2,
  Redo2,
  X,
} from 'lucide-vue-next'
import { useWorkspace } from '../stores/workspace.js'
import { articleCanPublish } from '../utils/validation.js'
import { createId } from '../utils/createId.js'
import { createArticleHighlight, createHighlightCollection } from '../services/highlightStorage.js'
import { loadPostDraft, savePostDraft } from '../services/postStorage.js'
import { estimateBrowserStorage } from '../services/browserStorage.js'
import { formatDate } from '../utils/formatDate.js'
import { getArticleExcerpt, getArticleTitle, getWordCount } from '../utils/article.js'
import { richTextToHtml, richTextToPlainText, sanitizeRichTextHtml } from '../utils/richText.js'
import { publishLocally, scheduleLocally } from '../services/publishingService.js'
import { makeSafeFilename } from '../utils/article.js'
import { translate } from '../i18n.js'
import HomeHighlightsSection from '../components/home/HomeHighlightsSection.vue'
import LoadingDots from '../components/common/LoadingDots.vue'
import AiProviderPicker from '../components/common/AiProviderPicker.vue'
import ReadAloudControls from '../components/common/ReadAloudControls.vue'
import ProfileAvatar from '../components/common/ProfileAvatar.vue'
import { AI_PROVIDERS, openAiProviderTabs } from '../services/aiSearch.js'

const route = useRoute()
const router = useRouter()
const {
  workspace,
  posts,
  highlights,
  bookmarkedIds,
  shortcutIds,
  language,
  theme,
  updateArticle,
  createNewArticle,
  discardArticle,
  createPost,
  updatePost: persistPostChanges,
  toggleBookmark,
  toggleShortcut,
  saveHighlightCollections,
  setSessionStatus,
} = useWorkspace()

const postDraftStorageError = ref(false)
let initialPostDraft = ''
try {
  initialPostDraft = loadPostDraft()
} catch {
  postDraftStorageError.value = true
}
const postText = ref(initialPostDraft)
watch(postText, (text) => {
  postDraftStorageError.value = !savePostDraft(text)
}, { flush: 'sync' })
const postImage = ref(null)
const editingPost = ref(null)
const postEditText = ref('')
const postEditImage = ref(null)
const activePostText = computed(() => editingPost.value ? postEditText.value : postText.value)
const activePostImage = computed(() => editingPost.value ? postEditImage.value : postImage.value)
const postMenuId = ref('')
const postSaving = ref(false)
const postDialogOpen = ref(false)
const postTextArea = ref(null)
const emojiPickerOpen = ref(false)
const imageInput = ref(null)
const recognition = ref(null)
const dictating = ref(false)
const editorElement = ref(null)
const bodyUndoStack = ref([])
const bodyRedoStack = ref([])
let lastEditorBody = ''
const articleFilter = ref('all')
const dialog = ref(null)
const scheduledAt = ref('')
const showAllPosts = ref(false)
const highlightText = ref('')
const selectedCollectionId = ref('')
const highlightManagerView = ref('closed')
const highlightDraft = ref(null)
const highlightPreview = ref(null)
const highlightImageInput = ref(null)
const highlightPhotosLoading = ref(false)
const profileForm = ref({ ...workspace.value.profile })
watch(profileForm, (profile) => {
  const currentProfile = workspace.value.profile
  if (profile.name === currentProfile.name
    && profile.bio === currentProfile.bio
    && profile.avatar === currentProfile.avatar) return
  workspace.value.profile = { ...profile }
}, { deep: true, flush: 'sync' })
const externalAiPrompt = ref('')
const externalAiImage = ref(null)
const externalAiImageHelperEnabled = ref(false)
const externalAiImageError = ref('')
const externalAiPromptSearching = ref(false)
const externalAiPromptStorageError = ref(false)
const externalAiProviderPickerOpen = ref(false)
const externalAiPendingPrompt = ref('')
const mobileViewportQuery = window.matchMedia('(max-width: 700px)')
const mobileViewport = ref(mobileViewportQuery.matches)
const oneHandPreferencesStorageKey = 'jeyamohan-one-hand-editor-v1'
const initialOneHandPreferences = loadOneHandPreferences()
const oneHandMode = ref(initialOneHandPreferences.enabled)
const oneHandSide = ref(initialOneHandPreferences.side)
const visualKeyboardInset = ref(0)
const oneHandStyle = computed(() => ({ '--keyboard-inset': `${visualKeyboardInset.value}px` }))
const avatarOptions = ['✍️', '🙂', '😊', '🌿', '📚', '✨', '🖋️']
const fontFamilyOptions = [
  { value: 'inter', label: 'Inter', css: "'Inter', 'Noto Sans Tamil', 'Latha', 'Nirmala UI', system-ui, sans-serif" },
  { value: 'times-new-roman', label: 'Times New Roman', css: "'Times New Roman', 'Noto Sans Tamil', 'Latha', 'Nirmala UI', serif" },
  { value: 'arial', label: 'Arial', css: "Arial, 'Noto Sans Tamil', 'Latha', 'Nirmala UI', sans-serif" },
  { value: 'open-sans', label: 'Open Sans', css: "'Open Sans', 'Noto Sans Tamil', 'Latha', 'Nirmala UI', sans-serif" },
]
const displayZoomOptions = [
  { value: 'auto', label: 'Auto (100%)', scale: 1 },
  { value: '50%', label: '50%', scale: 0.5 },
  { value: '75%', label: '75%', scale: 0.75 },
  { value: '100%', label: '100%', scale: 1 },
  { value: '125%', label: '125%', scale: 1.25 },
  { value: '150%', label: '150%', scale: 1.5 },
  { value: '200%', label: '200%', scale: 2 },
]
function getDisplayZoomOption(value) {
  return displayZoomOptions.find((option) => option.value === value) || displayZoomOptions[0]
}
function getFontFamilyOption(value) {
  return fontFamilyOptions.find((option) => option.value === value) || fontFamilyOptions[0]
}
const accessibility = ref({
  displayZoom: 'auto',
  fontScale: 1,
  fontFamily: 'inter',
  boldText: false,
  outlineText: false,
  highContrast: false,
  reduceBlur: false,
  reduceMotion: false,
  removeAnimations: false,
  colorFilter: 'none',
})
const message = ref('')
const messageTone = ref('success')
const messageTimer = ref()
const reviewChecksStorageKey = 'jeyamohan-article-review-checks-v1'
const reviewItems = [
  { key: 'title', label: 'The title clearly describes the article.' },
  { key: 'facts', label: 'Names, facts, and links have been checked.' },
  { key: 'proofread', label: 'I have read the article once before publishing.' },
]
const reviewChecksByArticle = ref(loadReviewChecks())
const externalAiPromptStorageKey = 'jeyamohan-external-ai-prompt-v1'
const externalAiProviders = AI_PROVIDERS
const postEmojis = ['🙂', '😊', '❤️', '😂', '🙏', '✨']

try {
  const savedAccessibility = JSON.parse(localStorage.getItem('jeyamohan-accessibility-settings-v1') || 'null')
  if (savedAccessibility && typeof savedAccessibility === 'object') {
    accessibility.value = {
      displayZoom: getDisplayZoomOption(savedAccessibility.displayZoom).value,
      fontScale: Number.isFinite(savedAccessibility.fontScale) ? Math.min(1.3, Math.max(0.9, savedAccessibility.fontScale)) : 1,
      fontFamily: getFontFamilyOption(savedAccessibility.fontFamily).value,
      boldText: savedAccessibility.boldText === true,
      outlineText: savedAccessibility.outlineText === true,
      highContrast: savedAccessibility.highContrast === true,
      reduceBlur: savedAccessibility.reduceBlur === true,
      reduceMotion: savedAccessibility.reduceMotion === true,
      removeAnimations: savedAccessibility.removeAnimations === true,
      colorFilter: ['none', 'invert', 'grayscale', 'low-saturation'].includes(savedAccessibility.colorFilter)
        ? savedAccessibility.colorFilter
        : 'none',
    }
  }
} catch {
  accessibility.value = {
    displayZoom: 'auto',
    fontScale: 1,
    fontFamily: 'inter',
    boldText: false,
    outlineText: false,
    highContrast: false,
    reduceBlur: false,
    reduceMotion: false,
    removeAnimations: false,
    colorFilter: 'none',
  }
}

const page = computed(() => String(route.name || 'not-found'))
const FOCUS_MODE_STORAGE_KEY = 'jeyamohan-focus-mode-v1'
const focusMode = ref(false)
try {
  focusMode.value = localStorage.getItem(FOCUS_MODE_STORAGE_KEY) === 'enabled'
} catch {
  focusMode.value = false
}
const currentArticle = computed(() => {
  const requestedId = typeof route.query.article === 'string' ? route.query.article : ''
  return workspace.value.articles.find((article) => article.id === requestedId)
    || workspace.value.articles[0]
    || null
})
const completedReviewCount = computed(() => {
  const checks = reviewChecksByArticle.value[currentArticle.value?.id] || {}
  return reviewItems.filter((item) => checks[item.key]).length
})

function loadReviewChecks() {
  try {
    const saved = JSON.parse(localStorage.getItem(reviewChecksStorageKey) || '{}')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {}
    return Object.fromEntries(Object.entries(saved).map(([articleId, checks]) => [
      articleId,
      Object.fromEntries(reviewItems.map((item) => [item.key, checks?.[item.key] === true])),
    ]))
  } catch {
    return {}
  }
}

function loadOneHandPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(oneHandPreferencesStorageKey) || 'null')
    return {
      enabled: saved?.enabled === true,
      side: saved?.side === 'left' ? 'left' : 'right',
    }
  } catch {
    return { enabled: false, side: 'right' }
  }
}

watch(reviewChecksByArticle, (checks) => {
  try {
    localStorage.setItem(reviewChecksStorageKey, JSON.stringify(checks))
  } catch {
    // Keep checklist interaction available for this session if storage is unavailable.
  }
}, { deep: true, flush: 'sync' })

watch([oneHandMode, oneHandSide], ([enabled, side]) => {
  try {
    localStorage.setItem(oneHandPreferencesStorageKey, JSON.stringify({ enabled, side }))
  } catch {
    // The editor remains usable if the preference cannot be stored.
  }
}, { flush: 'sync' })

function setReviewCheck(key, checked) {
  if (!currentArticle.value) return
  const articleId = currentArticle.value.id
  reviewChecksByArticle.value = {
    ...reviewChecksByArticle.value,
    [articleId]: {
      ...reviewChecksByArticle.value[articleId],
      [key]: checked,
    },
  }
}
const readAloudText = computed(() => {
  if (!currentArticle.value) return ''
  return `${getArticleTitle(currentArticle.value)}\n\n${richTextToPlainText(currentArticle.value.body || '')}`.trim()
})
const activeArticles = computed(() => workspace.value.articles.filter((article) => !article.archived))
const archivedArticles = computed(() => workspace.value.articles.filter((article) => article.archived))
const sortedPosts = computed(() => [...posts.value].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)))
const numberedPosts = computed(() => {
  const counts = new Map()
  return [...sortedPosts.value].reverse().map((post) => {
    const date = new Date(post.createdAt)
    const day = Number.isNaN(date.getTime()) ? `invalid-${post.id}` : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    const postNumber = (counts.get(day) || 0) + 1
    counts.set(day, postNumber)
    return { post, postNumber }
  }).reverse()
})
const visiblePosts = computed(() => showAllPosts.value ? numberedPosts.value : numberedPosts.value.slice(0, 3))
const shortcutArticles = computed(() => shortcutIds.value
  .map((id) => workspace.value.articles.find((article) => article.id === id))
  .filter((article) => article && !article.archived))
const visibleArticles = computed(() => {
  const source = page.value === 'archive' ? archivedArticles.value : activeArticles.value
  const saved = page.value === 'bookmarks' ? source.filter((article) => bookmarkedIds.value.includes(article.id)) : source
  if (page.value !== 'articles' || articleFilter.value === 'all') return saved
  return saved.filter((article) => article.status === articleFilter.value)
})
const articleBodyText = computed(() => getArticleExcerpt(currentArticle.value?.body || '', 240))
const wordCount = computed(() => getWordCount(currentArticle.value?.body || ''))
const dateLocale = computed(() => language.value === 'ta' ? 'ta-IN' : 'en-GB')
const t = (text) => translate(text, language.value)
const readAloudLabels = computed(() => ({
  readAloud: t('Read aloud'),
  play: t('Play'),
  pause: t('Pause'),
  resume: t('Resume'),
  stop: t('Stop'),
  voice: t('Preferred voice'),
  systemVoice: t('Use system voice'),
  speed: t('Speech rate'),
  progress: t('Reading progress'),
  speaking: t('Speaking...'),
  paused: t('Paused'),
  finished: t('Finished reading.'),
  unsupported: t('Text-to-speech is not supported by this browser.'),
  failed: t('Read aloud could not continue. Try another voice or restart playback.'),
}))
const profileName = computed(() => workspace.value.profile.name || 'Jeyamohan')
const browserStorageEstimate = ref({ status: 'idle', usage: 0, quota: 0 })
const browserStorageUsageRatio = computed(() => browserStorageEstimate.value.quota
  ? Math.min(1, browserStorageEstimate.value.usage / browserStorageEstimate.value.quota)
  : 0)
const composerPlaceholder = computed(() => t("What's on your mind, {name}?").replace('{name}', profileName.value))
const formattedBody = computed(() => richTextToHtml(currentArticle.value?.body || ''))
const selectedArticle = computed(() => workspace.value.articles.find((article) => article.id === dialog.value?.articleId) || currentArticle.value)
const highlightedCollection = computed(() => highlights.value.find((item) => item.id === selectedCollectionId.value))

function formatStorageSize(bytes) {
  const megabytes = bytes / (1024 * 1024)
  return megabytes >= 1024 ? `${(megabytes / 1024).toFixed(2)} GB` : `${megabytes.toFixed(0)} MB`
}

async function refreshBrowserStorageEstimate() {
  browserStorageEstimate.value = { ...browserStorageEstimate.value, status: 'loading' }
  try {
    const estimate = await estimateBrowserStorage()
    browserStorageEstimate.value = { status: 'ready', ...estimate }
  } catch {
    browserStorageEstimate.value = { status: 'unavailable', usage: 0, quota: 0 }
  }
}

watch(accessibility, (settings) => {
  document.documentElement.style.setProperty('--app-font-scale', String(settings.fontScale))
  document.documentElement.style.setProperty('--app-display-scale', String(getDisplayZoomOption(settings.displayZoom).scale))
  document.documentElement.style.setProperty('--app-font-family', getFontFamilyOption(settings.fontFamily).css)
  document.documentElement.classList.toggle('accessibility-bold', settings.boldText)
  document.documentElement.classList.toggle('accessibility-outline', settings.outlineText)
  document.documentElement.classList.toggle('accessibility-high-contrast', settings.highContrast)
  document.documentElement.classList.toggle('accessibility-reduce-blur', settings.reduceBlur)
  document.documentElement.classList.toggle('accessibility-reduce-motion', settings.reduceMotion)
  document.documentElement.classList.toggle('accessibility-no-animations', settings.removeAnimations)
  document.documentElement.classList.toggle('accessibility-filter-invert', settings.colorFilter === 'invert')
  document.documentElement.classList.toggle('accessibility-filter-grayscale', settings.colorFilter === 'grayscale')
  document.documentElement.classList.toggle('accessibility-filter-low-saturation', settings.colorFilter === 'low-saturation')
  try {
    localStorage.setItem('jeyamohan-accessibility-settings-v1', JSON.stringify(settings))
  } catch {
    showMessage('Accessibility settings could not be saved in this browser.', 'error')
  }
}, { deep: true, immediate: true })

function showMessage(text, tone = 'success') {
  messageTone.value = tone
  const icon = tone === 'error' ? '❌' : tone === 'warning' ? '⚠️' : '✅'
  message.value = `${icon} ${text}`
  window.clearTimeout(messageTimer.value)
  messageTimer.value = window.setTimeout(() => { message.value = '' }, 3500)
}

function updateFocusModePageClass() {
  document.documentElement.classList.toggle(
    'writing-focus-mode',
    page.value === 'editor' && focusMode.value,
  )
}

watch(focusMode, (enabled) => {
  try {
    localStorage.setItem(FOCUS_MODE_STORAGE_KEY, enabled ? 'enabled' : 'disabled')
  } catch {
    showMessage(t('Focus mode preference could not be saved in this browser.'), 'error')
  }
  updateFocusModePageClass()
}, { flush: 'sync' })

watch(page, (currentPage) => {
  if (currentPage === 'profile') refreshBrowserStorageEstimate()
  updateFocusModePageClass()
}, { immediate: true })

function updateMobileViewport() {
  mobileViewport.value = mobileViewportQuery.matches
  updateVisualKeyboardInset()
}

function updateVisualKeyboardInset() {
  const viewport = window.visualViewport
  if (!oneHandMode.value || !viewport) {
    visualKeyboardInset.value = 0
    return
  }
  // Browsers resize different viewports for the on-screen keyboard. Use the
  // visual viewport when available; don't infer keyboard height from innerHeight.
  const inset = window.innerHeight - viewport.height - viewport.offsetTop
  visualKeyboardInset.value = inset > 120 ? Math.round(inset) : 0
}

watch(oneHandMode, updateVisualKeyboardInset, { flush: 'post' })

try {
  externalAiPrompt.value = localStorage.getItem(externalAiPromptStorageKey) || ''
} catch {
  externalAiPromptStorageError.value = true
}

watch(externalAiPrompt, (prompt) => {
  try {
    localStorage.setItem(externalAiPromptStorageKey, prompt)
    externalAiPromptStorageError.value = false
  } catch {
    externalAiPromptStorageError.value = true
  }
}, { flush: 'sync' })

function handleExternalAiPromptKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || !externalAiPrompt.value.trim()) return
  event.preventDefault()
  openPromptInAllAiTools()
}

async function handleExternalAiImage(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  externalAiImageError.value = ''
  externalAiImage.value = null
  if (!file) return
  if (!file.type.startsWith('image/')) {
    externalAiImageError.value = 'Choose an image file.'
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    externalAiImageError.value = 'Choose an image smaller than 10 MB.'
    return
  }
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72))
    if (!blob) throw new Error('Could not prepare this image.')
    if (blob.size > 700 * 1024) {
      externalAiImageError.value = 'This image is too large to hand off safely. Choose a smaller image.'
      return
    }
    externalAiImage.value = {
      name: file.name,
      type: 'image/jpeg',
      dataUrl: await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      }),
    }
  } catch {
    externalAiImageError.value = 'Could not prepare this image. Try another image file.'
  }
}

async function openPromptInAllAiTools() {
  if (externalAiPromptSearching.value) return
  const prompt = externalAiPrompt.value
  if (!prompt.trim()) {
    showMessage(t('Enter a prompt to continue.'), 'warning')
    return
  }

  if (window.matchMedia('(max-width: 700px)').matches) {
    externalAiPendingPrompt.value = prompt
    externalAiProviderPickerOpen.value = true
    return
  }

  openPromptWithProviders(prompt)
}

function openPromptWithProvider(provider) {
  const prompt = externalAiPendingPrompt.value
  externalAiProviderPickerOpen.value = false
  externalAiPendingPrompt.value = ''
  openPromptWithProviders(prompt, [provider])
}

async function openPromptWithProviders(prompt, providers = AI_PROVIDERS) {
  externalAiPromptSearching.value = true
  try {
    const handoffImage = externalAiImageHelperEnabled.value ? externalAiImage.value : null
    const result = await openAiProviderTabs(prompt, providers, handoffImage)
    if (result?.imageIncluded) {
      showMessage('Prompt and image handed to the browser helper. If the provider page cannot attach it, upload it manually. The image stays selected here.')
      return
    }
    if (externalAiImage.value) {
      showMessage('Prompt opened and copied. The image stays in this app; attach it manually in the AI tab.')
      return
    }
    if (!result?.copied) {
      showMessage(t('Opened {opened} of {total} AI tabs, but clipboard copy failed. The helper may still send it; the prompt remains here for manual paste.')
        .replace('{opened}', String(result?.opened || 0))
        .replace('{total}', String(result?.total || providers.length)), 'warning')
    } else if (result.opened < result.total) {
      showMessage(t('Opened {opened} of {total} AI tabs. The browser helper sends the prompt automatically; otherwise paste the copied prompt into each open tab.')
        .replace('{opened}', String(result.opened))
        .replace('{total}', String(result.total)), 'warning')
    } else {
      showMessage(providers.length === 1
        ? t('Opened {provider} and copied your prompt. The browser helper sends it automatically; without the helper, paste it there.')
          .replace('{provider}', providers[0].name)
        : t('Opened all 3 AI tabs and copied your prompt. The browser helper sends it automatically; without the helper, paste it in each tab.'))
    }
  } catch {
    showMessage(providers.length === 1
      ? t('Could not open the AI or copy your prompt. Allow pop-ups and clipboard access, then try again.')
      : t('Could not open all 3 AI tabs or copy your text. Allow pop-ups and clipboard access, then try again.'), 'error')
  } finally {
    externalAiPromptSearching.value = false
  }
}

function copyTextToClipboard(text) {
  try {
    if (!navigator.clipboard?.writeText) return Promise.reject(new Error('Clipboard access is unavailable.'))
    return navigator.clipboard.writeText(text)
  } catch (error) {
    return Promise.reject(error)
  }
}

async function copyPost(post) {
  if (!post.text) {
    showMessage(t('This post has no text to copy.'), 'warning')
    return
  }
  try {
    await copyTextToClipboard(post.text)
    showMessage(t('Post copied. Paste it wherever you need.'))
  } catch {
    showMessage(t('Could not copy the post. Select and copy the text instead.'), 'error')
  }
}

function copyExternalAiPrompt() {
  const prompt = externalAiPrompt.value
  if (!prompt.trim()) {
    showMessage('Enter a prompt to continue.', 'warning')
    return
  }
  copyTextToClipboard(prompt)
    .then(() => showMessage(externalAiImage.value
      ? 'Prompt copied. The image is not included in clipboard; keep it here to use with the AI service.'
      : 'Prompt copied. Paste it into an AI service when you are ready.'))
    .catch(() => showMessage('Could not copy the prompt. It remains saved here; select it and copy it manually.', 'error'))
}

function openExternalAiTools(providers) {
  const prompt = externalAiPrompt.value
  if (!prompt.trim()) {
    showMessage('Enter a prompt to continue.', 'warning')
    return
  }
  openPromptWithProviders(prompt, providers)
}

function go(name, articleId) {
  router.push({ name, ...(articleId ? { query: { article: articleId } } : {}) })
}

function openArticle(article) {
  if (article?.id) go('editor', article.id)
}

function addArticle() {
  const article = createNewArticle()
  go('editor', article.id)
}

function openDialog(type, article = currentArticle.value) {
  dialog.value = { type, articleId: article?.id || null }
  if (type === 'schedule') {
    const tomorrow = new Date(Date.now() + 60 * 60 * 1000)
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset())
    scheduledAt.value = tomorrow.toISOString().slice(0, 16)
  }
}

function closeDialog() {
  dialog.value = null
}

async function openPostDialog(post = null) {
  if (postSaving.value) return
  if (!post || typeof post.id !== 'string') post = null
  editingPost.value = post
  postEditText.value = post?.text || ''
  postEditImage.value = post?.image ? { ...post.image } : null
  postDialogOpen.value = true
  emojiPickerOpen.value = false
  await nextTick()
  postTextArea.value?.focus()
}

function closePostDialog() {
  if (postSaving.value) return
  if (dictating.value) recognition.value?.stop()
  dictating.value = false
  postDialogOpen.value = false
  emojiPickerOpen.value = false
  editingPost.value = null
  postEditText.value = ''
  postEditImage.value = null
}

function setActivePostText(value) {
  if (editingPost.value) postEditText.value = value
  else postText.value = value
}

function updateActivePostText(event) {
  setActivePostText(event.target.value)
}

async function insertPostEmoji(emoji) {
  const textarea = postTextArea.value
  const text = activePostText.value
  const start = textarea?.selectionStart ?? text.length
  const end = textarea?.selectionEnd ?? text.length
  setActivePostText(`${text.slice(0, start)}${emoji}${text.slice(end)}`)
  emojiPickerOpen.value = false
  await nextTick()
  textarea?.focus()
  textarea?.setSelectionRange(start + emoji.length, start + emoji.length)
}

function updateProfile() {
  const name = profileForm.value.name.trim()
  if (!name) {
    showMessage('Enter a profile name before saving.', 'warning')
    return
  }
  workspace.value.profile = { ...profileForm.value, name }
  showMessage('Profile saved in this browser.')
  go('editor')
}

function handlePostImage(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
    showMessage('Choose a PNG, JPEG, GIF, or WebP image up to 4 MB.', 'warning')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const image = { src: String(reader.result), name: file.name }
    if (editingPost.value) postEditImage.value = image
    else postImage.value = image
  }
  reader.onerror = () => showMessage('Could not read that image.', 'error')
  reader.readAsDataURL(file)
}

async function submitPost() {
  if (postSaving.value || (!activePostText.value.trim() && !activePostImage.value)) return
  if (dictating.value) recognition.value?.stop()
  dictating.value = false

  if (editingPost.value) {
    postSaving.value = true
    try {
      const saved = await persistPostChanges(editingPost.value.id, {
        text: postEditText.value,
        image: postEditImage.value,
      })
      if (!saved) {
        showMessage('Could not save this post in this browser.', 'error')
        return
      }
      postDialogOpen.value = false
      editingPost.value = null
      postEditText.value = ''
      postEditImage.value = null
      emojiPickerOpen.value = false
      showMessage('Post updated in this browser.')
    } finally {
      postSaving.value = false
    }
    return
  }

  const submittedText = postText.value
  const submittedImage = postImage.value
  const savedOffline = !navigator.onLine
  postSaving.value = true
  try {
    if (!await createPost({
      text: submittedText,
      image: submittedImage,
      syncStatus: savedOffline ? 'pending' : 'local-only',
    })) {
      showMessage('Could not save this post in this browser.', 'error')
      return
    }
    if (postText.value === submittedText) postText.value = ''
    if (postImage.value === submittedImage) postImage.value = null
    postDialogOpen.value = false
    showMessage(savedOffline ? 'Post saved offline. Sync is pending until an upload service is connected.' : 'Post saved in this browser.')
  } finally {
    postSaving.value = false
  }
}

function togglePostOptions(postId) {
  postMenuId.value = postMenuId.value === postId ? '' : postId
}

function editPost(post) {
  postMenuId.value = ''
  openPostDialog(post)
}

function toggleDictation() {
  if (dictating.value) {
    recognition.value?.stop()
    return
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    showMessage('Voice dictation is not supported by this browser.', 'warning')
    return
  }
  try {
    const activeRecognition = new SpeechRecognition()
    activeRecognition.lang = language.value === 'ta' ? 'ta-IN' : (navigator.language || 'en-US')
    activeRecognition.continuous = true
    activeRecognition.interimResults = false
    activeRecognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .slice(event.resultIndex)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim()
      if (transcript && dictating.value && !postSaving.value) {
        postText.value = `${postText.value}${postText.value && !/\s$/.test(postText.value) ? ' ' : ''}${transcript}`
      }
    }
    activeRecognition.onerror = (event) => {
      dictating.value = false
      if (event.error !== 'aborted') showMessage(event.error === 'not-allowed' ? 'Allow microphone access in your browser to dictate.' : `Voice dictation stopped: ${event.error || 'unknown error'}`, 'error')
    }
    activeRecognition.onend = () => { dictating.value = false }
    recognition.value = activeRecognition
    dictating.value = true
    activeRecognition.start()
  } catch (error) {
    dictating.value = false
    showMessage(error?.message || 'Could not start voice dictation.', 'error')
  }
}

function changePost(articleId, action) {
  const article = workspace.value.articles.find((item) => item.id === articleId)
  if (!article) return
  if (action === 'archive' || action === 'restore') {
    updateArticle(articleId, { archived: action === 'archive', archivedAt: action === 'archive' ? new Date().toISOString() : null })
    showMessage(action === 'archive' ? 'Article moved to Archive.' : 'Article restored.')
    return
  }
  if (action === 'discard') openDialog('discard', article)
  if (action === 'publish') openDialog('publish', article)
  if (action === 'schedule') openDialog('schedule', article)
}

function togglePin(article) {
  const pinned = workspace.value.articles.filter((item) => item.pinned === true)
  if (article.pinned) {
    updateArticle(article.id, { pinned: false })
    return
  }
  if (pinned.length >= 3) {
    showMessage('Unpin an article before pinning another. You can pin up to three.', 'warning')
    return
  }
  updateArticle(article.id, { pinned: true })
}

function commitBody(event) {
  if (!currentArticle.value) return
  const body = sanitizeRichTextHtml(event.currentTarget.innerHTML)
  if (body === lastEditorBody) return
  bodyUndoStack.value.push(lastEditorBody)
  if (bodyUndoStack.value.length > 100) bodyUndoStack.value.shift()
  bodyRedoStack.value = []
  lastEditorBody = body
  updateArticle(currentArticle.value.id, { body })
}

function restoreEditorBody(body) {
  if (!currentArticle.value || body === currentArticle.value.body) return
  lastEditorBody = body
  updateArticle(currentArticle.value.id, { body })
  nextTick(() => {
    if (!editorElement.value) return
    editorElement.value.innerHTML = richTextToHtml(body)
    editorElement.value.focus()
  })
}

function undoEditorBody() {
  if (!bodyUndoStack.value.length || !currentArticle.value) return
  bodyRedoStack.value.push(currentArticle.value.body)
  restoreEditorBody(bodyUndoStack.value.pop())
}

function redoEditorBody() {
  if (!bodyRedoStack.value.length || !currentArticle.value) return
  bodyUndoStack.value.push(currentArticle.value.body)
  restoreEditorBody(bodyRedoStack.value.pop())
}

function applyFormat(command, value = null) {
  editorElement.value?.focus()
  document.execCommand(command, false, value)
  if (editorElement.value && currentArticle.value) commitBody({ currentTarget: editorElement.value })
}

function saveHighlight() {
  const text = highlightText.value.trim()
  if (!text || !currentArticle.value) return
  const collection = highlightedCollection.value
  if (!collection) {
    showMessage('Choose a Highlight Collection.', 'warning')
    return
  }
  if ((collection.articleHighlights || []).some((item) => item.articleId === currentArticle.value.id && item.text === text)) {
    showMessage('This text is already saved in that collection.', 'warning')
    return
  }
  const entry = createArticleHighlight({
    articleId: currentArticle.value.id,
    articleTitle: getArticleTitle(currentArticle.value),
    text,
    selectedText: false,
  })
  const next = highlights.value.map((item) => item.id === collection.id
    ? { ...item, articleHighlights: [...(item.articleHighlights || []), entry], updatedAt: new Date().toISOString() }
    : item)
  if (saveHighlightCollections(next)) {
    highlightText.value = ''
    showMessage('Highlight saved.')
  }
}

function openHighlightManager() {
  highlightDraft.value = null
  highlightPreview.value = null
  highlightManagerView.value = 'list'
}

function previewHighlightCollection(collection) {
  highlightPreview.value = collection
  highlightManagerView.value = 'preview'
}

function closeHighlightManager() {
  if (highlightPhotosLoading.value) return
  highlightDraft.value = null
  highlightPreview.value = null
  highlightManagerView.value = 'closed'
}

function startHighlightCollection() {
  highlightPreview.value = null
  const collection = createHighlightCollection()
  highlightDraft.value = { ...collection, title: '', articleHighlights: [] }
  highlightManagerView.value = 'editor'
}

function editHighlightCollection(collection) {
  highlightPreview.value = null
  highlightDraft.value = {
    ...collection,
    items: collection.items.map((item) => ({ ...item })),
    articleHighlights: [...(collection.articleHighlights || [])],
  }
  highlightManagerView.value = 'editor'
}

function returnToHighlightList() {
  if (highlightPhotosLoading.value) return
  highlightDraft.value = null
  highlightManagerView.value = 'list'
}

function readHighlightImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read that image.'))
        return
      }
      resolve({ id: createId('highlight-image'), src: reader.result, name: file.name })
    }
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })
}

async function handleHighlightPhotos(event) {
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length || !highlightDraft.value || highlightPhotosLoading.value) return

  const supportedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  const validFiles = files.filter((file) => supportedTypes.includes(file.type) && file.size <= 4 * 1024 * 1024)
  const remainingSlots = 8 - highlightDraft.value.items.length
  const chosenFiles = validFiles.slice(0, remainingSlots)
  if (validFiles.length !== files.length) {
    showMessage(t('Choose PNG, JPEG, GIF, or WebP images up to 4 MB each.'), 'warning')
  } else if (validFiles.length > remainingSlots) {
    showMessage(t('A highlight collection can include up to 8 photos.'), 'warning')
  }
  if (!chosenFiles.length) return

  highlightPhotosLoading.value = true
  try {
    const images = await Promise.all(chosenFiles.map(readHighlightImage))
    if (highlightDraft.value) {
      highlightDraft.value = {
        ...highlightDraft.value,
        items: [...highlightDraft.value.items, ...images],
      }
    }
  } catch (error) {
    showMessage(t(error?.message || 'Could not read that image.'), 'error')
  } finally {
    highlightPhotosLoading.value = false
  }
}

function removeHighlightPhoto(imageId) {
  if (!highlightDraft.value || highlightPhotosLoading.value) return
  highlightDraft.value = {
    ...highlightDraft.value,
    items: highlightDraft.value.items.filter((item) => item.id !== imageId),
  }
}

function saveHighlightCollection() {
  const draft = highlightDraft.value
  if (!draft) return
  const title = draft.title.trim()
  if (!title) {
    showMessage(t('Add a title for this highlight.'), 'warning')
    return
  }
  if (!draft.items.length && !draft.articleHighlights.length) {
    showMessage(t('Add at least one photo or saved quote.'), 'warning')
    return
  }

  const collection = { ...draft, title, updatedAt: new Date().toISOString() }
  const exists = highlights.value.some((item) => item.id === collection.id)
  const next = exists
    ? highlights.value.map((item) => item.id === collection.id ? collection : item)
    : [collection, ...highlights.value]
  if (saveHighlightCollections(next)) {
    selectedCollectionId.value = collection.id
    highlightDraft.value = null
    highlightManagerView.value = 'closed'
    showMessage(t('Highlight collection saved.'))
  }
}

function resolveDialog() {
  const target = selectedArticle.value
  if (!target || !dialog.value) return
  if (dialog.value.type === 'discard') {
    discardArticle(target.id)
    closeDialog()
    go('articles')
    showMessage('Draft discarded.')
    return
  }
  if (dialog.value.type === 'publish') {
    if (!articleCanPublish(target)) {
      showMessage('A title and body are required to publish.', 'warning')
      return
    }
    updateArticle(target.id, publishLocally())
    closeDialog()
    go('published', target.id)
    showMessage('Post saved as published in this browser.')
    return
  }
  if (dialog.value.type === 'schedule') {
    const selectedTime = new Date(scheduledAt.value)
    if (!articleCanPublish(target) || !Number.isFinite(selectedTime.getTime()) || selectedTime <= new Date()) {
      showMessage('Choose a title, body, and a future date and time.', 'warning')
      return
    }
    updateArticle(target.id, scheduleLocally(selectedTime.toISOString()))
    closeDialog()
    showMessage('The schedule was saved in this browser only.')
  }
}

async function copyArticle(article) {
  const text = `${getArticleTitle(article)}\n\n${richTextToPlainText(article.body || '')}`
  try {
    await navigator.clipboard.writeText(text)
    showMessage('Article text copied.')
  } catch {
    showMessage('Could not copy the article. Select and copy the text instead.', 'error')
  }
}

function downloadArticle(article) {
  const blob = new Blob([`${getArticleTitle(article)}\n\n${richTextToPlainText(article.body || '')}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${makeSafeFilename(article.title)}.txt`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function printArticle(article) {
  const originalTitle = document.title
  document.title = makeSafeFilename(article.title || getArticleTitle(article))
  const restoreTitle = () => {
    document.title = originalTitle
    window.clearTimeout(restoreTimer)
  }
  const restoreTimer = window.setTimeout(restoreTitle, 120000)
  window.addEventListener('afterprint', restoreTitle, { once: true })
  window.print()
}

function speakSample() {
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
    showMessage('Text-to-speech is not supported by this browser.', 'warning')
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance('This is a sample of text to speech.')
  utterance.lang = language.value === 'ta' ? 'ta-IN' : 'en-US'
  window.speechSynthesis.speak(utterance)
}

function articleDate(article) {
  return formatDate(article.updatedAt, { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' }, dateLocale.value)
}

watch(() => currentArticle.value?.id, async () => {
  bodyUndoStack.value = []
  bodyRedoStack.value = []
  lastEditorBody = currentArticle.value?.body || ''
  await nextTick()
  if (editorElement.value) editorElement.value.innerHTML = richTextToHtml(currentArticle.value?.body || '')
}, { immediate: true })

watch(() => workspace.value.profile, (value) => {
  profileForm.value = { ...value }
}, { deep: true })

onMounted(() => {
  if (!selectedCollectionId.value && highlights.value.length) selectedCollectionId.value = highlights.value[0].id
  mobileViewportQuery.addEventListener('change', updateMobileViewport)
  updateVisualKeyboardInset()
  window.visualViewport?.addEventListener('resize', updateVisualKeyboardInset)
  window.visualViewport?.addEventListener('scroll', updateVisualKeyboardInset)
})

onBeforeUnmount(() => {
  window.clearTimeout(messageTimer.value)
  recognition.value?.stop()
  mobileViewportQuery.removeEventListener('change', updateMobileViewport)
  window.visualViewport?.removeEventListener('resize', updateVisualKeyboardInset)
  window.visualViewport?.removeEventListener('scroll', updateVisualKeyboardInset)
  document.documentElement.classList.remove('writing-focus-mode')
})
</script>

<template>
  <div
    v-if="page === 'compose'"
    class="page-wrap home-page"
  >
    <section class="home-profile-card surface-card">
      <button
        class="home-profile-trigger"
        type="button"
        @click="go('profile')"
      >
        <ProfileAvatar :profile="workspace.profile" />
        <span class="home-profile-copy"><strong>{{ profileName }}</strong><small>Profile account</small></span>
        <ChevronRight :size="18" />
      </button>
    </section>
    <section
      class="composer-card surface-card"
      :aria-label="t('Create post')"
    >
      <div class="composer-trigger-row">
        <ProfileAvatar
          :profile="workspace.profile"
          size="small"
        />
        <button
          class="composer-open-button"
          type="button"
          :aria-label="t('Write a post')"
          @click="openPostDialog()"
        >
          {{ composerPlaceholder }}
        </button>
      </div>
      <div class="composer-actions">
        <button
          class="text-button"
          type="button"
          @click="openPostDialog()"
        >
          <ImagePlus :size="17" /> {{ t('Photo') }}
        </button>
        <button
          class="text-button"
          type="button"
          @click="addArticle"
        >
          <FilePlus2 :size="17" /> {{ t('Write article') }}
        </button>
      </div>
    </section>

    <section class="content-section home-posts-section">
      <div class="section-title-row">
        <h2>{{ t('Recent Posts') }} <span class="count-badge">{{ sortedPosts.length }}</span></h2>
        <button
          v-if="numberedPosts.length > 3"
          class="text-button"
          type="button"
          @click="showAllPosts = !showAllPosts"
        >
          {{ t(showAllPosts ? 'Show Less' : 'See More') }}
        </button>
      </div>
      <p
        v-if="!sortedPosts.length"
        class="empty-state"
      >
        No posts yet. Write something to get started.
      </p>
      <article
        v-for="{ post, postNumber } in visiblePosts"
        :key="post.id"
        class="post-card surface-card"
      >
        <div class="post-card-header">
          <div class="post-author">
            <ProfileAvatar
              :profile="workspace.profile"
              size="small"
            />
            <div><strong>{{ profileName }}</strong><small>{{ formatDate(post.createdAt, { dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' }, dateLocale) }} · {{ t(post.syncStatus === 'pending' ? 'Sync pending' : 'Local post') }} <span class="home-post-number-chip">{{ postNumber }}</span></small></div>
          </div>
          <button
            class="icon-button post-copy-button"
            type="button"
            :aria-label="t('Copy post')"
            :title="t('Copy post')"
            @click="copyPost(post)"
          >
            <Copy :size="17" />
          </button>
          <button
            class="icon-button post-options-button"
            type="button"
            :aria-label="t('More post options')"
            :aria-expanded="postMenuId === post.id"
            @click="togglePostOptions(post.id)"
          >
            <MoreVertical :size="18" />
          </button>
        </div>
        <div
          v-if="postMenuId === post.id"
          class="post-options-menu"
          role="group"
          :aria-label="t('Post options')"
        >
          <button
            type="button"
            @click="editPost(post)"
          >
            {{ t('Edit post') }}
          </button>
        </div>
        <p
          v-if="post.text"
          class="post-copy"
        >
          {{ post.text }}
        </p>
        <img
          v-if="post.image?.src"
          class="post-image"
          :src="post.image.src"
          :alt="post.image.name || 'Post image'"
        >
      </article>
    </section>

    <HomeHighlightsSection
      class="mobile-priority-highlights"
      :collections="highlights"
      :articles="workspace.articles"
      :language="language"
      @open-manager="openHighlightManager"
      @preview-collection="previewHighlightCollection"
      @edit-collection="editHighlightCollection"
      @open-article="openArticle"
    />

    <section class="content-section home-articles-section">
      <div class="section-title-row">
        <h2>{{ t('Articles') }}</h2><button
          class="text-button"
          type="button"
          @click="go('articles')"
        >
          {{ t('See More') }} <ChevronRight :size="16" />
        </button>
      </div>
      <article
        v-for="article in activeArticles.slice(0, 4)"
        :key="article.id"
        class="article-row surface-card"
      >
        <button
          class="article-row-main"
          type="button"
          @click="openArticle(article)"
        >
          <strong>{{ getArticleTitle(article) }}</strong>
          <small>{{ article.status }} · {{ getArticleExcerpt(article.body) || 'No article text yet.' }}</small>
        </button>
        <div class="article-row-actions">
          <button
            class="icon-button"
            type="button"
            :aria-label="bookmarkedIds.includes(article.id) ? 'Remove bookmark' : 'Bookmark article'"
            @click="toggleBookmark(article.id)"
          >
            <Bookmark
              :size="17"
              :fill="bookmarkedIds.includes(article.id) ? 'currentColor' : 'none'"
            />
          </button>
          <button
            class="icon-button"
            type="button"
            :aria-label="shortcutIds.includes(article.id) ? 'Remove from Home Shortcuts' : 'Add to Home Shortcuts'"
            @click="toggleShortcut(article.id)"
          >
            <House
              :size="17"
              :fill="shortcutIds.includes(article.id) ? 'currentColor' : 'none'"
            />
          </button>
          <button
            class="icon-button"
            type="button"
            :aria-label="article.pinned ? 'Unpin article' : 'Pin article'"
            @click="togglePin(article)"
          >
            <Pin
              :size="17"
              :fill="article.pinned ? 'currentColor' : 'none'"
            />
          </button>
          <button
            class="icon-button"
            type="button"
            aria-label="Archive article"
            @click="changePost(article.id, 'archive')"
          >
            <Archive :size="17" />
          </button>
        </div>
      </article>
      <p
        v-if="!activeArticles.length"
        class="empty-state"
      >
        No articles yet.
      </p>
    </section>

    <section class="content-section home-shortcuts-section">
      <div class="section-title-row">
        <h2>Home Shortcuts</h2>
      </div>
      <article
        v-for="article in shortcutArticles"
        :key="article.id"
        class="article-row surface-card"
      >
        <button
          class="article-row-main"
          type="button"
          @click="openArticle(article)"
        >
          <strong>{{ getArticleTitle(article) }}</strong><small>{{ getArticleExcerpt(article.body) || 'No article text yet.' }}</small>
        </button>
        <button
          class="icon-button"
          type="button"
          aria-label="Remove from Home Shortcuts"
          @click="toggleShortcut(article.id)"
        >
          <X :size="17" />
        </button>
      </article>
      <p
        v-if="!shortcutArticles.length"
        class="empty-state"
      >
        Add an article to Home Shortcuts from the Articles page.
      </p>
    </section>

    <HomeHighlightsSection
      class="desktop-priority-highlights"
      :collections="highlights"
      :articles="workspace.articles"
      :language="language"
      @open-manager="openHighlightManager"
      @preview-collection="previewHighlightCollection"
      @edit-collection="editHighlightCollection"
      @open-article="openArticle"
    />
  </div>

  <div
    v-else-if="page === 'profile'"
    class="page-wrap narrow-page"
  >
    <div class="page-heading">
      <span class="eyebrow">{{ t('Writer profile') }}</span><h1>{{ t('Profile') }} &amp; Settings</h1><p>{{ t('Manage the name and introduction shown on your writing profile.') }}</p>
    </div>
    <section class="surface-card settings-card">
      <div class="settings-section-head">
        <ProfileAvatar
          :profile="profileForm"
          size="large"
        /><div><h2>{{ profileForm.name || 'Writer' }}</h2><p>Profile account</p></div>
      </div>
      <label class="field-label">{{ t('Your name') }}<input
        v-model="profileForm.name"
        autocomplete="name"
        maxlength="80"
      ></label>
      <label class="field-label">Profile avatar<select v-model="profileForm.avatar"><option
        v-for="avatar in avatarOptions"
        :key="avatar"
        :value="avatar"
      >{{ avatar }}</option></select></label>
      <label class="field-label">{{ t('Short introduction') }}<textarea
        v-model="profileForm.bio"
        rows="3"
        maxlength="500"
        :placeholder="t('A few lines about you')"
      /></label>
      <button
        class="button button-primary"
        type="button"
        @click="updateProfile"
      >
        {{ t('Save profile and continue to editor') }}
      </button>
    </section>
    <section class="surface-card settings-card">
      <h2>{{ t('Display') }} Settings</h2>
      <div class="setting-row">
        <div><strong>{{ t('Visibility') }}</strong><small>Private — articles stay in this browser.</small></div><span class="local-badge">Private</span>
      </div>
      <label class="setting-row"><span><strong>{{ t('Language') }}</strong><small>Choose the language for app labels.</small></span><select
        v-model="language"
        :aria-label="t('Choose language')"
      ><option value="en">English</option><option value="ta">தமிழ்</option></select></label>
      <div class="setting-row">
        <div><strong>Appearance</strong><small>Choose a light or dark workspace.</small></div><button
          class="button button-secondary"
          type="button"
          @click="theme = theme === 'dark' ? 'light' : 'dark'"
        >
          {{ theme === 'dark' ? 'Dark' : 'Light' }}
        </button>
      </div>
      <details class="additional-settings">
        <summary>Additional Settings</summary>
        <label class="setting-row">
          <span>
            <strong>{{ t('Display zoom') }}</strong>
            <small>{{ t('Scale the whole app for visibility.') }}</small>
          </span>
          <select
            v-model="accessibility.displayZoom"
            :aria-label="t('Display zoom')"
          >
            <option
              v-for="zoom in displayZoomOptions"
              :key="zoom.value"
              :value="zoom.value"
            >{{ t(zoom.label) }}</option>
          </select>
        </label>
        <label class="setting-row"><span><strong>{{ t('Font family') }}</strong><small>{{ t('Choose the app font.') }}</small></span><select
          v-model="accessibility.fontFamily"
          :aria-label="t('Font family')"
        ><option
          v-for="font in fontFamilyOptions"
          :key="font.value"
          :value="font.value"
        >{{ font.label }}</option></select></label>
        <label class="setting-row"><span><strong>Font size</strong><small>Make text easier to read.</small></span><input
          v-model.number="accessibility.fontScale"
          type="range"
          min="0.9"
          max="1.3"
          step="0.1"
          aria-label="Font size"
        ></label>
        <label class="setting-checkbox"><input
          v-model="accessibility.boldText"
          type="checkbox"
        > Bold text</label>
        <label class="setting-checkbox"><input
          v-model="accessibility.outlineText"
          type="checkbox"
        > Outline text for contrast</label>
        <div class="setting-subsection-heading">
          <strong>{{ t('Colour and motion') }}</strong>
          <small>{{ t('Adjust colour, blur, and movement in this app.') }}</small>
        </div>
        <label class="setting-checkbox"><input
          v-model="accessibility.highContrast"
          type="checkbox"
        > {{ t('Make backgrounds and panels easier to see') }}</label>
        <label class="setting-row"><span><strong>{{ t('Colour filter') }}</strong><small>{{ t('Applies a colour filter to this website only.') }}</small></span><select
          v-model="accessibility.colorFilter"
          :aria-label="t('Colour filter')"
        ><option value="none">{{ t('Use original colours') }}</option><option value="invert">{{ t('Colour inversion') }}</option><option value="grayscale">{{ t('Grayscale') }}</option><option value="low-saturation">{{ t('Reduced saturation') }}</option></select></label>
        <label class="setting-checkbox"><input
          v-model="accessibility.reduceBlur"
          type="checkbox"
        > {{ t('Reduce blur effects') }}</label>
        <label class="setting-checkbox"><input
          v-model="accessibility.removeAnimations"
          type="checkbox"
        > {{ t('Remove animations') }}</label>
        <label class="setting-checkbox"><input
          v-model="accessibility.reduceMotion"
          type="checkbox"
        > {{ t('Reduce movement on the screen') }}</label>
        <div class="setting-row">
          <span><strong>Text-to-speech</strong><small>Use a voice available in this browser.</small></span><button
            class="button button-secondary"
            type="button"
            @click="speakSample"
          >
            {{ t('Test text-to-speech') }}
          </button>
        </div>
        <p>Article drafts, posts, bookmarks, and profile settings are saved locally in this browser. Publishing and scheduling only update local status.</p>
      </details>
      <div class="session-actions">
        <button
          class="button button-secondary"
          type="button"
          @click="setSessionStatus('locked')"
        >
          Lock writing space
        </button>
        <button
          class="button button-secondary"
          type="button"
          @click="setSessionStatus('signed-out')"
        >
          Sign out locally
        </button>
      </div>
    </section>
    <section class="surface-card settings-card browser-storage-card">
      <div class="browser-storage-heading">
        <div>
          <h2>{{ t('Browser storage') }}</h2>
          <p>{{ t('Estimated storage for this site on this device. The browser controls the quota.') }}</p>
        </div>
        <button
          class="button button-secondary"
          type="button"
          :disabled="browserStorageEstimate.status === 'loading'"
          @click="refreshBrowserStorageEstimate"
        >
          {{ t(browserStorageEstimate.status === 'loading' ? 'Checking...' : 'Refresh estimate') }}
        </button>
      </div>
      <div
        v-if="browserStorageEstimate.status === 'ready'"
        class="browser-storage-metrics"
      >
        <div><small>{{ t('Used') }}</small><strong>{{ formatStorageSize(browserStorageEstimate.usage) }}</strong></div>
        <div><small>{{ t('Estimated available') }}</small><strong>{{ formatStorageSize(Math.max(0, browserStorageEstimate.quota - browserStorageEstimate.usage)) }}</strong></div>
        <div><small>{{ t('Estimated quota') }}</small><strong>{{ formatStorageSize(browserStorageEstimate.quota) }}</strong></div>
        <progress
          class="browser-storage-progress"
          max="1"
          :value="browserStorageUsageRatio"
          :aria-label="t('Estimated browser storage used')"
        />
      </div>
      <p
        v-else-if="browserStorageEstimate.status === 'unavailable'"
        class="browser-storage-unavailable"
        role="status"
      >
        {{ t('This browser does not provide a storage estimate.') }}
      </p>
    </section>
  </div>

  <div
    v-else-if="page === 'editor'"
    class="page-wrap editor-page"
    :class="{ 'is-focused': focusMode, 'is-one-handed': mobileViewport && oneHandMode, 'is-one-handed-left': oneHandSide === 'left' }"
    :style="oneHandStyle"
  >
    <div class="page-heading page-heading-row">
      <div class="editor-heading-copy">
        <span class="eyebrow">{{ t('Writing workspace') }}</span>
        <h1>{{ t('Article Editor') }}</h1>
        <p>{{ t('Write and edit your article. Your draft is saved in this browser.') }}</p>
      </div>
      <div class="editor-heading-actions">
        <button
          v-if="mobileViewport"
          class="button button-secondary one-hand-toggle"
          type="button"
          :aria-pressed="oneHandMode"
          @click="oneHandMode = !oneHandMode"
        >
          {{ t(oneHandMode ? 'One-hand mode on' : 'One-hand typing') }}
        </button>
        <div
          v-if="mobileViewport && oneHandMode"
          class="one-hand-side-controls"
          role="group"
          :aria-label="t('Toolbar side')"
        >
          <button
            type="button"
            :class="{ selected: oneHandSide === 'left' }"
            :aria-pressed="oneHandSide === 'left'"
            @click="oneHandSide = 'left'"
          >
            {{ t('Left') }}
          </button>
          <button
            type="button"
            :class="{ selected: oneHandSide === 'right' }"
            :aria-pressed="oneHandSide === 'right'"
            @click="oneHandSide = 'right'"
          >
            {{ t('Right') }}
          </button>
        </div>
        <button
          class="button button-secondary editor-manage-button"
          type="button"
          @click="go('articles')"
        >
          {{ t('Manage') }} {{ t('Articles') }}
        </button>
        <button
          class="button button-secondary focus-mode-toggle"
          :class="{ 'is-active': focusMode }"
          type="button"
          :aria-pressed="focusMode"
          :aria-label="t(focusMode ? 'Exit focus mode' : 'Focus mode')"
          @click="focusMode = !focusMode"
        >
          <Minimize2
            v-if="focusMode"
            :size="17"
          />
          <Maximize2
            v-else
            :size="17"
          />
          <span>{{ t(focusMode ? 'Exit focus mode' : 'Focus mode') }}</span>
          <span
            v-if="focusMode"
            class="focus-mode-indicator"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
    <template v-if="currentArticle">
      <details class="writing-intention-prompt">
        <summary>{{ t('Write with good intent') }}</summary>
        <strong>{{ t('Choose to do good') }}</strong>
        <p>{{ t('Before you begin, consider how this writing could help someone.') }}</p>
      </details>
      <details class="editor-review-checklist">
        <summary>{{ t('Review before publishing') }} · {{ completedReviewCount }}/{{ reviewItems.length }}</summary>
        <p>{{ t('A quick quality check before you publish locally.') }}</p>
        <label
          v-for="item in reviewItems"
          :key="item.key"
        >
          <input
            type="checkbox"
            :checked="Boolean(reviewChecksByArticle[currentArticle.id]?.[item.key])"
            @change="setReviewCheck(item.key, $event.target.checked)"
          >
          <span>{{ t(item.label) }}</span>
        </label>
      </details>
      <section class="surface-card editor-card">
        <div class="editor-status">
          <span class="local-badge">{{ t(currentArticle.status) }}</span><span>{{ wordCount }} {{ t('words') }} · {{ t('Updated:') }} {{ articleDate(currentArticle) }}</span>
        </div>
        <label
          class="visually-hidden"
          for="article-title"
        >{{ t('Article title') }}</label>
        <input
          id="article-title"
          class="article-title-input"
          :value="currentArticle.title"
          :placeholder="t('Write an article title...')"
          maxlength="200"
          @input="updateArticle(currentArticle.id, { title: $event.target.value })"
        >
        <div
          class="format-toolbar"
          :aria-label="t('Text formatting options')"
        >
          <button
            type="button"
            :aria-label="t('Undo')"
            :title="t('Undo')"
            :disabled="!bodyUndoStack.length"
            @click="undoEditorBody"
          >
            <Undo2 :size="17" />
          </button>
          <button
            type="button"
            :aria-label="t('Redo')"
            :title="t('Redo')"
            :disabled="!bodyRedoStack.length"
            @click="redoEditorBody"
          >
            <Redo2 :size="17" />
          </button>
          <button
            type="button"
            aria-label="Bold"
            @click="applyFormat('bold')"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            aria-label="Italic"
            @click="applyFormat('italic')"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            aria-label="Bulleted list"
            @click="applyFormat('insertUnorderedList')"
          >
            • List
          </button>
          <button
            type="button"
            aria-label="Numbered list"
            @click="applyFormat('insertOrderedList')"
          >
            1. List
          </button>
          <button
            type="button"
            aria-label="Quote"
            @click="applyFormat('formatBlock', 'blockquote')"
          >
            Quote
          </button>
        </div>
        <div
          ref="editorElement"
          class="article-body-editor"
          contenteditable="true"
          role="textbox"
          :aria-label="t('Article body')"
          aria-multiline="true"
          :data-placeholder="t('Start writing your article here...')"
          @input="commitBody"
        />
        <ReadAloudControls
          :text="readAloudText"
          :language="language"
          :labels="readAloudLabels"
        />
        <div class="editor-actions">
          <div class="editor-action-group editor-action-secondary">
            <button
              class="button button-secondary"
              type="button"
              @click="openDialog('preview')"
            >
              Preview
            </button>
            <button
              class="button button-secondary"
              type="button"
              @click="go('seo', currentArticle.id)"
            >
              SEO settings
            </button>
            <button
              class="button button-secondary"
              type="button"
              @click="copyArticle(currentArticle)"
            >
              <Copy :size="16" /> Copy
            </button>
            <button
              class="button button-secondary"
              type="button"
              @click="downloadArticle(currentArticle)"
            >
              Download .txt
            </button>
          </div>
          <div class="editor-action-group editor-action-primary">
            <button
              class="button button-secondary"
              type="button"
              @click="changePost(currentArticle.id, 'schedule')"
            >
              <Clock3 :size="16" /> Schedule
            </button>
            <button
              class="button button-primary"
              type="button"
              @click="changePost(currentArticle.id, 'publish')"
            >
              <Send :size="16" /> Publish locally
            </button>
          </div>
        </div>
        <div class="highlight-tools">
          <h2>Save a highlight</h2>
          <div
            v-if="!highlights.length"
            class="highlight-new-row"
          >
            <button
              class="text-button"
              type="button"
              @click="startHighlightCollection"
            >
              <Plus :size="16" /> Create a collection
            </button>
          </div>
          <div
            v-else
            class="highlight-new-row"
          >
            <select
              v-model="selectedCollectionId"
              aria-label="Highlight collection"
            >
              <option
                v-for="collection in highlights"
                :key="collection.id"
                :value="collection.id"
              >
                {{ collection.title }}
              </option>
            </select>
            <input
              v-model="highlightText"
              placeholder="Paste text to save"
            >
            <button
              class="button button-secondary"
              type="button"
              :disabled="!highlightText.trim()"
              @click="saveHighlight"
            >
              Save
            </button>
            <button
              class="text-button"
              type="button"
              @click="startHighlightCollection"
            >
              <Plus :size="16" /> New collection
            </button>
          </div>
        </div>
      </section>
    </template>
    <section
      v-else
      class="surface-card empty-state"
    >
      <h2>No article is open</h2><button
        class="button button-primary"
        type="button"
        @click="addArticle"
      >
        Create new article
      </button>
    </section>
  </div>

  <div
    v-else-if="page === 'articles' || page === 'bookmarks' || page === 'archive'"
    class="page-wrap"
  >
    <div class="page-heading page-heading-row">
      <div><span class="eyebrow">Your writing</span><h1>{{ page === 'archive' ? 'Archive' : page === 'bookmarks' ? 'Bookmarks' : 'Articles' }}</h1><p>{{ page === 'archive' ? 'Restore articles or permanently discard a draft.' : page === 'bookmarks' ? 'Your saved articles.' : 'Manage drafts and locally published articles.' }}</p></div>
      <button
        v-if="page === 'articles'"
        class="button button-primary"
        type="button"
        @click="addArticle"
      >
        <FilePlus2 :size="16" /> New article
      </button>
    </div>
    <div
      v-if="page === 'articles'"
      class="filter-tabs"
      role="group"
      aria-label="Filter articles"
    >
      <button
        v-for="filter in ['all', 'draft', 'scheduled', 'published']"
        :key="filter"
        type="button"
        :class="{ selected: articleFilter === filter }"
        @click="articleFilter = filter"
      >
        {{ filter === 'all' ? 'All' : filter }}
      </button>
    </div>
    <div class="article-list">
      <article
        v-for="article in visibleArticles"
        :key="article.id"
        class="article-list-card surface-card"
      >
        <button
          class="article-list-main"
          type="button"
          @click="openArticle(article)"
        >
          <span class="article-list-title">{{ getArticleTitle(article) }}</span>
          <span class="article-list-excerpt">{{ getArticleExcerpt(article.body) || 'Article body has not been added yet.' }}</span>
          <span class="article-list-meta">{{ article.status }} · {{ articleDate(article) }}</span>
        </button>
        <div class="article-list-actions">
          <button
            class="icon-button"
            type="button"
            :aria-label="bookmarkedIds.includes(article.id) ? 'Remove bookmark' : 'Bookmark article'"
            @click="toggleBookmark(article.id)"
          >
            <Bookmark
              :size="17"
              :fill="bookmarkedIds.includes(article.id) ? 'currentColor' : 'none'"
            />
          </button>
          <button
            class="icon-button"
            type="button"
            :aria-label="shortcutIds.includes(article.id) ? 'Remove from Home Shortcuts' : 'Add to Home Shortcuts'"
            @click="toggleShortcut(article.id)"
          >
            <House
              :size="17"
              :fill="shortcutIds.includes(article.id) ? 'currentColor' : 'none'"
            />
          </button>
          <button
            v-if="page !== 'archive'"
            class="icon-button"
            type="button"
            :aria-label="article.pinned ? 'Unpin article' : 'Pin article'"
            @click="togglePin(article)"
          >
            <Pin
              :size="17"
              :fill="article.pinned ? 'currentColor' : 'none'"
            />
          </button>
          <button
            v-if="page === 'archive'"
            class="icon-button"
            type="button"
            aria-label="Restore article"
            @click="changePost(article.id, 'restore')"
          >
            <RotateCcw :size="17" />
          </button>
          <button
            v-else
            class="icon-button"
            type="button"
            aria-label="Archive article"
            @click="changePost(article.id, 'archive')"
          >
            <Archive :size="17" />
          </button>
          <button
            v-if="article.status === 'draft'"
            class="icon-button danger-icon"
            type="button"
            aria-label="Discard draft"
            @click="changePost(article.id, 'discard')"
          >
            <Trash2 :size="17" />
          </button>
        </div>
      </article>
      <p
        v-if="!visibleArticles.length"
        class="empty-state"
      >
        No articles in this category.
      </p>
    </div>
  </div>

  <div
    v-else-if="page === 'seo'"
    class="page-wrap narrow-page"
  >
    <div class="page-heading">
      <span class="eyebrow">Article settings</span><h1>SEO Settings</h1><p>This local preview is not sent to search engines.</p>
    </div>
    <section
      v-if="currentArticle"
      class="surface-card settings-card"
    >
      <label class="field-label">SEO title<input
        :value="currentArticle.seoTitle"
        maxlength="70"
        placeholder="Search title for this article"
        @input="updateArticle(currentArticle.id, { seoTitle: $event.target.value })"
      ></label>
      <label class="field-label">SEO description<textarea
        :value="currentArticle.seoDescription"
        maxlength="180"
        rows="3"
        placeholder="Short search description"
        @input="updateArticle(currentArticle.id, { seoDescription: $event.target.value })"
      /></label>
      <label class="field-label">URL slug<input
        :value="currentArticle.slug"
        maxlength="100"
        placeholder="article-url"
        @input="updateArticle(currentArticle.id, { slug: $event.target.value })"
      ></label>
      <div class="seo-preview">
        <small>Local search preview</small><strong>{{ currentArticle.seoTitle || getArticleTitle(currentArticle) }}</strong><span>{{ currentArticle.seoDescription || articleBodyText }}</span>
      </div>
      <button
        class="button button-primary"
        type="button"
        @click="go('editor', currentArticle.id)"
      >
        Back to editor
      </button>
    </section>
    <p
      v-else
      class="empty-state"
    >
      Create an article before editing SEO settings.
    </p>
  </div>

  <div
    v-else-if="page === 'published'"
    class="page-wrap narrow-page"
  >
    <div class="page-heading">
      <span class="eyebrow">Local status</span><h1>Published Post</h1><p>Publishing in this app only updates the status stored in this browser.</p>
    </div>
    <article
      v-if="currentArticle"
      class="surface-card published-card"
    >
      <span class="local-badge">{{ currentArticle.status }}</span>
      <h2>{{ getArticleTitle(currentArticle) }}</h2>
      <div
        class="rich-content"
        v-html="formattedBody"
      />
      <div class="editor-actions">
        <button
          class="button button-secondary"
          type="button"
          @click="openArticle(currentArticle)"
        >
          Edit
        </button><button
          class="button button-secondary"
          type="button"
          @click="copyArticle(currentArticle)"
        >
          Copy text
        </button><button
          class="button button-primary"
          type="button"
          @click="printArticle(currentArticle)"
        >
          Save as PDF
        </button>
      </div>
    </article>
    <p
      v-else
      class="empty-state"
    >
      No article is available.
    </p>
  </div>

  <div
    v-else-if="page === 'external-ai-tools'"
    class="page-wrap narrow-page external-ai-page"
  >
    <div class="page-heading">
      <span class="eyebrow">{{ t('One prompt, three AI apps') }}</span>
      <h1>{{ t('Multi-AI Search') }}</h1>
    </div>
    <section
      class="surface-card external-ai-prompt-card"
      aria-labelledby="external-ai-prompt-heading"
    >
      <div class="external-ai-prompt-heading">
        <h2 id="external-ai-prompt-heading">
          {{ t('Your prompt') }}
        </h2>
        <span
          class="external-ai-saved-state"
          :class="{ 'has-error': externalAiPromptStorageError }"
          aria-live="polite"
        >
          {{ externalAiPromptStorageError ? t('Could not save') : t('Saved in this browser') }}
        </span>
      </div>
      <p class="external-ai-intro">
        {{ t('Send a prompt and optional image to Gemini, ChatGPT and Meta AI. With the browser helper enabled, the image is handed off automatically; otherwise the prompt is copied and you can attach the image manually.') }}
      </p>
      <label
        class="visually-hidden"
        for="external-ai-prompt"
      >
        {{ t('Write your prompt') }}
      </label>
      <textarea
        id="external-ai-prompt"
        v-model="externalAiPrompt"
        class="external-ai-prompt-input"
        :placeholder="t('What would you like to ask?')"
        rows="4"
        @keydown="handleExternalAiPromptKeydown"
      />
      <div class="external-ai-image-actions">
        <label class="button button-secondary external-ai-image-label">
          <ImagePlus :size="16" />
          {{ t('Attach image') }}
          <input
            type="file"
            accept="image/*"
            @change="handleExternalAiImage"
          >
        </label>
        <span class="external-ai-image-note">{{ t('The image stays on this device until you submit the handoff.') }}</span>
      </div>
      <div
        v-if="externalAiImage"
        class="external-ai-image-preview"
      >
        <img
          :src="externalAiImage.dataUrl"
          alt=""
        >
        <span>{{ externalAiImage.name }}</span>
        <button
          class="icon-button"
          type="button"
          :aria-label="t('Remove image')"
          @click="externalAiImage = null"
        >
          <X :size="16" />
        </button>
      </div>
      <label
        v-if="externalAiImage"
        class="external-ai-image-helper-option"
      >
        <input
          v-model="externalAiImageHelperEnabled"
          type="checkbox"
        >
        {{ t('I have the browser helper installed; include the image in the handoff.') }}
      </label>
      <p
        v-if="externalAiImageError"
        class="external-ai-image-error"
        role="alert"
      >
        {{ t(externalAiImageError) }}
      </p>
      <div class="external-ai-prompt-footer">
        <span class="external-ai-prompt-hint">{{ t('Enter opens AI tools and copies your prompt. Shift+Enter adds a line.') }}</span>
        <span class="external-ai-character-count">{{ externalAiPrompt.length.toLocaleString() }}</span>
      </div>
      <div class="external-ai-main-actions">
        <div class="external-ai-secondary-actions">
          <button
            class="button button-secondary ai-hover-button"
            type="button"
            @click="copyExternalAiPrompt"
          >
            <Copy :size="16" />
            {{ t('Copy prompt') }}
          </button>
          <button
            class="text-button"
            type="button"
            :disabled="!externalAiPrompt"
            @click="externalAiPrompt = ''"
          >
            {{ t('Clear prompt') }}
          </button>
        </div>
        <button
          class="button button-primary external-ai-search-button ai-hover-button"
          type="button"
          :disabled="externalAiPromptSearching || !externalAiPrompt.trim()"
          :aria-label="t(externalAiPromptSearching ? (mobileViewport ? 'Opening AI...' : 'Opening 3 AIs...') : (mobileViewport ? 'Choose an AI' : 'Send to all 3 AIs'))"
          :aria-busy="externalAiPromptSearching"
          @click="openPromptInAllAiTools"
        >
          <template v-if="externalAiPromptSearching">
            {{ t(mobileViewport ? 'Opening AI...' : 'Opening 3 AIs...') }}
            <LoadingDots />
          </template>
          <template v-else>
            <Search :size="16" />
            {{ t(mobileViewport ? 'Choose an AI' : 'Send to all 3 AIs') }}
          </template>
        </button>
      </div>
    </section>
    <AiProviderPicker
      v-if="externalAiProviderPickerOpen"
      :providers="externalAiProviders"
      :title="t('Which AI would you like to use?')"
      :description="t('Choose one AI to open. Your prompt will be copied for you.')"
      :cancel-label="t('Cancel')"
      @select="openPromptWithProvider"
      @cancel="externalAiProviderPickerOpen = false"
    />
    <section
      class="external-ai-provider-grid"
      :aria-label="t('Choose an AI service')"
    >
      <article
        v-for="provider in externalAiProviders"
        :key="provider.name"
        class="surface-card external-ai-provider-card"
      >
        <span
          class="external-ai-provider-icon"
          aria-hidden="true"
        >
          <Sparkles :size="19" />
        </span>
        <h2>{{ provider.name }}</h2>
        <p>{{ t('Open in a new tab.') }}</p>
        <button
          class="button button-secondary ai-hover-button"
          type="button"
          @click="openExternalAiTools([provider])"
        >
          <ExternalLink :size="16" />
          {{ t('Open') }}
        </button>
      </article>
    </section>
  </div>

  <div
    v-else
    class="page-wrap narrow-page"
  >
    <section class="surface-card empty-state">
      <h1>Page not found</h1><button
        class="button button-primary"
        type="button"
        @click="go('compose')"
      >
        Back to home
      </button>
    </section>
  </div>

  <div
    v-if="postDialogOpen"
    class="dialog-backdrop"
    @click.self="closePostDialog"
  >
    <section
      class="app-dialog surface-card post-create-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-dialog-title"
      :aria-busy="postSaving"
      tabindex="-1"
    >
      <div class="post-modal-heading">
        <h2 id="post-dialog-title">
          {{ t(editingPost ? 'Edit post' : 'Create post') }}
        </h2>
        <button
          class="icon-button"
          type="button"
          :aria-label="t('Close dialog')"
          :disabled="postSaving"
          @click="closePostDialog"
        >
          <X :size="18" />
        </button>
      </div>
      <div class="post-modal-author">
        <ProfileAvatar
          :profile="workspace.profile"
          size="small"
        />
        <strong>{{ profileName }}</strong>
      </div>
      <textarea
        ref="postTextArea"
        :value="activePostText"
        class="post-modal-textarea"
        rows="5"
        :placeholder="composerPlaceholder"
        :aria-label="t('Write your post')"
        :disabled="postSaving"
        @input="updateActivePostText"
      />
      <p
        v-if="postDraftStorageError"
        class="post-local-note"
        role="alert"
      >
        {{ t('Could not save your post draft in this browser.') }}
      </p>
      <p
        v-else
        class="post-local-note"
        aria-live="polite"
      >
        {{ t(editingPost ? 'Post changes will be saved when you choose Save changes.' : 'Your post draft is saved as you type.') }}
      </p>
      <div
        v-if="activePostImage"
        class="selected-image post-modal-image"
      >
        <img
          :src="activePostImage.src"
          :alt="activePostImage.name || t('Post image')"
        >
        <button
          class="icon-button"
          type="button"
          :aria-label="t('Remove image')"
          :disabled="postSaving"
          @click="editingPost ? postEditImage = null : postImage = null"
        >
          <X :size="16" />
        </button>
      </div>
      <div
        v-if="postSaving"
        class="post-progress"
        role="status"
        aria-live="polite"
      >
        <LoadingDots />
        <span>{{ t('Saving post...') }}</span>
      </div>
      <div class="post-add-toolbar">
        <strong>{{ t('Add to your post') }}</strong>
        <div class="post-add-actions">
          <button
            class="icon-button post-add-photo"
            type="button"
            :aria-label="t('Add an image')"
            :disabled="postSaving"
            @click="imageInput?.click()"
          >
            <ImagePlus :size="20" />
          </button>
          <button
            class="icon-button post-add-mic"
            type="button"
            :aria-label="t(dictating ? 'Stop dictation' : 'Voice dictation')"
            :aria-pressed="dictating"
            :disabled="postSaving"
            @click="toggleDictation"
          >
            <Mic :size="20" />
          </button>
          <button
            class="icon-button post-add-emoji"
            type="button"
            :aria-label="t('Add an emoji')"
            :aria-expanded="emojiPickerOpen"
            :disabled="postSaving"
            @click="emojiPickerOpen = !emojiPickerOpen"
          >
            <Smile :size="20" />
          </button>
        </div>
      </div>
      <div
        v-if="emojiPickerOpen"
        class="post-emoji-picker"
        role="group"
        :aria-label="t('Choose an emoji')"
      >
        <button
          v-for="emoji in postEmojis"
          :key="emoji"
          class="post-emoji-option"
          type="button"
          :aria-label="emoji"
          @click="insertPostEmoji(emoji)"
        >
          {{ emoji }}
        </button>
      </div>
      <button
        class="button button-primary post-submit-button"
        type="button"
        :disabled="postSaving || (!postText.trim() && !postImage)"
        @click="submitPost"
      >
        {{ t(editingPost ? 'Save changes' : 'Post') }}
      </button>
      <p class="post-local-note">
        {{ t('This creates a local post in this browser only.') }}
      </p>
      <input
        ref="imageInput"
        class="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        @change="handlePostImage"
      >
    </section>
  </div>

  <div
    v-if="highlightManagerView === 'list'"
    class="dialog-backdrop"
    @click.self="closeHighlightManager"
  >
    <section
      class="app-dialog surface-card highlight-manager-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="highlight-manager-title"
    >
      <div class="dialog-title-row">
        <h2 id="highlight-manager-title">
          {{ t('Edit highlights') }}
        </h2>
        <button
          class="icon-button"
          type="button"
          :aria-label="t('Close dialog')"
          @click="closeHighlightManager"
        >
          <X :size="18" />
        </button>
      </div>
      <button
        class="button button-primary highlight-add-button"
        type="button"
        @click="startHighlightCollection"
      >
        <Plus :size="17" /> {{ t('Add new') }}
      </button>
      <div
        v-if="highlights.length"
        class="highlight-manager-list"
      >
        <div
          v-for="collection in highlights"
          :key="collection.id"
          class="highlight-manager-item"
        >
          <button
            class="highlight-manager-item-preview"
            type="button"
            @click="previewHighlightCollection(collection)"
          >
            <img
              v-if="collection.items[0]?.src"
              :src="collection.items[0].src"
              :alt="collection.items[0].name || t('Highlight image')"
            >
            <span
              v-else
              class="highlight-manager-placeholder"
              aria-hidden="true"
            >
              <ImagePlus :size="20" />
            </span>
            <span class="highlight-manager-item-copy">
              <strong>{{ collection.title }}</strong>
              <small>{{ collection.items.length }} {{ t('Photos') }} · {{ (collection.articleHighlights || []).length }} {{ t('Saved quotes') }}</small>
            </span>
            <ChevronRight
              :size="18"
              aria-hidden="true"
            />
          </button>
          <button
            class="button button-secondary highlight-manager-edit"
            type="button"
            @click="editHighlightCollection(collection)"
          >
            {{ t('Edit') }}
          </button>
        </div>
      </div>
      <p
        v-else
        class="empty-state highlight-manager-empty"
      >
        {{ t('No highlights yet') }}
      </p>
    </section>
  </div>

  <div
    v-if="highlightManagerView === 'preview' && highlightPreview"
    class="dialog-backdrop"
    @click.self="closeHighlightManager"
  >
    <section
      class="app-dialog surface-card highlight-preview-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="highlight-preview-title"
    >
      <div class="dialog-title-row">
        <h2 id="highlight-preview-title">
          {{ highlightPreview.title }}
        </h2>
        <button
          class="icon-button"
          type="button"
          :aria-label="t('Close dialog')"
          @click="closeHighlightManager"
        >
          <X :size="18" />
        </button>
      </div>
      <p class="highlight-preview-hint">
        {{ t('Preview') }}
      </p>
      <div
        v-if="highlightPreview.items.length"
        class="highlight-preview-gallery"
      >
        <figure
          v-for="image in highlightPreview.items"
          :key="image.id"
          class="highlight-preview-image"
        >
          <img
            :src="image.src"
            :alt="image.name || t('Highlight image')"
          >
          <figcaption v-if="image.name">
            {{ image.name }}
          </figcaption>
        </figure>
      </div>
      <blockquote
        v-for="quote in highlightPreview.articleHighlights || []"
        :key="quote.id"
        class="highlight-preview-quote"
      >
        <p>{{ quote.text }}</p><cite>{{ quote.articleTitle }}</cite>
      </blockquote>
      <div class="dialog-actions">
        <button
          class="button button-secondary"
          type="button"
          @click="openHighlightManager"
        >
          {{ t('Back') }}
        </button>
        <button
          class="button button-primary"
          type="button"
          @click="editHighlightCollection(highlightPreview)"
        >
          {{ t('Edit') }}
        </button>
      </div>
    </section>
  </div>

  <div
    v-if="highlightManagerView === 'editor' && highlightDraft"
    class="dialog-backdrop"
    @click.self="closeHighlightManager"
  >
    <section
      class="app-dialog surface-card highlight-editor-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="highlight-editor-title"
    >
      <div class="highlight-editor-heading">
        <button
          class="icon-button"
          type="button"
          :aria-label="t('Back to highlights')"
          :disabled="highlightPhotosLoading"
          @click="returnToHighlightList"
        >
          <ChevronLeft :size="19" />
        </button>
        <h2 id="highlight-editor-title">
          {{ t('Edit highlight collection') }}
        </h2>
        <button
          class="icon-button"
          type="button"
          :aria-label="t('Close dialog')"
          :disabled="highlightPhotosLoading"
          @click="closeHighlightManager"
        >
          <X :size="18" />
        </button>
      </div>
      <div class="highlight-cover-field">
        <strong>{{ t('Cover') }}</strong>
        <img
          v-if="highlightDraft.items[0]?.src"
          class="highlight-editor-cover"
          :src="highlightDraft.items[0].src"
          :alt="highlightDraft.items[0].name || t('Highlight image')"
        >
        <button
          v-else
          class="highlight-editor-cover highlight-editor-cover-empty"
          type="button"
          :disabled="highlightPhotosLoading"
          @click="highlightImageInput?.click()"
        >
          <ImagePlus :size="20" />
          {{ t('Add photos') }}
        </button>
      </div>
      <label class="highlight-title-field">
        <span>{{ t('Title') }}</span>
        <input
          v-model="highlightDraft.title"
          type="text"
          maxlength="80"
          :placeholder="t('Highlight title')"
          :disabled="highlightPhotosLoading"
        >
      </label>
      <div class="highlight-photo-heading">
        <strong>{{ t('Photos') }} ({{ highlightDraft.items.length }}/8)</strong>
        <button
          class="button button-secondary"
          type="button"
          :disabled="highlightPhotosLoading || highlightDraft.items.length >= 8"
          @click="highlightImageInput?.click()"
        >
          <Plus :size="16" /> {{ t('Add more') }}
        </button>
      </div>
      <div
        v-if="highlightDraft.items.length"
        class="highlight-editor-photos"
      >
        <div
          v-for="image in highlightDraft.items"
          :key="image.id"
          class="highlight-editor-photo"
        >
          <img
            :src="image.src"
            :alt="image.name || t('Highlight image')"
          >
          <button
            class="icon-button"
            type="button"
            :aria-label="`${t('Remove image')}: ${image.name || t('Highlight image')}`"
            :disabled="highlightPhotosLoading"
            @click="removeHighlightPhoto(image.id)"
          >
            <X :size="16" />
          </button>
        </div>
      </div>
      <p
        v-if="highlightPhotosLoading"
        class="highlight-photo-loading"
        role="status"
      >
        <LoadingDots /> {{ t('Reading photos...') }}
      </p>
      <input
        ref="highlightImageInput"
        class="visually-hidden"
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        @change="handleHighlightPhotos"
      >
      <div class="dialog-actions">
        <button
          class="button button-secondary"
          type="button"
          :disabled="highlightPhotosLoading"
          @click="returnToHighlightList"
        >
          {{ t('Cancel') }}
        </button>
        <button
          class="button button-primary"
          type="button"
          :disabled="highlightPhotosLoading || !highlightDraft.title.trim() || (!highlightDraft.items.length && !highlightDraft.articleHighlights.length)"
          @click="saveHighlightCollection"
        >
          {{ t('Save') }}
        </button>
      </div>
    </section>
  </div>

  <div
    v-if="dialog"
    class="dialog-backdrop"
    @click.self="closeDialog"
  >
    <section
      class="app-dialog surface-card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="`dialog-${dialog.type}-title`"
    >
      <div class="dialog-title-row">
        <h2 :id="`dialog-${dialog.type}-title`">
          {{ dialog.type === 'preview' ? 'Article preview' : dialog.type === 'discard' ? 'Discard draft?' : dialog.type === 'schedule' ? 'Schedule article' : 'Publish locally?' }}
        </h2><button
          class="icon-button"
          type="button"
          aria-label="Close dialog"
          @click="closeDialog"
        >
          <X :size="18" />
        </button>
      </div>
      <template v-if="selectedArticle">
        <template v-if="dialog.type === 'preview'">
          <h3>{{ getArticleTitle(selectedArticle) }}</h3><div
            class="rich-content"
            v-html="richTextToHtml(selectedArticle.body)"
          /><p class="dialog-note">
            Preview only. Your article remains saved in this browser.
          </p>
          <div class="dialog-actions">
            <button
              class="button button-secondary"
              type="button"
              @click="closeDialog"
            >
              Close
            </button><button
              class="button button-primary"
              type="button"
              @click="closeDialog(); openArticle(selectedArticle)"
            >
              Edit article
            </button>
          </div>
        </template>
        <template v-else-if="dialog.type === 'discard'">
          <p>Discard “{{ getArticleTitle(selectedArticle) }}”? This removes the draft from this browser.</p>
          <div class="dialog-actions">
            <button
              class="button button-secondary"
              type="button"
              @click="closeDialog"
            >
              Cancel
            </button><button
              class="button button-danger"
              type="button"
              @click="resolveDialog"
            >
              Discard draft
            </button>
          </div>
        </template>
        <template v-else-if="dialog.type === 'schedule'">
          <p>Choose a future time. Scheduling is stored locally and will not publish automatically.</p>
          <label class="field-label">Date and time<input
            v-model="scheduledAt"
            type="datetime-local"
          ></label>
          <div class="dialog-actions">
            <button
              class="button button-secondary"
              type="button"
              @click="closeDialog"
            >
              Cancel
            </button><button
              class="button button-primary"
              type="button"
              @click="resolveDialog"
            >
              Save schedule
            </button>
          </div>
        </template>
        <template v-else>
          <p>Save “{{ getArticleTitle(selectedArticle) }}” as published in this browser? This does not publish to a website or social network.</p>
          <div class="dialog-actions">
            <button
              class="button button-secondary"
              type="button"
              @click="closeDialog"
            >
              Cancel
            </button><button
              class="button button-primary"
              type="button"
              @click="resolveDialog"
            >
              <Check :size="16" /> Publish locally
            </button>
          </div>
        </template>
      </template>
    </section>
  </div>

  <div
    v-if="message"
    class="inline-toast"
    :class="`is-${messageTone}`"
    role="status"
  >
    {{ message }}
  </div>
</template>
