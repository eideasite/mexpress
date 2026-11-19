<script setup>
import { ref } from 'vue'
import { Search } from 'lucide-vue-next'
import LoadingDots from './LoadingDots.vue'
import {
  aiSearchQuery,
  googleSearchMode,
  openGoogleAiModeSearch,
  openGoogleWebSearch,
} from '../../services/aiSearch.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  errorLabel: {
    type: String,
    required: true,
  },
  submitLabel: {
    type: String,
    required: true,
  },
  successLabel: {
    type: String,
    required: true,
  },
  webSuccessLabel: {
    type: String,
    required: true,
  },
  loadingLabel: {
    type: String,
    required: true,
  },
  modeLabel: {
    type: String,
    required: true,
  },
  aiModeLabel: {
    type: String,
    required: true,
  },
  webModeLabel: {
    type: String,
    required: true,
  },
})

const query = aiSearchQuery
const mode = googleSearchMode
const searching = ref(false)
const searchError = ref('')
const searchStatus = ref('')

function openGoogleSearchForMode() {
  if (searching.value) return
  const searchQuery = query.value
  if (!searchQuery.trim()) return

  searching.value = true
  searchError.value = ''
  searchStatus.value = ''
  try {
    const opened = mode.value === 'web'
      ? openGoogleWebSearch(searchQuery)
      : openGoogleAiModeSearch(searchQuery)
    if (opened) {
      query.value = ''
      searchStatus.value = mode.value === 'web' ? props.webSuccessLabel : props.successLabel
    } else {
      searchError.value = props.errorLabel
    }
  } catch {
    searchError.value = props.errorLabel
  } finally {
    searching.value = false
  }
}

function submitSearch() {
  if (!query.value.trim() || searching.value) return
  openGoogleSearchForMode()
}
</script>

<template>
  <form
    v-bind="$attrs"
    class="header-search"
    role="search"
    :aria-busy="searching"
    @submit.prevent="submitSearch"
  >
    <Search
      :size="18"
      aria-hidden="true"
    />
    <button
      class="global-search-mode-toggle"
      :class="{ 'is-on': mode === 'ai' }"
      type="button"
      role="switch"
      :aria-checked="mode === 'ai'"
      :aria-label="props.modeLabel"
      :disabled="searching"
      @click="mode = mode === 'ai' ? 'web' : 'ai'"
    >
      <span class="global-search-mode-track" aria-hidden="true">
        <span class="global-search-mode-thumb" />
      </span>
      <span>{{ mode === 'ai' ? props.aiModeLabel : props.webModeLabel }}</span>
    </button>
    <input
      v-model="query"
      :aria-label="props.label"
      :placeholder="props.label"
      :disabled="searching"
    >
    <button
      class="search-submit ai-hover-button"
      type="submit"
      :disabled="searching || !query.trim()"
    >
      <template v-if="searching">
        {{ props.loadingLabel }}
        <LoadingDots />
      </template>
      <template v-else>
        {{ props.submitLabel }}
      </template>
    </button>
    <span
      v-if="searchError || searchStatus"
      class="header-search-message"
      :class="{ 'has-error': searchError }"
      :role="searchError ? 'alert' : 'status'"
    >
      {{ searchError || searchStatus }}
    </span>
  </form>
</template>
