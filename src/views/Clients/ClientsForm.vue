<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { PhHouse, PhUsersThree, PhFolderSimplePlus, PhPen } from '@phosphor-icons/vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import LoaderComponent from '@/components/ui/AppLoader.vue';

// Services & Schemas
import ClientService from '@/services/clients';
import { ClientSchema } from '@/schemas/client.schema';
import type { Client, PhoneValidationEvent } from '@/types';
import InputPhone from '@/components/forms/InputPhone.vue';
import { useToastStore } from '@/stores/toast';

// ACESSAR ROTA ATUAL
const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();
const isEditMode = computed(() => !!route.params.id);

const loading = ref(false);
const loadingData = ref(false);
const lastPhoneValidation = ref<PhoneValidationEvent | null>(null);

const { errors, defineField, setValues, handleSubmit, setFieldError, setFieldValue } =
  useForm<Client>({
    validationSchema: toTypedSchema(ClientSchema),
    initialValues: {
      name: '',
      country_code: '',
      phone: '',
    },
  });

const [name] = defineField('name');
const [phone] = defineField('phone', { validateOnModelUpdate: false });

// MOUNTED
onMounted(() => {
  if (isEditMode.value) loadClientData();
});

// FUNÇÕES
async function loadClientData() {
  loadingData.value = true;

  try {
    const { data } = await ClientService.show(route.params.id as string);

    const normalizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value ?? ''])
    );
    setValues(normalizedData);
  } catch (error) {
    console.error('Erro ao carregar cliente:', error);
  } finally {
    loadingData.value = false;
  }
}

const onValidSubmit = handleSubmit(async (formValues) => {
  try {
    if (phone.value) {
      if (lastPhoneValidation.value && lastPhoneValidation.value.valid === false) {
        setFieldError('phone', 'Telefone inválido');
        return;
      }
    }

    // Remove o telefone do payload se não for válido (ex: apenas DDI +55)
    if (lastPhoneValidation.value?.valid !== true) {
      delete formValues.phone;
      delete formValues.country_code;
    }

    loading.value = true;

    if (isEditMode.value) {
      await ClientService.update(route.params.id as string, formValues as Client);
      toastStore.triggerToast('Cliente atualizado com sucesso!', 'success');
    } else {
      await ClientService.create(formValues as Client);
      toastStore.triggerToast('Cliente criado com sucesso!', 'success');
    }

    router.push({ name: 'Clients' });
  } catch (error) {
    console.error('Erro ao salvar:', error);
    toastStore.triggerToast('Erro ao salvar cliente.', 'error');
  } finally {
    loading.value = false;
  }
});

const onSubmit = async (e?: Event) => {
  await onValidSubmit(e);

  if (phone.value && lastPhoneValidation.value?.valid === false) {
    setFieldError('phone', 'Telefone inválido');
  }
};

function validatePhone(event: PhoneValidationEvent) {
  lastPhoneValidation.value = event;

  const { valid, number, countryCode } = event;

  if (!number && valid === undefined) {
    setFieldError('phone', undefined);
    return;
  }

  if (number && valid === false) {
    setFieldError('phone', 'Telefone inválido');
    return;
  }

  if (valid === true && number) {
    setFieldError('phone', undefined);
    if (countryCode) setFieldValue('country_code', countryCode);
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <!-- Breadcrumbs -->
    <div class="flex justify-between items-center mb-4">
      <Breadcrumbs
        :items="[
          { label: 'Home', to: '/', icon: PhHouse },
          { label: 'Clientes', to: { name: 'Clients' }, icon: PhUsersThree },
          {
            label: isEditMode ? 'Atualizar' : 'Criar',
            icon: isEditMode ? PhPen : PhFolderSimplePlus,
          },
        ]"
      />

      <div class="flex gap-2">
        <router-link :to="{ name: 'Clients' }" class="btn btn-dash btn-secondary btn-sm"
          >Cancelar</router-link
        >
        <button
          type="submit"
          form="client-form"
          class="btn btn-active btn-success btn-sm"
          :disabled="loading"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          {{ isEditMode ? 'Atualizar' : 'Criar' }}
        </button>
      </div>
    </div>

    <form id="client-form" @submit="onSubmit">
      <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4">
        <LoaderComponent v-if="loadingData" :paddingY="173" />

        <div v-show="!loadingData" class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <!-- Nome -->
          <div class="w-full">
            <label class="label mb-1">Nome</label>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="Tiago Paulo"
              v-model="name"
              :class="{ 'input-error': errors.name }"
              maxlength="255"
            />
            <span v-if="errors.name" class="text-error text-xs mt-1">{{ errors.name }}</span>
          </div>

          <!-- Telefone -->
          <div class="w-full">
            <label class="label mb-1">Telefone</label>
            <InputPhone
              v-model="phone"
              :class="{ 'input-error': errors.phone }"
              @validate="validatePhone"
            />
            <span v-if="errors.phone" class="text-error text-xs mt-1">{{ errors.phone }}</span>
          </div>

        </div>
      </fieldset>
    </form>
  </div>
</template>
