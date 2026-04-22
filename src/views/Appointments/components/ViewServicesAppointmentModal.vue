<script setup lang="ts">
import { computed, watch, ref } from "vue";
import type {
  Appointment,
  EditableAppointmentItem,
  AppointmentItemStatus,
} from "@/types";
import { getAppointmentStatusMeta } from "@/utils";

const props = defineProps<{
  title: string;
  appointment: Appointment | null;
  loading?: boolean;
}>();

const emit = defineEmits(["callback", "close"]);

const dialogRef = ref<HTMLDialogElement | null>(null);
const editableItems = ref<EditableAppointmentItem[]>([]);

const hasItems = computed(() => editableItems.value.length > 0);

watch(
  () => props.appointment,
  (value) => {
    editableItems.value = Array.isArray(value?.items)
      ? value.items
          .filter(
            (
              item,
            ): item is {
              id: string;
              service_id: string;
              status?: AppointmentItemStatus;
              service?: EditableAppointmentItem["service"];
            } => !!item.id && !!item.service_id,
          )
          .map((item) => ({
            id: item.id,
            service_id: item.service_id,
            status: item.status ?? "pending",
            service: item.service,
          }))
      : [];
  },
  { immediate: true },
);

function open() {
  const dialog = dialogRef.value;
  if (dialog && typeof dialog.showModal === "function" && !dialog.open) {
    dialog.showModal();
  }
}

function close() {
  dialogRef.value?.close();
  emit("close");
}

function onChangeItemStatus(itemId: string, status: AppointmentItemStatus) {
  const target = editableItems.value.find((item) => item.id === itemId);
  if (!target) return;

  target.status = status;
}

function confirm() {
  emit("callback", editableItems.value);
}

defineExpose({ open, close });
</script>

<template>
  <dialog ref="dialogRef" class="modal">
    <div class="modal-box max-w-3xl">
      <h3 class="font-bold text-lg">{{ props.title }}</h3>

      <div class="mt-4 space-y-3" v-if="hasItems">
        <div
          v-for="item in editableItems"
          :key="item.id"
          class="border border-base-300 rounded-box p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
        >
          <div>
            <p class="text-xs text-base-content/70 break-all">
              {{ item.service?.name }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <span
              class="badge badge-soft"
              :class="getAppointmentStatusMeta(item.status).badgeClass"
            >
              {{ getAppointmentStatusMeta(item.status).label }}
            </span>

            <select
              class="select select-bordered select-sm"
              :value="item.status"
              :disabled="props.loading"
              @change="
                onChangeItemStatus(
                  item.id,
                  ($event.target as HTMLSelectElement)
                    .value as AppointmentItemStatus,
                )
              "
            >
              <option value="pending">Pendente</option>
              <option value="accepted">Confirmado</option>
              <option value="rejected">Recusado</option>
            </select>
          </div>
        </div>
      </div>

      <p v-else class="mt-4 text-sm text-base-content/70">
        Nenhum item encontrado para este agendamento.
      </p>

      <div class="modal-action">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="close"
          :disabled="props.loading"
        >
          Fechar
        </button>
        <button
          type="button"
          class="btn btn-success btn-sm"
          :disabled="props.loading || !hasItems"
          @click="confirm"
        >
          <span
            v-if="props.loading"
            class="loading loading-spinner loading-xs"
          ></span>
          Salvar status
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close">close</button>
    </form>
  </dialog>
</template>
