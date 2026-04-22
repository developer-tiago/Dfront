<script lang="ts" setup>
import { PhHouse, PhUserCircleGear } from '@phosphor-icons/vue';
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { UserProfileEditSchema } from '@/schemas/user.schema';
import type { ProfileUpdateData } from '@/types/auth';
import AuthService from '@/services/auth';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import LoaderComponent from '@/components/ui/AppLoader.vue';

const auth = useAuthStore();
const toast = useToastStore();
const loading = ref(false);
const loadingData = ref(true);

const { handleSubmit, defineField, errors, setValues } = useForm<ProfileUpdateData>({
  validationSchema: toTypedSchema(UserProfileEditSchema),
});

const [name] = defineField('name');
const [currentPassword] = defineField('current_password');
const [newPassword] = defineField('password');
const [confirmPassword] = defineField('password_confirmation');

onMounted(() => {
  loadProfileData();
});

async function loadProfileData() {
  try {
    const response = await AuthService.getProfile();
    setValues({
      name: response.data.name,
      current_password: '',
      password: '',
      password_confirmation: '',
    });
  } catch (error) {
    console.log(error);
    toast.triggerToast('Erro ao carregar perfil', 'error');
  } finally {
    loadingData.value = false;
  }
}

const onSubmit = handleSubmit(async (values) => {
  try {
    loading.value = true;

    const payload: Parameters<typeof AuthService.updateProfile>[0] = {
      name: values.name,
    };

    if (values.password && values.current_password && values.password_confirmation) {
      payload.current_password = values.current_password;
      payload.password = values.password;
      payload.password_confirmation = values.password_confirmation;
    }

    await AuthService.updateProfile(payload);

    // Atualizar dados do usuário na store
    if (auth.user) {
      auth.user.name = values.name;
    }

    toast.triggerToast('Perfil atualizado com sucesso!', 'success', 3000);

    // Limpar campos de senha
    setValues({
      current_password: '',
      password: '',
      password_confirmation: '',
    });
  } catch (error) {
    console.log(error);
    toast.triggerToast('Erro ao atualizar perfil', 'error');
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
          { label: 'Meu perfil', icon: PhUserCircleGear },
        ]"
      />

      <div class="flex gap-2">
        <button
          type="submit"
          form="profile-form"
          class="btn btn-active btn-success btn-sm"
          :disabled="loading"
        >
          <span v-if="loading" class="loading loading-spinner loading-xs"></span>
          Salvar Alterações
        </button>
      </div>
    </div>

    <form id="profile-form" @submit="onSubmit">
      <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4">
        <LoaderComponent v-if="loadingData" :paddingY="114" />

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <!-- Nome -->
          <div class="w-full">
            <label class="label mb-1">Nome</label>
            <input
              v-model="name"
              type="text"
              placeholder="Seu nome"
              class="input input-sm w-full"
              :class="{ 'input-error': errors.name }"
              maxlength="255"
            />
            <span v-if="errors.name" class="text-error text-xs mt-1">{{ errors.name }}</span>
          </div>

          <!-- E-mail -->
          <div class="w-full">
            <label class="label mb-1">E-mail</label>
            <input :value="auth.user?.email" type="email" class="input input-sm w-full" readonly />
            <span class="text-xs mt-1 opacity-70">O e-mail não pode ser alterado</span>
          </div>

          <!-- Senha Atual -->
          <div class="w-full">
            <label class="label mb-1">Senha Atual</label>
            <input
              v-model="currentPassword"
              type="password"
              placeholder="Digite sua senha atual"
              class="input input-sm w-full"
              :class="{ 'input-error': errors.current_password }"
              autocomplete="new-password"
            />
            <span v-if="errors.current_password" class="text-error text-xs mt-1">{{
              errors.current_password
            }}</span>
          </div>

          <!-- Nova Senha -->
          <div class="w-full">
            <label class="label mb-1">Nova Senha</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="Digite a nova senha"
              class="input input-sm w-full"
              :class="{ 'input-error': errors.password }"
              autocomplete="new-password"
            />
            <span v-if="errors.password" class="text-error text-xs mt-1">{{
              errors.password
            }}</span>
          </div>

          <!-- Confirmar Nova Senha -->
          <div class="w-full col-span-2">
            <label class="label mb-1">Confirmar Nova Senha</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirme a nova senha"
              class="input input-sm w-full"
              :class="{ 'input-error': errors.password_confirmation }"
              autocomplete="new-password"
            />
            <span v-if="errors.password_confirmation" class="text-error text-xs mt-1">{{
              errors.password_confirmation
            }}</span>
            <span class="text-xs mt-1 opacity-70 block"
              >Deixe os campos de senha vazios se não quiser alterá-la</span
            >
          </div>
        </div>
      </fieldset>
    </form>
  </div>
</template>
