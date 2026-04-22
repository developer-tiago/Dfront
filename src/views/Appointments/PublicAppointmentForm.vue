<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import type { Service, PhoneValidationEvent, Account } from "@/types";
import type { User } from "@/types/user";
import { useToastStore } from "@/stores/toast";
import LoaderComponent from "@/components/ui/AppLoader.vue";
import InputPhone from "@/components/forms/InputPhone.vue";
import AccountService from "@/services/public";
import ClientService from "@/services/public";
import AppointmentService from "@/services/public";
import {
  PublicAppointmentFormSchema,
  type PublicAppointmentFormValues,
} from "@/schemas/public-appointment.schema";
import PublicAppointmentMap from "./components/PublicAppointmentMap.vue";
import SuggestAppointmentModal from "./components/SuggestAppointmentModal.vue";
import { formatDateToBr } from '@/utils/format-date'; 
import { formatPhone } from '@/utils/format-phone';

const route = useRoute();
const toastStore = useToastStore();

const loading = ref(false);
const loadingData = ref(false);
const accountName = ref("Agendamento");
const accountId = ref("");
const account = ref<Account | null>(null);
const services = ref<Array<Service>>([]);

const hasAddress = computed(() => {
  return !!(
    account.value?.street &&
    account.value?.number &&
    account.value?.neighborhood &&
    account.value?.city &&
    account.value?.state
  );
});

const mapQuery = computed(() => {
  if (!hasAddress.value || !account.value) return "";
  const { street, number, neighborhood, city, state } = account.value;
  return `${street},+${number}-${neighborhood}-${city}/${state}`;
});
const professionals = ref<Array<User>>([]);
const lastPhoneValidation = ref<PhoneValidationEvent | null>(null);
const phoneTouched = ref(false);

const suggestModalRef = ref<InstanceType<typeof SuggestAppointmentModal> | null>(null);
const existingAppointmentData = ref<any>(null);
const pendingFormValues = ref<PublicAppointmentFormValues | null>(null);
const pendingClientId = ref<string>("");

const editingAppointmentId = ref<string | null>(null);
const clientAppointmentsList = ref<any[]>([]);
const appointmentsModalRef = ref<HTMLDialogElement | null>(null);
const loadingAppointments = ref(false);

const hasNonEditableAppointments = computed(() => {
  return clientAppointmentsList.value.some(app => !isEditable(app.date));
});

const { errors, defineField, handleSubmit, setFieldError, resetForm } =
  useForm<PublicAppointmentFormValues>({
    validationSchema: toTypedSchema(PublicAppointmentFormSchema),
    initialValues: {
      appointment_date: "",
      time: "",
      user_id: "",
      client_name: "",
      client_phone: "",
      service_ids: [],
    },
  });

const [appointment_date] = defineField("appointment_date");
const [time] = defineField("time");
const [user_id] = defineField("user_id");
const [client_name] = defineField("client_name");
const [client_phone] = defineField("client_phone", {
  validateOnModelUpdate: false,
});
const [service_ids] = defineField("service_ids");

onMounted(() => {
  loadBookingPageData();
});

async function loadBookingPageData() {
  const slug = String(route.params.slug || "").trim();

  if (!slug) {
    toastStore.triggerToast("Link de agendamento inválido.", "error");
    return;
  }

  loadingData.value = true;

  try {
    const response = await AccountService.getInfoBySlug(slug);
    const payload = (response.data as { data?: unknown }).data ?? response.data;
    const accountData = payload as Account & {
      id?: string;
      account_id?: string;
      services?: Service[];
      users?: User[];
      professionals?: User[];
    };
    
    account.value = accountData;
    accountName.value = accountData.name || "Agendamento";
    accountId.value = accountData.id || "";
    document.title = accountName.value;
    services.value = Array.isArray(accountData.services)
      ? accountData.services
      : [];

    if (Array.isArray(accountData.professionals)) {
      professionals.value = accountData.professionals;
    } else if (Array.isArray(accountData.users)) {
      professionals.value = accountData.users;
    } else {
      professionals.value = [];
    }
  } catch (error) {
    console.error("Erro ao carregar dados do agendamento público:", error);
    toastStore.triggerToast(
      "Não foi possível carregar os dados da agenda.",
      "error",
    );
  } finally {
    loadingData.value = false;
  }
}

