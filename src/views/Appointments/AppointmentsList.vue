<script lang="ts" setup>
import {
  PhCalendarDots,
  PhHouse,
  PhPen,
  PhTrash,
  PhGear,
} from "@phosphor-icons/vue";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { formatDateToBr } from "@/utils/format-date";
import SkeletonComponent from "./components/SkeletonList.vue";
import { useToastStore } from "@/stores/toast";
import DeleteModal from "@/components/ui/DeleteModal.vue";
import Breadcrumbs from "@/components/ui/Breadcrumbs.vue";
import ViewServicesAppointmentModal from "./components/ViewServicesAppointmentModal.vue";
import AppointmentService from "@/services/appointments";
import AppointmentItemService from "@/services/appointment-items";
import type { Appointment, EditableAppointmentItem } from "@/types";
import { getAppointmentStatusMeta } from "@/utils";
import { VueDatePicker } from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const date = ref<[Date, Date] | null>(null);

const appointments = reactive<Array<Appointment>>([]);
const isLoading = ref(true);
const router = useRouter();
const toastStore = useToastStore();
const deleteAppointment = ref<Appointment | null>(null);
const previewAppointment = ref<Appointment | null>(null);
const deleting = ref(false);
const deleteModalRef = ref<{ open: () => void; close: () => void } | null>(
  null,
);
const updatingStatus = ref(false);
const previewModalRef = ref<{ open: () => void; close: () => void } | null>(
  null,
);

onMounted(() => {
  loadAppointments();
});

function formatDateForApi(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}

function formatRangeForApi(rangeValue: [Date, Date] | null): {
  startDate: string;
  endDate: string;
} | null {
  if (!rangeValue?.[0] || !rangeValue?.[1]) {
    return null;
  }

  return {
    startDate: formatDateForApi(rangeValue[0]),
    endDate: formatDateForApi(rangeValue[1]),
  };
}

async function loadAppointments() {
  isLoading.value = true;
  const range = formatRangeForApi(date.value);

  try {
    const response = await AppointmentService.paginate(
      1,
      15,
      range?.startDate,
      range?.endDate,
    );
    appointments.splice(0, appointments.length, ...response.data.data);
  } catch (error) {
    console.error("Erro ao carregar lista de agendamentos:", error);
    toastStore.triggerToast("Erro ao carregar agendamentos.", "error");
  } finally {
    isLoading.value = false;
  }
}

async function handleDeleteAppointment() {
  if (!deleteAppointment.value?.id) return;

  deleting.value = true;

  try {
    await AppointmentService.delete(deleteAppointment.value.id);
    toastStore.triggerToast("Agendamento excluído com sucesso!", "success");
    deleteModalRef.value?.close();
    deleteAppointment.value = null;
    await loadAppointments();
  } catch (error) {
    console.error("Erro ao excluir agendamento:", error);
    toastStore.triggerToast("Erro ao excluir agendamento.", "error");
  } finally {
    deleting.value = false;
  }
}

function onDeleteClick(appointment: Appointment) {
  deleteAppointment.value = appointment;
  deleteModalRef.value?.open();
}

function openPreviewServices(appointment: Appointment) {
  previewAppointment.value = appointment;
  previewModalRef.value?.open();
}

async function handleUpdatePreviewItems(items: EditableAppointmentItem[]) {
  if (
    !previewAppointment.value ||
    !Array.isArray(previewAppointment.value.items)
  )
    return;

  updatingStatus.value = true;

  await AppointmentItemService.update(items)
    .then(() => {
      toastStore.triggerToast(
        "Status dos serviços atualizado na visualização.",
        "success",
      );
      previewModalRef.value?.close();
      loadAppointments();
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      updatingStatus.value = false;
    });
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <div class="flex justify-between items-center mb-4">
      <Breadcrumbs
        :items="[
          { label: 'Home', to: '/', icon: PhHouse },
          { label: 'Agendamentos', icon: PhCalendarDots },
        ]"
      />

      <div class="flex items-center gap-2">
        <VueDatePicker
          v-model="date"
          range
          :time-picker="false"
          :time-config="{ enableTimePicker: false }"
          :action-row="{
            cancelBtnLabel: 'Cancelar',
            selectBtnLabel: 'Selecionar',
          }"
          placeholder="Período"
          class="w-[300px]"
          :ui="{ input: 'input input-sm' }"
          @update:model-value="loadAppointments"
        />

        <router-link :to="{ name: 'AppointmentCreate' }">
          <button class="btn btn-active btn-success btn-sm whitespace-nowrap">
            Adicionar Agendamento
          </button>
        </router-link>
      </div>
    </div>

    <SkeletonComponent v-if="isLoading" />

    <div
      v-else-if="appointments.length > 0"
      class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Profissional</th>
            <th>Data do agendamento</th>
            <th>Horário</th>
            <th>Status</th>
            <th>Criado em</th>
            <td />
          </tr>
        </thead>
        <tbody>
          <tr v-for="appointment in appointments" :key="appointment.id">
            <td>{{ appointment.client?.name || "-" }}</td>
            <td>{{ appointment.user?.name || "-" }}</td>
            <td>{{ formatDateToBr(appointment.date) }}</td>
            <td>{{ appointment.time }}</td>
            <td>
              <span
                class="badge badge-soft"
                :class="getAppointmentStatusMeta(appointment.status).badgeClass"
              >
                {{ getAppointmentStatusMeta(appointment.status).label }}
              </span>
            </td>
            <td>{{ formatDateToBr(appointment.created_at) }}</td>
            <td class="text-right">
              <button
                class="btn btn-ghost btn-xs mr-2"
                @click="openPreviewServices(appointment)"
              >
                <PhGear size="16" />
              </button>
              <button
                class="btn btn-ghost btn-xs mr-2"
                @click="
                  router.push({
                    name: 'AppointmentEdit',
                    params: { id: appointment.id },
                  })
                "
              >
                <PhPen :size="16" />
              </button>
              <button
                class="btn btn-ghost btn-xs"
                @click="onDeleteClick(appointment)"
              >
                <PhTrash :size="16" class="text-error" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center h-64 bg-base-200 rounded-box border border-base-300"
    >
      <PhCalendarDots :size="48" class="text-base-content/30 mb-4" />
      <h3 class="text-lg font-semibold text-base-content/70">
        Nenhum agendamento encontrado
      </h3>
      <p class="text-sm text-base-content/50">
        Comece adicionando um novo agendamento.
      </p>
    </div>
  </div>

  <DeleteModal
    ref="deleteModalRef"
    title="Excluir agendamento"
    :message="`Deseja realmente excluir o agendamento de ${formatDateToBr(deleteAppointment?.date)}?`"
    :loading="deleting"
    @callback="handleDeleteAppointment"
    @close="deleteAppointment = null"
  />

  <ViewServicesAppointmentModal
    ref="previewModalRef"
    title="Serviços do agendamento"
    :appointment="previewAppointment"
    :loading="updatingStatus"
    @callback="handleUpdatePreviewItems"
    @close="previewAppointment = null"
  />
</template>
