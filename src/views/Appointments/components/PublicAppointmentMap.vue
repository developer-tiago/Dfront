<script setup lang="ts">
defineProps<{
  hasAddress: boolean;
  mapQuery: string;
}>();
</script>

<template>
  <div
    v-if="hasAddress"
    class="mt-8 rounded-box overflow-hidden border border-base-300"
  >
    <iframe
      :src="`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`"
      width="100%"
      height="350"
      style="border: 0"
      loading="lazy"
    ></iframe>
  </div>
</template>