function validatePhone(event: PhoneValidationEvent) {
  lastPhoneValidation.value = event;

  const { valid, number, nationalNumber, countryCallingCode } = event;
  const phoneDigits = (number || "").replace(/\D/g, "");
  const countryCodeDigits = (countryCallingCode || "").replace(/\D/g, "");
  const hasPhoneInput =
    !!nationalNumber?.trim() || phoneDigits.length > countryCodeDigits.length;

  if (!phoneTouched.value && hasPhoneInput) {
    phoneTouched.value = true;
  }

  if (!phoneTouched.value) {
    setFieldError("client_phone", undefined);
    return;
  }

  if (!number && valid === undefined) {
    setFieldError("client_phone", undefined);
    return;
  }

  if (number && valid === false) {
    setFieldError("client_phone", "Telefone inválido");
    return;
  }

  if (valid === true && number) {
    setFieldError("client_phone", undefined);
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  phoneTouched.value = true;

  if (!accountId.value) {
    toastStore.triggerToast("Conta inválida para agendamento.", "error");
    return;
  }

  if (!lastPhoneValidation.value?.valid) {
    setFieldError("client_phone", "Telefone inválido");
    return;
  }

  loading.value = true;

  try {
    const createdClient = await ClientService.createClient({
      account_id: accountId.value,
      name: formValues.client_name,
      phone: formValues.client_phone,
    });

    const resolvedClientId =
      createdClient.data?.id || createdClient.data?.data?.id || "";

    if (!resolvedClientId) {
      throw new Error("Cliente inválido para o agendamento");
    }

    if (editingAppointmentId.value) {
      await executeUpdateAppointment(resolvedClientId, formValues);
      return;
    }

    const checkRes = await AppointmentService.checkAppointment(
      formValues.appointment_date,
      resolvedClientId,
    );

    if (checkRes.data?.hasAppointmentInWeek) {
      existingAppointmentData.value = checkRes.data.appointment;
      
      pendingFormValues.value = formValues;
      pendingClientId.value = resolvedClientId;
      loading.value = false;
      suggestModalRef.value?.open();
      return;
    }

    await executeCreateAppointment(resolvedClientId, formValues);
  } catch (error) {
    console.error("Erro ao criar agendamento público:", error);
    toastStore.triggerToast("Erro ao enviar agendamento.", "error");
    loading.value = false;
  }
});

async function searchAppointments() {
  phoneTouched.value = true;
  if (!lastPhoneValidation.value?.valid || !client_phone.value) {
    setFieldError("client_phone", "Insira um telefone válido para buscar");
    return;
  }
  
  if (!client_name.value) {
    setFieldError("client_name", "Insira seu nome para buscar");
    return;
  }
  
  loadingAppointments.value = true;
  try {
    const createdClient = await ClientService.createClient({
      account_id: accountId.value,
      name: client_name.value,
      phone: client_phone.value,
    });
    
    const resolvedClientId = createdClient.data?.id || createdClient.data?.data?.id || "";
    if (!resolvedClientId) {
      throw new Error("Cliente inválido");
    }
    
    const response = await AppointmentService.clientAppointments(resolvedClientId);
    clientAppointmentsList.value = Array.isArray(response.data) ? response.data : [];
    
    if (clientAppointmentsList.value.length === 0) {
      toastStore.triggerToast("Nenhum agendamento encontrado para este telefone.", "info");
    } else {
      appointmentsModalRef.value?.showModal();
    }
  } catch (error) {
    console.error("Erro ao buscar agendamentos", error);
    toastStore.triggerToast("Erro ao buscar agendamentos", "error");
  } finally {
    loadingAppointments.value = false;
  }
}

function isEditable(dateStr: string) {
  if (!dateStr) return false;
  const appDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = appDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 2;
}

function selectAppointmentToEdit(app: any) {
  if (!isEditable(app.date)) {
    const phone = formatPhone(account.value?.phone) || "o estabelecimento";
    toastStore.triggerToast(`Para alterar agendamentos com menos de 2 dias de antecedência, entre em contato via: ${phone}`, "warning");
    return;
  }

  editingAppointmentId.value = app.id;
  
  let appDateStr = "";
  if (app.date) {
    appDateStr = app.date.split("T")[0];
  }
  
  let appTime = app.time || "";
  if (appTime && appTime.length > 5) {
    appTime = appTime.substring(0, 5);
  }
  
  appointment_date.value = appDateStr;
  time.value = appTime;
  user_id.value = app.user_id;
  
  if (app.items && Array.isArray(app.items)) {
    service_ids.value = app.items.map((item: any) => item.service_id);
  }
  
  appointmentsModalRef.value?.close();
  toastStore.triggerToast("Agendamento carregado para edição", "info");
}

