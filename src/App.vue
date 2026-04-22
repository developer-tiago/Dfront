<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import ToastNotification from '@/components/ui/ToastNotification.vue';

const DEFAULT_TITLE = '';
const auth = useAuthStore();
const toastStore = useToastStore();
const route = useRoute();

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') || 'lofi';
  document.documentElement.setAttribute('data-theme', savedTheme);

  if (auth.access_token && !auth.user) {
    auth.fetchMe();
  }
});

watch(
  [() => route.fullPath, () => auth.account?.name],
  () => {
    if (route.name === 'PublicAppointmentCreate') {
      return;
    }
    const isProtectedRoute = route.matched.some((item) => item.meta.requiresAuth);

    if (isProtectedRoute) {
      document.title = auth.user?.account_name || DEFAULT_TITLE;
      return;
    }

    document.title = DEFAULT_TITLE;
  },
  { immediate: true }
);
</script>

<template>
  <ToastNotification
    :show="toastStore.show"
    :message="toastStore.message"
    :type="toastStore.type"
  />
  <router-view />
</template>
