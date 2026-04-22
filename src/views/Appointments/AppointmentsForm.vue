<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import {
  PhCalendarDots,
  PhFolderSimplePlus,
  PhHouse,
  PhPen,
} from "@phosphor-icons/vue";
import Breadcrumbs from "@/components/ui/Breadcrumbs.vue";
import LoaderComponent from "@/components/ui/AppLoader.vue";
import { useToastStore } from "@/stores/toast";
import VueSelect from "vue-select";
import type {
  Client,
  Service,
  PhoneValidationEvent,
  AppointmentEditData,
  User,
} from "@/types";
import ClientService from "@/services/clients";
import ServiceService from "@/services/services";
import UserService from "@/services/users";
import AppointmentService from "@/services/appointments";
import { formatPhone } from "@/utils/format-phone";
import {
  AppointmentFormSchema,
  type AppointmentFormValues,
} from "@/schemas/appointment.schema";
import InputPhone from "@/components/forms/InputPhone.vue";

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();
const clients = ref<Array<Client>>([]);
const services = ref<Array<Service>>([]);
const users = ref<Array<User>>([]);
const lastClientSearch = ref("");
const lastPhoneValidation = ref<PhoneValidationEvent | null>(null);
const phoneTouched = ref(false);

const isEditMode = computed(() => !!route.params.id);
const loading = ref(false);
const loadingData = ref(false);

const { errors, defineField, handleSubmit, setFieldValue, setFieldError } =
  useForm<AppointmentFormValues>({
    validationSchema: toTypedSchema(AppointmentFormSchema),
    initialValues: {
      appointment_date: "",
      status: "pending",
      time: "",
      user_id: "",
      service_ids: [],
      client_id: "",
      create_new_client: false,
      new_client_name: "",
      new_client_phone: "",
    },
  });

const [appointment_date] = defineField("appointment_date");
const [status] = defineField("status");
const [time] = defineField("time");
const [user_id] = defineField("user_id");
const [service_ids] = defineField("service_ids");
const [client_id] = defineField("client_id");
const [create_new_client] = defineField("create_new_client");
const [new_client_name] = defineField("new_client_name");
const [new_client_phone] = defineField("new_client_phone", {
  validateOnModelUpdate: false,
});

onMounted(async () => {
  loadServices();
  loadUsers();

  if (isEditMode.value) loadAppointmentData();
});

async function loadAppointmentData() {
  loadingData.value = true;

  try {
    const response = await AppointmentService.show(route.params.id as string);

    assignValues(response.data);
  } catch (error) {
    console.error("Erro ao carregar agendamento:", error);
    toastStore.triggerToast("Erro ao carregar agendamento.", "error");
  } finally {
    loadingData.value = false;
  }
}

function assignValues(appointment: AppointmentEditData) {
  if (!appointment) return;

  setFieldValue("appointment_date", appointment.date ?? "", false);
  setFieldValue("status", appointment.status ?? "pending", false);
  setFieldValue("time", appointment.time ?? "", false);
  setFieldValue("user_id", appointment.user_id ?? "", false);
  setFieldValue("client_id", appointment.client_id ?? "", false);
  setFieldValue("create_new_client", false, false);
  setFieldValue("new_client_name", "", false);
  setFieldValue("new_client_phone", "", false);

  const mappedServiceIds = Array.isArray(appointment.items)
    ? appointment.items
        .map((item: { service_id?: string }) => item.service_id)
        .filter(
          (serviceId: string | undefined): serviceId is string => !!serviceId,
        )
    : [];

  setFieldValue("service_ids", mappedServiceIds, false);

  if (appointment.client?.id) {
    const appointmentClient = appointment.client;
    const exists = clients.value.some(
      (client) => client.id === appointmentClient.id,
    );

    if (!exists) {
      clients.value = [appointmentClient, ...clients.value];
    }
  }
}

