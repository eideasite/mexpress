<script setup>
import { nextTick, ref } from 'vue'
import { Pencil, Search, X } from 'lucide-vue-next'
import LoadingDots from './LoadingDots.vue'
import {
  aiSearchQuery,
  lastSubmittedGoogleSearchQuery,
  openGoogleAiModeSearch,
} from '../../services/aiSearch.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  clearLabel: {
    type: String,
    required: true,
  },
  editLabel: {
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
  loadingLabel: {
    type: String,
    required: true,
  },
})

const query = aiSearchQuery
const searching = ref(false)
const searchError = ref('')
const searchStatus = ref('')
const searchInput = ref(null)

function focusSearchInput() {
  nextTick(() => searchInput.value?.focus())
}

function clearSearchQuery() {
  if (searching.value) return
  query.value = ''
  searchError.value = ''
  searchStatus.value = ''
  focusSearchInput()
}

function editSearchQuery() {
  if (searching.value) return
  if (!query.value.trim() && lastSubmittedGoogleSearchQuery.value) {
    query.value = lastSubmittedGoogleSearchQuery.value
  }
  searchError.value = ''
  searchStatus.value = ''
  focusSearchInput()
}

function openGoogleSearch() {
  if (searching.value) return
  const searchQuery = query.value
  if (!searchQuery.trim()) return

  searching.value = true
  searchError.value = ''
  searchStatus.value = ''
  try {
    const opened = openGoogleAiModeSearch(searchQuery)
    if (opened) {
      lastSubmittedGoogleSearchQuery.value = searchQuery
      query.value = ''
      searchStatus.value = props.successLabel
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
  openGoogleSearch()
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
    <input
      ref="searchInput"
      v-model="query"
      :aria-label="props.label"
      :placeholder="props.label"
      :disabled="searching"
    >
    <button
      v-if="query"
      class="search-query-action"
      type="button"
      :aria-label="props.clearLabel"
      :title="props.clearLabel"
      :disabled="searching || !query"
      @click="clearSearchQuery"
    >
      <X
        :size="17"
        aria-hidden="true"
      />
    </button>
    <button
      class="search-query-action"
      type="button"
      :aria-label="props.editLabel"
      :title="props.editLabel"
      :disabled="searching || (!query.trim() && !lastSubmittedGoogleSearchQuery)"
      @click="editSearchQuery"
    >
      <Pencil
        :size="16"
        aria-hidden="true"
      />
    </button>
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
