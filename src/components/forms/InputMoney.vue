<script lang="ts" setup>
import { Money3Component } from 'v-money3';
import { computed } from 'vue';

const model = defineModel<number>({ default: 0 });

const internalModel = computed({
  get: () => model.value,
  set: (value) => {
    model.value = typeof value === 'string' ? parseFloat(value) || 0 : value;
  },
});

const config = {
  locale: 'pt-BR',
  currency: 'BRL',
  precision: 2,
  autoDecimalMode: true,
  allowNegative: false,
  prefix: 'R$ ',
  suffix: '',
  thousands: '.',
  decimal: ',',
  disableNegative: false,
  disabled: false,
  allowBlank: false,
  minimumNumberOfCharacters: 0,
  shouldRound: true,
  focusOnRight: false,
};
</script>

<template>
  <Money3Component v-model="internalModel" class="input input-sm w-full" v-bind="config" />
</template>
