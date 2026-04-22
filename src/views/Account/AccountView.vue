<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { AxiosError } from "axios";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { PhHouse, PhStorefront } from "@phosphor-icons/vue";
import Breadcrumbs from "@/components/ui/Breadcrumbs.vue";
import InputPhone from "@/components/forms/InputPhone.vue";
import AccountService from "@/services/accounts";
import ExternalService from "@/services/external";
import { AccountSchema } from "@/schemas/account.schemas";
import type { Account, PhoneValidationEvent } from "@/types";
import { useToastStore } from "@/stores/toast";
import { useAuthStore } from "@/stores/auth";
import LoaderComponent from "@/components/ui/AppLoader.vue";

const toastStore = useToastStore();
const authStore = useAuthStore();

const loading = ref(false);
const loadingData = ref(false);
const lastPhoneValidation = ref<PhoneValidationEvent | null>(null);
const numberInput = ref<HTMLInputElement | null>(null);

const {
  errors,
  defineField,
  setValues,
  handleSubmit,
  setFieldError,
  setFieldValue,
} = useForm<Account>({
  validationSchema: toTypedSchema(AccountSchema),
  initialValues: {
    name: "",
    slug: "",
    email: "",
    zipcode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    country_code: "",
    phone: "",
    instagram: "",
    facebook: "",
  },
});

const [name] = defineField("name");
const [slug] = defineField("slug");
const [email] = defineField("email");
const [zipcode] = defineField("zipcode");
const [street] = defineField("street");
const [number] = defineField("number");
const [complement] = defineField("complement");
const [neighborhood] = defineField("neighborhood");
const [city] = defineField("city");
const [state] = defineField("state");
const [phone] = defineField("phone", { validateOnModelUpdate: false });
const [instagram] = defineField("instagram");
const [facebook] = defineField("facebook");

onMounted(() => {
  loadAccountData();
});

async function loadAccountData() {
  loadingData.value = true;
  try {
    const { data } = await AccountService.index();
    const normalizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value ?? ""]),
    );
    setValues(normalizedData);
  } catch (error) {
    console.error("Erro ao carregar dados da conta:", error);
    toastStore.triggerToast("Erro ao carregar dados da conta.", "error");
  } finally {
    loadingData.value = false;
  }
}

async function getZipcode() {
  const cleanZip = zipcode.value?.replace(/\D/g, "");
  if (!cleanZip || cleanZip.length !== 8) return;

  try {
    const { data } = await ExternalService.zipcode(cleanZip);
    setValues({
      street: data.street,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
    });
    toastStore.triggerToast("CEP encontrado com sucesso!", "success");
    numberInput.value?.focus();
  } catch {
    toastStore.triggerToast("CEP não encontrado.", "warning");
  }
}

