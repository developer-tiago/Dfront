<script setup lang="ts">
import { ref } from 'vue';

const suggestModalRef = ref<HTMLDialogElement | null>(null);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function open() {
  suggestModalRef.value?.showModal();
}

function close() {
  suggestModalRef.value?.close();
}

defineExpose({
  open,
  close
});
</script>

<template>
  <dialog ref="suggestModalRef" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">Agendamento Encontrado</h3>
      <p class="py-4">
        Identificamos que você já possui um agendamento. Gostaria de agendar no mesmo dia que já tem agendado?
      </p>
      <div class="modal-action">
        <button type="button" class="btn btn-ghost" @click="emit('cancel')">
          Não, continuar normalmente
        </button>
        <button type="button" class="btn btn-success" @click="emit('confirm')">
          Sim, agendar no mesmo dia
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close()">close</button>
    </form>
  </dialog>
</template>
