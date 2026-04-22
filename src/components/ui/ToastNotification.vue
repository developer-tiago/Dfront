<script setup lang="ts">
import { computed } from 'vue';
import { PhCheckCircle, PhWarning, PhXCircle, PhInfo } from '@phosphor-icons/vue';

const props = withDefaults(
  defineProps<{
    show: boolean;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
  }>(),
  {
    type: 'info',
    show: false,
  }
);

const alertClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'alert-success text-white';
    case 'error':
      return 'alert-error text-white';
    case 'warning':
      return 'alert-warning';
    case 'info':
      return 'alert-info text-white';
    default:
      return 'alert-info text-white';
  }
});
</script>

<template>
  <div v-if="show" class="toast toast-top toast-center z-[9999]">
    <div class="alert shadow-lg" :class="alertClass">
      <PhCheckCircle v-if="type === 'success'" size="24" weight="fill" />
      <PhXCircle v-else-if="type === 'error'" size="24" weight="fill" />
      <PhWarning v-else-if="type === 'warning'" size="24" weight="fill" />
      <PhInfo v-else size="24" weight="fill" />
      <span>{{ message }}</span>
    </div>
  </div>
</template>