async function searchClients(search: string) {
  const normalizedSearch = search.trim();

  if (!normalizedSearch || normalizedSearch.length < 3) return;

  if (normalizedSearch === lastClientSearch.value) return;

  lastClientSearch.value = normalizedSearch;

  await ClientService.paginate(1, 15, normalizedSearch)
    .then((response) => {
      clients.value = response.data.data;
    })
    .catch((error) => {
      console.error("Erro ao buscar clientes:", error);
      toastStore.triggerToast("Erro ao buscar clientes.", "error");
    });
}

async function loadServices() {
  try {
    const response = await ServiceService.index();
    services.value = response.data;
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    toastStore.triggerToast("Erro ao buscar serviços.", "error");
  }
}

async function loadUsers() {
  try {
    const response = await UserService.index();
    users.value = response.data;
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    toastStore.triggerToast("Erro ao buscar serviços.", "error");
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  loading.value = true;
  phoneTouched.value = true;

  try {
    let resolvedClientId = formValues.client_id ?? "";

    if (formValues.create_new_client) {
      const createdClient = await ClientService.create({
        name: formValues.new_client_name,
        phone: formValues.new_client_phone,
      } as Client);

      resolvedClientId =
        createdClient.data?.id || createdClient.data?.data?.id || "";
    }

    if (!resolvedClientId) {
      throw new Error("Cliente inválido para o agendamento");
    }

    const payload = {
      client_id: resolvedClientId,
      user_id: formValues.user_id,
      date: formValues.appointment_date,
      time: formValues.time,
      status: formValues.status,
      service_ids: formValues.service_ids,
    };

    if (isEditMode.value) {
      await AppointmentService.update(route.params.id as string, payload);
    } else {
      await AppointmentService.create(payload);
    }

    toastStore.triggerToast(
      isEditMode.value
        ? "Agendamento atualizado com sucesso!"
        : "Agendamento criado com sucesso!",
      "success",
    );
    router.push({ name: "Appointments" });
  } catch (error) {
    console.error("Erro ao salvar agendamento:", error);
    toastStore.triggerToast("Erro ao salvar agendamento.", "error");
  } finally {
    loading.value = false;
  }
});

