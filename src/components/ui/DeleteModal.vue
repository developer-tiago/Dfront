<script lang="ts" setup>
import { ref } from 'vue';

const props = defineProps<{
  id?: string | null;
  title: string;
  message: string;
  loading?: boolean;
}>();

const emit = defineEmits(['callback', 'close']);

const dialogRef = ref<HTMLDialogElement | null>(null);

function open() {
  const dialog = dialogRef.value;
  if (dialog && typeof dialog.showModal === 'function' && !dialog.open) {
    dialog.showModal();
  }
}

function close() {
  dialogRef.value?.close();
  emit('close');
}

function confirm() {
  emit('callback');
}

defineExpose({ open, close });
</script>

<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">{{ props.title }}</h3>
      <p class="py-4">{{ props.message }}</p>

      <div class="modal-action">
        <button type="button" class="btn btn-ghost btn-sm" @click="close" :disabled="props.loading">
          Cancelar
        </button>
        <button
          type="button"
          class="btn btn-error btn-sm"
          @click="confirm"
          :disabled="props.loading"
        >
          <span v-if="props.loading" class="loading loading-spinner loading-xs"></span>
          Confirmar
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close">close</button>
    </form>
  </dialog>
</template>
