<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  Archive,
  Bookmark,
  Check,
  ChevronLeft,
  Copy,
  Download,
  ExternalLink,
  FileText,
  House,
  Info,
  Mail,
  Menu,
  Moon,
  PenLine,
  Search,
  Settings,
  Sun,
  UserRound,
  X,
  Wifi,
} from 'lucide-vue-next'
import { useWorkspace } from './stores/workspace.js'
import { getWorkspaceRecoveryData } from './services/articleStorage.js'
import { requestPersistentBrowserStorage } from './services/browserStorage.js'
import { runNetworkSpeedTest } from './services/networkSpeedTest.js'
import { translate } from './i18n.js'
import GoogleAiSearch from './components/common/GoogleAiSearch.vue'
import ProfileAvatar from './components/common/ProfileAvatar.vue'

const route = useRoute()
const router = useRouter()
const { workspace, posts, saveStatus, theme, language, recoveryState, sessionStatus, setSessionStatus } = useWorkspace()
const mobileMenuOpen = ref(false)
const contactUrl = 'https://jmsitenew.vercel.app/'
const contactUrlCopied = ref(false)
const contactUrlCopyFailed = ref(false)
const mobileMenuButton = ref(null)
const mobileNavigationElement = ref(null)
const networkDetailsOpen = ref(false)
const errorNotice = ref(null)
const clock = ref('')
const online = ref(navigator.onLine)
const networkTest = ref(null)
const browserStorageStatus = ref('checking')
const connectionInfo = ref(readConnectionInfo())
let clockTimer
let noticeTimer
let networkAbortController
let bodyOverflowBeforeMobileMenu = null

const navItems = [
  { name: 'compose', label: 'Write a Post', icon: House },
  { name: 'editor', label: 'Article Editor', icon: PenLine },
  { name: 'articles', label: 'Articles Management', icon: FileText },
  { name: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  { name: 'archive', label: 'Archive', icon: Archive },
  { name: 'backup', label: 'Backup and restore', icon: Download },
  { name: 'profile', label: 'Profile', icon: Settings },
]
const pageTitle = computed(() => translate(route.meta.title || 'Jeyamohan Articles', language.value))
const profileName = computed(() => workspace.value.profile.name || 'Jeyamohan')
const t = (text) => translate(text, language.value)
const pendingSyncCount = computed(() => posts.value.filter((post) => post.syncStatus === 'pending').length)

async function copyContactUrl() {
  contactUrlCopied.value = false
  contactUrlCopyFailed.value = false
  try {
    await navigator.clipboard?.writeText(contactUrl)
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    contactUrlCopied.value = true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = contactUrl
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    try {
      contactUrlCopied.value = document.execCommand('copy')
      contactUrlCopyFailed.value = !contactUrlCopied.value
    } catch {
      contactUrlCopyFailed.value = true
    } finally {
      textarea.remove()
    }
  }
}
const browserStorageStatusLabel = computed(() => ({
  checking: 'Checking storage protection',
  persistent: 'Protected from automatic cleanup',
  'best-effort': 'May be cleared by browser',
  unsupported: 'Browser cleanup protection unavailable',
  unavailable: 'Could not check storage protection',
}[browserStorageStatus.value]))
const browserStorageStatusDescription = computed(() => browserStorageStatus.value === 'persistent'
  ? 'Persistent storage is enabled. Clearing site data, uninstalling the browser, or losing this device can still remove these files.'
  : 'Data is saved on this browser and device. Browser cleanup, clearing site data, uninstalling the browser, or losing this device can remove it.')
const networkQuality = computed(() => {
  if (!online.value) return 'offline'
  const speed = networkTest.value?.status === 'success'
    ? networkTest.value.downloadMbps
    : connectionInfo.value.downlink
  if (typeof speed === 'number' && Number.isFinite(speed)) {
    if (speed < 1) return 'weak'
    if (speed < 5) return 'okay'
    if (speed < 25) return 'good'
    return 'fast'
  }
  if (connectionInfo.value.effectiveType === 'slow-2g' || connectionInfo.value.effectiveType === '2g') return 'weak'
  if (connectionInfo.value.effectiveType === '3g') return 'okay'
  if (connectionInfo.value.effectiveType === '4g') return 'good'
  return 'unknown'
})
const networkQualityLabel = computed(() => ({
  weak: 'Weak connection',
  okay: 'Okay connection',
  good: 'Good connection',
  fast: 'Fast connection',
  offline: 'Offline',
  unknown: 'Connection quality unavailable',
}[networkQuality.value]))
const connectionLabel = computed(() => {
  if (!online.value) return 'Offline'
  if (networkQuality.value !== 'unknown') return networkQualityLabel.value
  return 'Connected'
})

function readConnectionInfo() {
  const connection = navigator.connection
  return {
    effectiveType: typeof connection?.effectiveType === 'string' ? connection.effectiveType : '',
    downlink: Number.isFinite(connection?.downlink) ? connection.downlink : null,
  }
}

function updateClock() {
  clock.value = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date())
}