function cancelEdit() {
  editingAppointmentId.value = null;
  resetForm();
}

async function executeCreateAppointment(
  clientId: string,
  formValues: PublicAppointmentFormValues,
) {
  loading.value = true;
  try {
    await AppointmentService.createAppointment({
      account_id: accountId.value,
      client_id: clientId,
      user_id: formValues.user_id,
      date: formValues.appointment_date,
      time: formValues.time,
      status: "pending",
      service_ids: formValues.service_ids,
    });

    toastStore.triggerToast("Agendamento solicitado com sucesso!", "success");
    resetForm();
    lastPhoneValidation.value = null;
    phoneTouched.value = false;
  } catch (error) {
    console.error("Erro ao criar agendamento público:", error);
    toastStore.triggerToast("Erro ao enviar agendamento.", "error");
  } finally {
    loading.value = false;
  }
}

async function executeUpdateAppointment(
  clientId: string,
  formValues: PublicAppointmentFormValues,
) {
  if (!editingAppointmentId.value) return;
  
  loading.value = true;
  try {
    await AppointmentService.updateAppointment(editingAppointmentId.value, {
      account_id: accountId.value,
      client_id: clientId,
      user_id: formValues.user_id,
      date: formValues.appointment_date,
      time: formValues.time,
      status: "pending",
      service_ids: formValues.service_ids,
    });

    toastStore.triggerToast("Agendamento atualizado com sucesso!", "success");
    editingAppointmentId.value = null;
    resetForm();
    lastPhoneValidation.value = null;
    phoneTouched.value = false;
  } catch (error) {
    console.error("Erro ao atualizar agendamento público:", error);
    toastStore.triggerToast("Erro ao atualizar agendamento.", "error");
  } finally {
    loading.value = false;
  }
}

function confirmSuggestedAppointment() {
  suggestModalRef.value?.close();
  if (pendingClientId.value && pendingFormValues.value) {
    const targetAppointment = existingAppointmentData.value || {};
    const suggestedDate = targetAppointment.date || targetAppointment.appointment_date;
    
    if (suggestedDate && typeof suggestedDate === "string") {
      pendingFormValues.value.appointment_date = suggestedDate.split("T")[0] || "";
    }
    
    executeCreateAppointment(pendingClientId.value, pendingFormValues.value);
  }
}