function onPhoneValidate(event: PhoneValidationEvent) {
  lastPhoneValidation.value = event;
  if (event.valid && event.countryCode) {
    setFieldValue("country_code", event.countryCode);
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    if (phone.value) {
      if (
        lastPhoneValidation.value &&
        lastPhoneValidation.value.valid === false
      ) {
        setFieldError("phone", "Telefone inválido");
        return;
      }
    }

    if (lastPhoneValidation.value?.valid !== true) {
      delete formValues.phone;
      delete formValues.country_code;
    }

    loading.value = true;

    await AccountService.update(formValues);

    // Atualiza o nome da conta na store
    if (authStore.account) {
      authStore.account.name = formValues.name;
    }

    toastStore.triggerToast(
      "Dados da conta atualizados com sucesso!",
      "success",
    );
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;

    if (axiosError.response?.status === 422) {
      const message = "Slug já existe";
      setFieldError("slug", message);
      toastStore.triggerToast(message, "error");
      return;
    } else {
      console.error("Erro ao atualizar conta:", error);
      toastStore.triggerToast("Erro ao atualizar dados da conta.", "error");
    }
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <Breadcrumbs
        :items="[
          { label: 'Home', to: '/', icon: PhHouse },
          { label: 'Minha Conta', icon: PhStorefront },
        ]"
      />

      <div class="flex gap-2">
        <button
          type="submit"
          form="account-form"
          class="btn btn-active btn-success btn-sm"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="loading loading-spinner loading-xs"
          ></span>
          Salvar Alterações
        </button>
      </div>
    </div>

    <form id="account-form" @submit="onSubmit">
      <fieldset
        class="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4"
      >
        <LoaderComponent v-if="loadingData" :paddingY="189" />

        <div
          v-show="!loadingData"
          class="grid grid-cols-1 md:grid-cols-12 gap-4 w-full"
        >
          <!-- Nome do Estabelecimento -->
          <div class="w-full md:col-span-6">
            <label class="label mb-1">Nome do Estabelecimento</label>
            <input
              v-model="name"
              type="text"
              class="input input-sm w-full"
              placeholder="Ex: Cabeleleila Leila"
              :class="{ 'input-error': errors.name }"
              maxlength="255"
            />
            <span v-if="errors.name" class="text-error text-xs mt-1">{{
              errors.name
            }}</span>
          </div>

          <!-- Slug -->
          <div class="w-full md:col-span-6">
            <label class="label mb-1">Slug</label>
            <input
              v-model="slug"
              type="text"
              class="input input-sm w-full"
              placeholder="Ex: cabeleleila-leila"
              :class="{ 'input-error': errors.slug }"
              maxlength="255"
            />
            <span v-if="errors.slug" class="text-error text-xs mt-1">{{
              errors.slug
            }}</span>
          </div>

          <!-- E-mail -->
          <div class="w-full md:col-span-6">
            <label class="label mb-1">E-mail</label>
            <input
              v-model="email"
              type="email"
              class="input input-sm w-full"
              placeholder="contato@exemplo.com"
              :class="{ 'input-error': errors.email }"
              maxlength="255"
            />
            <span v-if="errors.email" class="text-error text-xs mt-1">{{
              errors.email
            }}</span>
          </div>

          <!-- Telefone -->
          <div class="w-full md:col-span-6">
            <label class="label mb-1">Telefone</label>
            <InputPhone
              v-model="phone"
              @validate="onPhoneValidate"
              :class="{ 'input-error': errors.phone }"
            />
            <span v-if="errors.phone" class="text-error text-xs mt-1">{{
              errors.phone
            }}</span>
          </div>

          <!-- Instagram -->
          <div class="w-full md:col-span-6">
            <label class="label mb-1">Instagram</label>
            <input
              v-model="instagram"
              type="text"
              class="input input-sm w-full"
              placeholder="@seuinstagram"
            />
          </div>

          <!-- Facebook -->
          <div class="w-full md:col-span-6">
            <label class="label mb-1">Facebook</label>
            <input
              v-model="facebook"
              type="text"
              class="input input-sm w-full"
              placeholder="facebook.com/suapagina"
            />
          </div>

          <!-- Divider Endereço -->
          <div class="w-full md:col-span-12">
            <div class="divider my-0">Endereço</div>
          </div>

          <!-- CEP -->
          <div class="w-full md:col-span-3">
            <label class="label mb-1">CEP</label>
            <input
              v-model="zipcode"
              v-maska="'#####-###'"
              type="text"
              class="input input-sm w-full"
              placeholder="00000-000"
              :class="{ 'input-error': errors.zipcode }"
              @blur="getZipcode"
            />
            <span v-if="errors.zipcode" class="text-error text-xs mt-1">{{
              errors.zipcode
            }}</span>
          </div>

          <!-- Rua -->
          <div class="w-full md:col-span-7">
            <label class="label mb-1">Rua</label>
            <input
              v-model="street"
              type="text"
              class="input input-sm w-full"
              placeholder="Rua, Avenida..."
              :class="{ 'input-error': errors.street }"
              maxlength="255"
            />
            <span v-if="errors.street" class="text-error text-xs mt-1">{{
              errors.street
            }}</span>
          </div>

          <!-- Número -->
          <div class="w-full md:col-span-2">
            <label class="label mb-1">Número</label>
            <input
              ref="numberInput"
              v-model="number"
              type="text"
              class="input input-sm w-full"
              placeholder="Nº"
              :class="{ 'input-error': errors.number }"
              maxlength="20"
            />
            <span v-if="errors.number" class="text-error text-xs mt-1">{{
              errors.number
            }}</span>
          </div>

          <!-- Complemento -->
          <div class="w-full md:col-span-4">
            <label class="label mb-1">Complemento</label>
            <input
              v-model="complement"
              type="text"
              class="input input-sm w-full"
              placeholder="Sala, Bloco..."
              maxlength="255"
            />
          </div>

          <!-- Bairro -->
          <div class="w-full md:col-span-4">
            <label class="label mb-1">Bairro</label>
            <input
              v-model="neighborhood"
              type="text"
              class="input input-sm w-full"
              placeholder="Bairro"
              :class="{ 'input-error': errors.neighborhood }"
              maxlength="100"
            />
            <span v-if="errors.neighborhood" class="text-error text-xs mt-1">{{
              errors.neighborhood
            }}</span>
          </div>

          <!-- Cidade -->
          <div class="w-full md:col-span-3">
            <label class="label mb-1">Cidade</label>
            <input
              v-model="city"
              type="text"
              class="input input-sm w-full"
              placeholder="Cidade"
              :class="{ 'input-error': errors.city }"
              maxlength="100"
            />
            <span v-if="errors.city" class="text-error text-xs mt-1">{{
              errors.city
            }}</span>
          </div>

          <!-- Estado -->
          <div class="w-full md:col-span-1">
            <label class="label mb-1">UF</label>
            <input
              v-model="state"
              type="text"
              class="input input-sm w-full"
              placeholder="UF"
              :class="{ 'input-error': errors.state }"
              maxlength="2"
            />
            <span v-if="errors.state" class="text-error text-xs mt-1">{{
              errors.state
            }}</span>
          </div>
        </div>
      </fieldset>
    </form>
  </div>
</template>
