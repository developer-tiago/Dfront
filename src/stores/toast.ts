import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export const useToastStore = defineStore('toast', () => {
  const show = ref(false);
  const message = ref('');
  const type = ref<ToastType>('info');
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function triggerToast(msg: string, toastType: ToastType = 'info', duration = 3000) {
    message.value = msg;
    type.value = toastType;
    show.value = true;

    if (timeoutId) clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      show.value = false;
    }, duration);
  }

  return {
    show,
    message,
    type,
    triggerToast,
  };
});