function onOnlineChange() {
  online.value = navigator.onLine
  connectionInfo.value = readConnectionInfo()
}

function onConnectionInfoChange() {
  connectionInfo.value = readConnectionInfo()
}

function onAppError(event) {
  errorNotice.value = event.detail || { title: 'Something went wrong', message: 'Please try again.' }
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => { errorNotice.value = null }, 6000)
}

function navigateTo(name) {
  mobileMenuOpen.value = false
  router.push({ name })
}

function handleMobileNavigationKeydown(event) {
  if (event.key === 'Escape') {
    mobileMenuOpen.value = false
    return
  }
  if (event.key !== 'Tab') return

  const focusableElements = [...(mobileNavigationElement.value?.querySelectorAll('a[href], button:not([disabled])') || [])]
  if (!focusableElements.length) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

watch(mobileMenuOpen, async (isOpen) => {
  if (isOpen) {
    bodyOverflowBeforeMobileMenu = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleMobileNavigationKeydown)
    await nextTick()
    mobileNavigationElement.value?.querySelector('button')?.focus()
    return
  }

  window.removeEventListener('keydown', handleMobileNavigationKeydown)
  if (bodyOverflowBeforeMobileMenu !== null) {
    document.body.style.overflow = bodyOverflowBeforeMobileMenu
    bodyOverflowBeforeMobileMenu = null
  }
  await nextTick()
  mobileMenuButton.value?.focus()
})