function toggleCreateClient() {
  const willCreateClient = !create_new_client.value;
  setFieldValue("create_new_client", willCreateClient, false);

  if (willCreateClient) {
    setFieldValue("client_id", "", false);
    phoneTouched.value = false;
    lastPhoneValidation.value = null;
    setFieldError("new_client_name", undefined);
    setFieldError("new_client_phone", undefined);
    return;
  }

  setFieldValue("new_client_name", "", false);
  setFieldValue("new_client_phone", "", false);
  phoneTouched.value = false;
  lastPhoneValidation.value = null;
  setFieldError("new_client_name", undefined);
  setFieldError("new_client_phone", undefined);
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
    setFieldError("new_client_phone", undefined);
    return;
  }

  if (!number && valid === undefined) {
    setFieldError("new_client_phone", undefined);
    return;
  }

  if (number && valid === false) {
    setFieldError("new_client_phone", "Telefone inválido");
    return;
  }

  if (valid === true && number) {
    setFieldError("new_client_phone", undefined);
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <div class="flex justify-between items-center mb-4">
      <Breadcrumbs
        :items="[
          { label: 'Home', to: '/', icon: PhHouse },
          {
            label: 'Agendamentos',
            to: { name: 'Appointments' },
            icon: PhCalendarDots,
          },
          {
            label: isEditMode ? 'Atualizar' : 'Criar',
            icon: isEditMode ? PhPen : PhFolderSimplePlus,
          },
        ]"
      />

      <div class="flex gap-2">
        <router-link
          :to="{ name: 'Appointments' }"
          class="btn btn-dash btn-secondary btn-sm"
          >Cancelar</router-link
        >
        <button
          type="submit"
          form="appointments-form"
          class="btn btn-active btn-success btn-sm"
          :disabled="loading || loadingData"
        >
          <span
            v-if="loading"
            class="loading loading-spinner loading-xs"
          ></span>
          {{ isEditMode ? "Atualizar" : "Criar" }}
        </button>
      </div>
    </div>

    <form id="appointments-form" @submit="onSubmit" autocomplete="off">
      <fieldset
        class="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4"
      >
        <LoaderComponent v-if="loadingData" :paddingY="173" />

        <div
          v-show="!loadingData"
          class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
        >
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
            >
              {{ errors.appointment_date }}
            </span>
          </div>

          <div class="w-full">
            <label class="label mb-1">Status</label>
            <select
              v-model="status"
              class="select select-sm w-full"
              :class="{ 'select-error': errors.status }"
            >
              <option value="pending">Pendente</option>
              <option value="accepted">Confirmado</option>
              <option value="rejected">Recusado</option>
            </select>
            <span v-if="errors.status" class="text-error text-xs mt-1">{{
              errors.status
            }}</span>
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

          <div class="w-full">
            <label class="label mb-1">Profissional</label>
            <select
              v-model="user_id"
              class="select select-bordered w-full select-sm"
              :class="{ 'select-error': errors.user_id }"
            >
              <option value="" disabled>Selecione um profissional</option>
              <option v-for="value in users" :key="value.id" :value="value.id">
                {{ value.name }}
              </option>
            </select>
            <span v-if="errors.user_id" class="text-error text-xs mt-1">{{
              errors.user_id
            }}</span>
          </div>

          <div class="w-full md:col-span-2">
            <label class="label mb-1">Cliente</label>
            <div class="flex items-stretch gap-2">
              <VueSelect
                v-model="client_id"
                class="flex-1"
                :options="clients"
                label="name"
                :reduce="(client: Client) => client.id"
                :filterable="false"
                :clearable="false"
                :disabled="create_new_client"
                placeholder="Digite o nome ou telefone do cliente"
                @search="searchClients"
              >
                <template #no-options> Nenhum cliente encontrado </template>
                <template #option="{ name, phone }">
                  <div class="font-semibold">{{ name }}</div>
                  <div class="text-xs">
                    {{ formatPhone(phone) }}
                  </div>
                </template>
                <template #selected-option="{ name, phone }">
                  <div class="truncate">
                    {{ name }} - {{ formatPhone(phone) }}
                  </div>
                </template>
              </VueSelect>
              <button
                type="button"
                class="btn btn-outline btn-sm"
                :class="{ 'btn-active': create_new_client }"
                @click="toggleCreateClient"
              >
                {{
                  create_new_client ? "Usar cliente existente" : "Novo cliente"
                }}
              </button>
            </div>
            <span v-if="errors.client_id" class="text-error text-xs mt-1">{{
              errors.client_id
            }}</span>
          </div>

          <div v-if="create_new_client" class="w-full md:col-span-2">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="w-full">
                <label class="label mb-1">Nome do cliente</label>
                <input
                  v-model="new_client_name"
                  type="text"
                  class="input input-sm w-full"
                  :class="{ 'input-error': errors.new_client_name }"
                  placeholder="Ex: Maria Silva"
                  maxlength="255"
                />
                <span
                  v-if="errors.new_client_name"
                  class="text-error text-xs mt-1"
                >
                  {{ errors.new_client_name }}
                </span>
              </div>

              <div class="w-full">
                <label class="label mb-1">Telefone do cliente</label>

                <InputPhone
                  v-model="new_client_phone"
                  class="input-sm"
                  :class="{ 'input-error': errors.new_client_phone }"
                  @validate="validatePhone"
                />
                <span
                  v-if="errors.new_client_phone"
                  class="text-error text-xs mt-1"
                >
                  {{ errors.new_client_phone }}
                </span>
              </div>
            </div>
          </div>

          <div class="w-full md:col-span-2">
            <label class="label mb-2">Serviços</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
        </div>
      </fieldset>
    </form>
  </div>
</template>
