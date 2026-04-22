<script setup lang="ts">
defineProps<{
  paddingY: number;
}>();
</script>

<template>
  <div
    class="flex items-center justify-center"
    :style="{ paddingTop: `${paddingY}px`, paddingBottom: `${paddingY}px` }"
  >
    <span class="loading loading-spinner loading-lg"></span>
  </div>
</template>