function navigateBack() {
  mobileMenuOpen.value = false
  if (typeof window.history.state?.back === 'string' && window.history.state.back) {
    router.back()
    return
  }
  router.replace({ name: 'compose' })
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

async function testConnection() {
  if (networkTest.value?.status === 'running') return
  networkAbortController?.abort()
  networkAbortController = new AbortController()
  networkTest.value = { status: 'running' }
  try {
    const result = await runNetworkSpeedTest(networkAbortController.signal)
    networkTest.value = { status: 'success', ...result }
  } catch (error) {
    if (error?.name === 'AbortError') return
    networkTest.value = { status: 'error', message: error?.message || 'Live speed test unavailable.' }
  }
}

function downloadRecoveryCopy() {
  const data = getWorkspaceRecoveryData()
  if (typeof data !== 'string') {
    onAppError({ detail: { title: 'Recovery copy unavailable', message: 'Could not read the workspace recovery data.' } })
    return
  }
  const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `jeyamohan-workspace-recovery-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

onMounted(() => {
  requestPersistentBrowserStorage().then((status) => {
    browserStorageStatus.value = status
  })
  updateClock()
  clockTimer = window.setInterval(updateClock, 30000)
  window.addEventListener('online', onOnlineChange)
  window.addEventListener('offline', onOnlineChange)
  window.addEventListener('jeyamohan:app-error', onAppError)
  navigator.connection?.addEventListener?.('change', onConnectionInfoChange)
})

onUnmounted(() => {
  networkAbortController?.abort()
  window.clearInterval(clockTimer)
  window.clearTimeout(noticeTimer)
  window.removeEventListener('keydown', handleMobileNavigationKeydown)
  if (bodyOverflowBeforeMobileMenu !== null) document.body.style.overflow = bodyOverflowBeforeMobileMenu
  window.removeEventListener('online', onOnlineChange)
  window.removeEventListener('offline', onOnlineChange)
  window.removeEventListener('jeyamohan:app-error', onAppError)
  navigator.connection?.removeEventListener?.('change', onConnectionInfoChange)
})
</script>

<template>
  <main
    v-if="sessionStatus !== 'active'"
    class="local-session-screen"
  >
    <section class="local-session-card surface-card">
      <ProfileAvatar
        :profile="workspace.profile"
        size="large"
      />
      <p class="eyebrow">
        Jeyamohan Articles
      </p>
      <h1>{{ sessionStatus === 'signed-out' ? 'You are signed out' : 'Writing space locked' }}</h1>
      <p>{{ sessionStatus === 'signed-out' ? 'Your articles and posts remain saved in this browser.' : 'This local lock hides the page only; it does not protect browser data.' }}</p>
      <button
        class="button button-primary"
        type="button"
        @click="setSessionStatus('active')"
      >
        {{ sessionStatus === 'signed-out' ? `Continue as ${profileName}` : 'Unlock writing space' }}
      </button>
      <small>This profile works locally in this browser and is not connected to an online account.</small>
    </section>
  </main>
  <div
    v-else
    class="app-shell"
    :class="{ 'is-dark': theme === 'dark' }"
  >
    <header class="app-header">
      <button
        v-if="route.name !== 'compose'"
        class="icon-button mobile-back-button"
        type="button"
        :aria-label="t('Back')"
        @click="navigateBack"
      >
        <ChevronLeft
          :size="20"
          aria-hidden="true"
        />
      </button>
      <button
        ref="mobileMenuButton"
        class="icon-button mobile-menu-button"
        type="button"
        :aria-label="t(mobileMenuOpen ? 'Close navigation' : 'Open navigation')"
        aria-controls="mobile-navigation"
        :aria-expanded="mobileMenuOpen"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <Menu
          v-if="!mobileMenuOpen"
          :size="20"
        />
        <X
          v-else
          :size="20"
        />
      </button>
      <RouterLink
        class="brand"
        :to="{ name: 'compose' }"
        aria-label="Jeyamohan Articles home"
      >
        <span class="brand-mark">ஜெ</span>
        <span class="brand-copy">        <strong>Jeyamohan</strong><small>{{ t('Personal writing space') }}</small></span>
      </RouterLink>
      <GoogleAiSearch
        class="desktop-google-search"
        :label="t('Search Google AI')"
        :error-label="t('Could not open Google AI Mode. Allow pop-ups, then try again.')"
        :loading-label="t('Opening Google AI Mode...')"
        :success-label="t('Opened Google AI Mode with your query.')"
        :submit-label="t('Search Google AI')"
      />
      <div class="header-tools">
        <span class="header-greeting">{{ profileName }}</span>
        <select
          v-model="language"
          class="language-select"
          :aria-label="t('Choose language')"
        >
          <option value="en">
            English
          </option>
          <option value="ta">
            தமிழ்
          </option>
        </select>
        <button
          class="icon-button"
          type="button"
          :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <Sun
            v-if="theme === 'dark'"
            :size="19"
          />
          <Moon
            v-else
            :size="19"
          />
        </button>
        <button
          class="profile-button"
          type="button"
          :aria-label="t('Profile')"
          @click="navigateTo('profile')"
        >
          <ProfileAvatar :profile="workspace.profile" />
          <span class="profile-button-name">{{ profileName }}</span>
        </button>
      </div>
    </header>

    <div
      class="status-strip"
      role="status"
      aria-live="polite"
    >
      <span class="status-time">{{ clock }}</span>
      <span class="status-divider">·</span>
      <button
        class="status-connection"
        :class="[`quality-${networkQuality}`, { 'is-animated': networkDetailsOpen || networkTest?.status === 'running' }]"
        type="button"
        :aria-expanded="networkDetailsOpen"
        aria-controls="network-details"
        @click="networkDetailsOpen = !networkDetailsOpen"
      >
        <span class="status-dot" />
        <Wifi
          v-if="online"
          :size="14"
          aria-hidden="true"
        />
        <span>{{ t(connectionLabel) }}</span>
        <Info
          :size="14"
          aria-hidden="true"
        />
      </button>
      <span
        v-if="networkTest?.status === 'success'"
        class="status-detail status-detail-speed"
      >{{ networkTest.downloadMbps }} Mbps · {{ networkTest.latencyMs }} ms</span>
      <span
        v-else-if="networkTest?.status === 'error'"
        class="status-detail status-detail-error"
      >{{ networkTest.message }}</span>
      <span
        v-else
        class="status-detail"
      >{{ online ? 'Network status' : 'Local edits are still available' }}</span>
      <button
        v-if="online"
        class="status-test-button"
        type="button"
        :disabled="networkTest?.status === 'running'"
        @click="testConnection"
      >
        {{ networkTest?.status === 'running' ? 'Testing…' : t('Run speed test') }}
      </button>
      <span
        class="status-save"
        :title="t(browserStorageStatusDescription)"
      >
        <span>{{ t(saveStatus === 'saving' ? 'Saving draft...' : saveStatus === 'saved' ? 'Saved in this browser' : saveStatus === 'conflict' ? 'Another tab changed this workspace.' : 'Could not save') }}</span>
        <span aria-live="polite">· {{ t(browserStorageStatusLabel) }}</span>
      </span>
    </div>

    <section
      v-if="networkDetailsOpen"
      id="network-details"
      class="network-details surface-card"
      :aria-label="t('Network status details')"
    >
      <div class="network-details-header">
        <div>
          <strong>{{ t('Network status') }}</strong>
          <small>{{ t(networkQualityLabel) }}</small>
        </div>
        <button
          class="icon-button"
          type="button"
          :aria-label="t('Close network details')"
          @click="networkDetailsOpen = false"
        >
          <X
            :size="17"
          />
        </button>
      </div>
      <div class="network-metrics">
        <div>
          <small>{{ t('Download speed') }}</small>
          <strong>{{ networkTest?.status === 'success' ? `${networkTest.downloadMbps} Mbps` : t('Not measured') }}</strong>
        </div>
        <div v-if="networkTest?.status === 'success'">
          <small>{{ t('Latency') }}</small>
          <strong>{{ networkTest.latencyMs }} ms</strong>
        </div>
      </div>
      <p class="network-disclaimer">
        {{ t("Speed tests use a temporary sample. Websites cannot read your device's cellular signal bars.") }}
      </p>
      <p
        v-if="pendingSyncCount"
        class="network-sync-note"
      >
        {{ pendingSyncCount }}
        {{ t(pendingSyncCount === 1 ? 'post is saved locally and waiting to sync.' : 'posts are saved locally and waiting to sync.') }}
        {{ t('No upload server is connected yet; your local copy stays safe.') }}
      </p>
      <p
        v-else
        class="network-sync-note"
      >
        {{ t('Posts are saved in this browser. Cloud upload is not configured.') }}
      </p>
      <p
        v-if="networkTest?.status === 'error'"
        class="network-error"
      >
        {{ networkTest.message }}
      </p>
    </section>

    <div class="app-body">
      <aside
        class="desktop-navigation"
        aria-label="Main navigation"
      >
        <button
          class="sidebar-profile"
          type="button"
          @click="navigateTo('profile')"
        >
          <ProfileAvatar
            :profile="workspace.profile"
            size="large"
          />
          <span><strong>{{ profileName }}</strong><small>Profile account</small></span>
          <UserRound :size="17" />
        </button>
        <nav>
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="nav-link"
            :class="{ active: route.name === item.name }"
          >
            <component
              :is="item.icon"
              :size="18"
            />
            <span>{{ t(item.label) }}</span>
          </RouterLink>
          <RouterLink
            :to="{ name: 'external-ai-tools' }"
            class="nav-link"
            :class="{ active: route.name === 'external-ai-tools' }"
          >
            <Search :size="18" /><span>{{ t('Multi-AI Search') }}</span>
          </RouterLink>
        </nav>
        <div class="sidebar-save-state">
          <span
            class="status-dot"
            :class="{ offline: saveStatus === 'error' }"
          />
          {{ saveStatus === 'saving' ? 'Saving draft…' : saveStatus === 'saved' ? 'Saved in this browser' : 'Check save status' }}
        </div>
      </aside>

      <div
        v-if="mobileMenuOpen"
        class="mobile-navigation-backdrop"
        @click.self="mobileMenuOpen = false"
      >
        <div
          id="mobile-navigation"
          ref="mobileNavigationElement"
          class="mobile-navigation"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-heading"
          tabindex="-1"
        >
          <div class="mobile-navigation-title">
            <strong id="mobile-navigation-heading">{{ t('Navigation') }}</strong><button
              class="icon-button"
              type="button"
              :aria-label="t('Close navigation')"
              @click="mobileMenuOpen = false"
            >
              <X :size="20" />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            <RouterLink
              v-for="item in navItems"
              :key="item.name"
              :to="{ name: item.name }"
              class="nav-link"
              :class="{ active: route.name === item.name }"
              @click="mobileMenuOpen = false"
            >
              <component
                :is="item.icon"
                :size="18"
              />
              <span>{{ t(item.label) }}</span>
            </RouterLink>
            <RouterLink
              :to="{ name: 'external-ai-tools' }"
              class="nav-link"
              @click="mobileMenuOpen = false"
            >
              <Search :size="18" /><span>{{ t('Multi-AI Search') }}</span>
            </RouterLink>
          </nav>
        </div>
      </div>

      <main class="app-main">
        <GoogleAiSearch
          v-if="route.name === 'compose'"
          class="mobile-home-search"
          :label="t('Search Google AI')"
          :error-label="t('Could not open Google AI Mode. Allow pop-ups, then try again.')"
          :loading-label="t('Opening Google AI Mode...')"
          :success-label="t('Opened Google AI Mode with your query.')"
          :submit-label="t('Search Google AI')"
        />
        <div
          v-if="route.name !== 'compose' && route.name !== 'privacy-policy'"
          class="mobile-page-title"
        >
          <span class="brand-mark">ஜெ</span><strong>{{ pageTitle }}</strong>
        </div>
        <section
          v-if="recoveryState"
          class="recovery-notice"
          role="status"
        >
          <div><strong>{{ recoveryState === 'blocked' ? 'Workspace data could not be saved safely.' : 'A recovery copy was preserved.' }}</strong><p>Download the recovery copy before reviewing or clearing browser data.</p></div>
          <button
            class="button button-secondary"
            type="button"
            @click="downloadRecoveryCopy"
          >
            Download recovery data
          </button>
        </section>
        <RouterView />
        <footer class="app-footer">
          <div class="footer-inner">
            <div class="footer-contact-group">
              <div class="footer-contact-row">
                <span class="footer-contact-label">{{ t('Contact us:') }}</span>
                <a
                  :href="contactUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ contactUrl }} <ExternalLink
                    :size="14"
                    aria-hidden="true"
                  />
                </a>
                <button
                  class="footer-copy-button"
                  type="button"
                  :aria-label="t(contactUrlCopied ? 'Contact URL copied' : 'Copy contact URL')"
                  :title="t(contactUrlCopied ? 'Copied' : 'Copy contact URL')"
                  @click="copyContactUrl"
                >
                  <Check
                    v-if="contactUrlCopied"
                    :size="16"
                    aria-hidden="true"
                  />
                  <Copy
                    v-else
                    :size="16"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <span
                v-if="contactUrlCopyFailed"
                class="footer-copy-status"
                role="status"
              >{{ t('Copy failed. Select the contact URL to copy it.') }}</span>
              <span
                v-else-if="contactUrlCopied"
                class="footer-copy-status"
                role="status"
              >{{ t('Contact URL copied') }}</span>
            </div>
            <nav
              class="footer-links-row"
              :aria-label="t('Footer links')"
            >
              <a
                class="footer-email-link"
                href="mailto:jeyamohan98@gmail.com"
              >
                <Mail
                  :size="14"
                  aria-hidden="true"
                />
                {{ t('Email') }}: jeyamohan98@gmail.com
              </a>
              <RouterLink
                class="footer-policy-link"
                :to="{ name: 'privacy-policy' }"
              >{{ t('Privacy Policy') }}</RouterLink>
            </nav>
            <span class="footer-copyright">© {{ new Date().getFullYear() }} Jeyamohan Manoharan. {{ t('All rights reserved.') }}</span>
          </div>
        </footer>
      </main>
    </div>

    <div
      v-if="errorNotice"
      class="error-toast"
      role="alert"
    >
      <strong>{{ errorNotice.title }}</strong>
      <span>{{ errorNotice.message }}</span>
      <button
        class="icon-button"
        type="button"
        aria-label="Dismiss error"
        @click="errorNotice = null"
      >
        <X :size="16" />
      </button>
    </div>
  </div>
</template>