function createNormally() {
  suggestModalRef.value?.close();
  if (pendingClientId.value && pendingFormValues.value) {
    executeCreateAppointment(pendingClientId.value, pendingFormValues.value);
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200 px-4 py-8">
    <div class="mx-auto max-w-3xl">
      <div class="mb-4 text-center">
        <h1 class="text-2xl font-bold">{{ accountName }}</h1>
        <p class="text-sm opacity-70">Solicite seu agendamento</p>
      </div>

      <form @submit="onSubmit" autocomplete="off">
        <fieldset
          class="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4"
        >
          <LoaderComponent v-if="loadingData" :paddingY="160" />

          <div v-show="!loadingData" class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div class="w-full">
              <label class="label mb-1">Seu nome</label>
              <input
                v-model="client_name"
                type="text"
                class="input input-sm w-full"
                :class="{ 'input-error': errors.client_name }"
                placeholder="Ex: Maria Silva"
                maxlength="255"
              />
              <span v-if="errors.client_name" class="text-error text-xs mt-1">{{
                errors.client_name
              }}</span>
            </div>

            <div class="w-full">
              <label class="label mb-1">Seu telefone</label>
              <InputPhone
                v-model="client_phone"
                class="input-sm"
                :class="{ 'input-error': errors.client_phone }"
                @validate="validatePhone"
              />
              <span
                v-if="errors.client_phone"
                class="text-error text-xs mt-1"
                >{{ errors.client_phone }}</span
              >
            </div>

            <div class="w-full md:col-span-2 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center py-2">
              <div v-if="editingAppointmentId" class="bg-info/10 p-3 rounded-lg flex justify-between items-center w-full sm:w-auto flex-1 mr-2">
                <span class="text-sm font-semibold text-info">Editando agendamento</span>
                <button type="button" class="btn btn-ghost btn-xs text-info" @click="cancelEdit">Cancelar</button>
              </div>
              <div v-else class="flex-1"></div>

              <button 
                type="button" 
                class="btn btn-outline btn-info btn-sm w-full sm:w-auto"
                @click="searchAppointments"
                :disabled="loadingAppointments"
              >
                <span v-if="loadingAppointments" class="loading loading-spinner loading-xs"></span>
                Buscar meus agendamentos
              </button>
            </div>

            <div class="w-full">
              <label class="label mb-1">Data do agendamento</label>
              <input
                v-model="appointment_date"
                type="date"
                class="input input-sm w-full"
                :class="{ 'input-error': errors.appointment_date }"
              />
              <span
                v-if="errors.appointment_date"
                class="text-error text-xs mt-1"
                >{{ errors.appointment_date }}</span
              >
            </div>

            <div class="w-full">
              <label class="label mb-1">Horário</label>
              <input
                v-model="time"
                type="time"
                class="input input-sm w-full"
                :class="{ 'input-error': errors.time }"
              />
              <span v-if="errors.time" class="text-error text-xs mt-1">{{
                errors.time
              }}</span>
            </div>

            <div class="w-full md:col-span-2">
              <label class="label mb-1">Profissional</label>
              <select
                v-model="user_id"
                class="select select-sm w-full"
                :class="{ 'select-error': errors.user_id }"
              >
                <option value="" disabled>Selecione um profissional</option>
                <option
                  v-for="professional in professionals"
                  :key="professional.id"
                  :value="professional.id"
                >
                  {{ professional.name }}
                </option>
              </select>
              <span v-if="errors.user_id" class="text-error text-xs mt-1">{{
                errors.user_id
              }}</span>
            </div>

            <div class="w-full md:col-span-2">
              <label class="label mb-2">Serviços</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  v-for="service in services"
                  :key="service.id || service.name"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    v-model="service_ids"
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :value="service.id"
                    :disabled="!service.id"
                  />
                  <span class="text-sm">{{ service.name }}</span>
                </label>
              </div>
              <span v-if="errors.service_ids" class="text-error text-xs mt-1">{{
                errors.service_ids
              }}</span>
            </div>

            <div class="w-full md:col-span-2">
              <button
                type="submit"
                class="btn btn-success btn-sm w-full"
                :disabled="loading || loadingData"
              >
                <span
                  v-if="loading"
                  class="loading loading-spinner loading-xs"
                ></span>
                Confirmar agendamento
              </button>
            </div>
          </div>
        </fieldset>
      </form>

      <PublicAppointmentMap :hasAddress="hasAddress" :mapQuery="mapQuery" />
    </div>

    <SuggestAppointmentModal 
      ref="suggestModalRef" 
      @confirm="confirmSuggestedAppointment" 
      @cancel="createNormally" 
    />

    <dialog class="modal" ref="appointmentsModalRef">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Seus Agendamentos</h3>
        <p class="text-sm opacity-70 mb-4">Selecione um agendamento para editar.</p>
        
        <div class="flex flex-col gap-2 max-h-96 overflow-y-auto">
          <button 
            v-for="app in clientAppointmentsList" 
            :key="app.id"
            class="btn btn-outline btn-block justify-start text-left h-auto py-2"
            :class="{ 'opacity-50 grayscale': !isEditable(app.date) }"
            @click="selectAppointmentToEdit(app)"
          >
            <div class="w-full flex justify-between items-center">
              <div>
                <div class="font-bold">{{ formatDateToBr(app.date) }} às {{ app.time }}</div>
                <div class="text-xs font-normal opacity-80">Profissional: {{ app.user?.name || 'Não selecionado' }}</div>
              </div>
              <div v-if="!isEditable(app.date)" class="text-[10px] uppercase font-bold text-warning">
                Indisponível para edição online
              </div>
            </div>
          </button>
        </div>

        <div v-if="hasNonEditableAppointments" class="mt-4 p-3 bg-warning/10 rounded-lg text-xs text-warning-content">
          <p class="font-bold mb-1">Atenção:</p>
          Agendamentos com menos de 2 dias de antecedência não podem ser alterados online. 
          Para estes casos, entre em contato pelo telefone: <span class="font-bold">{{ formatPhone(account?.phone) || 'estabelecimento' }}</span>
        </div>
        
        <div class="modal-action">
          <form method="dialog">
            <button class="btn">Fechar</button>
          </form>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>
