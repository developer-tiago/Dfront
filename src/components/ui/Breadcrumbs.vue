<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

export interface BreadcrumbItem {
  label: string;
  to?: RouteLocationRaw;
  icon?: Component;
}

defineProps<{
  items: BreadcrumbItem[];
}>();
</script>

<template>
  <div class="breadcrumbs text-sm mb-4">
    <ul>
      <li v-for="(item, index) in items" :key="index">
        <router-link v-if="item.to" :to="item.to">
          <component v-if="item.icon" :is="item.icon" :size="16" />
          {{ item.label }}
        </router-link>
        <span v-else>
          <component v-if="item.icon" :is="item.icon" :size="16" class="me-2" />
          {{ item.label }}
        </span>
      </li>
    </ul>
  </div>
</template>
