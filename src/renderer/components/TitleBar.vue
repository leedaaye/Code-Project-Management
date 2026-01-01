<script setup lang="ts">
function minimize() {
  window.electronAPI.minimize()
}

function maximize() {
  window.electronAPI.maximize()
}

function close() {
  window.electronAPI.close()
}
</script>

<template>
  <div class="title-bar">
    <div class="window-controls">
      <button class="window-btn close" @click="close" title="关闭"></button>
      <button class="window-btn minimize" @click="minimize" title="最小化"></button>
      <button class="window-btn maximize" @click="maximize" title="最大化"></button>
    </div>
    <span class="title-bar-title">Code Project Manager</span>
    <div style="width: 60px;"></div>
  </div>
</template>
