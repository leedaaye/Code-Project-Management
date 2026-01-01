<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'vscode'">
      <rect x="3" y="4" width="14" height="10" rx="1.5" />
      <path d="M6 17h8M10 14v3" />
    </template>
    <template v-else-if="name === 'terminal'">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <path d="M5 8l3 2-3 2M10 12h5" />
    </template>
    <template v-else-if="name === 'folder'">
      <path d="M3 6a2 2 0 012-2h3l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" />
    </template>
    <template v-else-if="name === 'pin'">
      <path d="M12 2v5l2 2v2H6v-2l2-2V2" />
      <path d="M10 11v7" />
      <circle cx="10" cy="2" r="1" fill="currentColor" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 16V10M10 16V4M16 16v-5" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M4 5h12M6 5v11a2 2 0 002 2h4a2 2 0 002-2V5M8 5V3h4v2" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="9" cy="9" r="5" />
      <path d="M13 13l4 4" />
    </template>
    <template v-else-if="name === 'refresh'">
      <path d="M17 3v5h-5M3 17v-5h5" />
      <path d="M3 8a7 7 0 0113.5-2M17 12a7 7 0 01-13.5 2" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M10 4v12M4 10h12" />
    </template>
    <template v-else-if="name === 'folder-open'">
      <path d="M3 7a2 2 0 012-2h3l2 2h6a2 2 0 012 2v1H3V7z" />
      <path d="M3 10h14l-2 7H5l-2-7z" />
    </template>
    <template v-else-if="name === 'git-branch'">
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="14" r="2" />
      <circle cx="14" cy="10" r="2" />
      <path d="M6 8v4M12 10H8c0-2 0-4 0-4" />
    </template>
    <template v-else-if="name === 'calendar'">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M7 2v4M13 2v4M3 9h14" />
    </template>
    <template v-else-if="name === 'briefcase'">
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <path d="M7 7V5a2 2 0 012-2h2a2 2 0 012 2v2M2 11h16" />
    </template>
    <template v-else-if="name === 'home'">
      <path d="M3 10l7-7 7 7v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" />
      <path d="M8 19v-6h4v6" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M4 4a2 2 0 012-2h10v16H6a2 2 0 01-2-2V4z" />
      <path d="M4 14h12M8 2v12" />
    </template>
    <template v-else-if="name === 'check'">
      <path d="M4 10l4 4 8-8" />
    </template>
    <template v-else-if="name === 'chevron-right'">
      <path d="M8 5l5 5-5 5" />
    </template>
    <template v-else-if="name === 'tag'">
      <path d="M4 4v6l8 8 6-6-8-8H4zM7 7h.01" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M12 3l5 5-9 9H3v-5l9-9z" />
    </template>
    <template v-else-if="name === 'x'">
      <path d="M5 5l10 10M15 5L5 15" />
    </template>
  </svg>
</template>

<style scoped>
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
  display: inline-block;
  flex-shrink: 0;
}
</style>
