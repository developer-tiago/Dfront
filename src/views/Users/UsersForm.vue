<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PhHouse, PhUserGear, PhPen, PhFolderSimplePlus } from '@phosphor-icons/vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import { useToastStore } from '@/stores/toast';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { UserSchema, UserEditSchema } from '@/schemas/user.schema';
import UserService from '@/services/users';
import LoaderComponent from '@/components/ui/AppLoader.vue';

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();
const loading = ref(false);
const loadingData = ref(false);
const isEditMode = computed(() => !!route.params.id);

const validationSchema = computed(() =>
  toTypedSchema(isEditMode.value ? UserEditSchema : UserSchema)
);
const { errors, defineField, setValues, handleSubmit } = useForm({
  validationSchema,
  initialValues: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
});
const [name] = defineField('name');
const [email] = defineField('email');
const [password] = defineField('password');
const [confirmPassword] = defineField('confirmPassword');

onMounted(async () => {
  if (isEditMode.value) await loadUserData();

  loadingData.value = false;
});

async function loadUserData() {
  loadingData.value = true;
  try {
    const response = await UserService.show(route.params.id as string);
    setValues(response.data);
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    toastStore.triggerToast('Erro ao carregar dados do usuário', 'error');
  } finally {
    loadingData.value = false;
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  try {
    loading.value = true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, email, password, ...basePayload } = formValues;

    if (isEditMode.value) {
      await UserService.update(route.params.id as string, {
        name: basePayload.name,
      });
      toastStore.triggerToast('Usuário atualizado com sucesso!', 'success');
    } else {
      await UserService.create({ ...basePayload, email: email!, password: password! });
      toastStore.triggerToast('Usuário criado com sucesso!', 'success');
    }

    router.push({ name: 'Users' });
  } catch (error: unknown) {
    const apiMessage =
      (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
      'Erro ao criar usuário';

    toastStore.triggerToast(apiMessage, 'error');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <!-- Breadcrumbs -->
    <div class="flex justify-between items-center mb-4">
      <Breadcrumbs
        :items="[
          { label: 'Home', to: '/', icon: PhHouse },
          { label: 'Usuários', to: { name: 'UserCreate' }, icon: PhUserGear },
          {
            label: isEditMode ? 'Atualizar' : 'Criar',
            icon: isEditMode ? PhPen : PhFolderSimplePlus,
          },
        ]"
      />

      <div class="flex gap-2">
        <router-link :to="{ name: 'Users' }" class="btn btn-dash btn-secondary btn-sm"
          >Cancelar</router-link
        >
        <button
          type="submit"
          form="users-form"
          class="btn btn-active btn-success btn-sm"
          :disabled="loading || loadingData"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          {{ isEditMode ? 'Atualizar' : 'Criar' }}
        </button>
      </div>
    </div>

    <form id="users-form" @submit="onSubmit" autocomplete="off">
      <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4">
        <LoaderComponent v-if="loadingData" :paddingY="17" />

        <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
          <div class="w-full md:col-span-6">
            <label class="label mb-1">Nome</label>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="Nome do usuário"
              v-model="name"
              :class="{ 'input-error': errors.name }"
              maxlength="255"
            />
            <span v-if="errors.name" class="text-error text-xs mt-1">{{ errors.name }}</span>
          </div>

          <div v-if="!isEditMode" class="w-full md:col-span-6">
            <label class="label mb-1">E-mail</label>
            <input
              type="text"
              class="input input-sm w-full"
              placeholder="E-mail do usuário"
              v-model="email"
              :class="{ 'input-error': errors.email }"
              maxlength="255"
              autocomplete="new-email"
            />
            <span v-if="errors.email" class="text-error text-xs mt-1">{{ errors.email }}</span>
          </div>

          <div v-if="!isEditMode" class="w-full md:col-span-6">
            <label class="label mb-1">Senha</label>
            <input
              type="password"
              class="input input-sm w-full"
              placeholder="Senha do usuário"
              v-model="password"
              :class="{ 'input-error': errors.password }"
              maxlength="100"
              autocomplete="new-password"
            />
            <span v-if="errors.password" class="text-error text-xs mt-1">{{
              errors.password
            }}</span>
          </div>

          <div v-if="!isEditMode" class="w-full md:col-span-6">
            <label class="label mb-1">Confirmação de Senha</label>
            <input
              type="password"
              class="input input-sm w-full"
              placeholder="Confirmação de senha do usuário"
              v-model="confirmPassword"
              :class="{ 'input-error': errors.confirmPassword }"
              maxlength="100"
              autocomplete="new-password"
            />
            <span v-if="errors.confirmPassword" class="text-error text-xs mt-1">{{
              errors.confirmPassword
            }}</span>
          </div>
        </div>
      </fieldset>
    </form>
  </div>
</template>
