<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';
import { PhSun, PhMoon } from '@phosphor-icons/vue';
import InputPhone from '@/components/forms/InputPhone.vue';
import { useToastStore } from '@/stores/toast';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { RegisterSchema } from '@/schemas/register.schema';
import type { AuthRegister, PhoneValidationEvent } from '@/types';

const loginEmail = ref('');
const loginPassword = ref('');

const error = ref<string | null>(null);
const loading = ref(false);
const currentTheme = ref('lofi');

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const toastStore = useToastStore();

const isRegister = computed(() => route.path === '/register');
const lastPhoneValidation = ref<PhoneValidationEvent | null>(null);
const phoneTouched = ref(false);

const { errors, defineField, handleSubmit, setFieldError, setFieldValue, values, resetForm } =
  useForm<AuthRegister>({
    validationSchema: toTypedSchema(RegisterSchema),
    initialValues: {
      account_name: '',
      account_slug: '',
      account_country_code: '',
      account_phone: '',
      account_phone_validate: false,
      user_name: '',
      user_email: '',
      user_password: '',
    },
  });
const [account_name] = defineField('account_name');
const [account_slug] = defineField('account_slug');
const [account_phone] = defineField('account_phone', { validateOnModelUpdate: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const [account_phone_validate] = defineField('account_phone_validate');
const [user_name] = defineField('user_name');
const [user_email] = defineField('user_email');
const [user_password] = defineField('user_password', { validateOnModelUpdate: false });

const passwordTouched = ref(false);

// Validação visual dos requisitos da senha
const passwordRequirements = computed(() => {
  const password = user_password.value || '';
  return {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };
});

const passwordIsValid = computed(() => {
  const req = passwordRequirements.value;
  return (
    req.minLength && req.hasUpperCase && req.hasLowerCase && req.hasNumber && req.hasSpecialChar
  );
});

// Controla se deve mostrar erro visual na senha
const passwordHasError = computed(() => {
  return passwordTouched.value && !passwordIsValid.value;
});

onMounted(() => {
  currentTheme.value = localStorage.getItem('theme') || 'lofi';
});

// Observa mudanças na rota para pegar o parâmetro email quando vem do registro
watch(
  () => route.query.email,
  (email) => {
    if (!isRegister.value && email) {
      loginEmail.value = email as string;
      loginPassword.value = '';
      // Limpa o parâmetro email da URL
      router.replace({ path: '/login', query: {} });
    }
  }
);

// Limpa erro do Zod quando campo de senha é tocado para mostrar validação visual
watch(
  () => passwordTouched.value,
  (touched) => {
    if (touched) {
      setFieldError('user_password', undefined);
    }
  }
);

// Cria um slug automaticamente a partir do nome do salão
watch(account_name, (newName) => {
  if (newName) {
    const normalizedSlug = newName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');

    setFieldValue('account_slug', normalizedSlug);
  }
});

const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'lofi' ? 'forest' : 'lofi';
  document.documentElement.setAttribute('data-theme', currentTheme.value);
  localStorage.setItem('theme', currentTheme.value);
};

const toggleMode = () => {
  if (isRegister.value) {
    // Reseta o formulário completamente (valores + erros)
    resetForm();
    account_phone.value = '+55';
    lastPhoneValidation.value = null;
    phoneTouched.value = false;
    passwordTouched.value = false;
    router.push('/login');
  } else {
    loginEmail.value = '';
    loginPassword.value = '';
    error.value = null;
    router.push('/register');
  }
};

const handleLogin = async () => {
  error.value = null;
  loading.value = true;

  try {
    await auth.login(loginEmail.value, loginPassword.value);
    router.replace('/');
  } catch (err) {
    console.log(err);
    error.value = 'Credenciais inválidas';
  } finally {
    loading.value = false;
  }
};

const onRegisterSubmit = async () => {
  phoneTouched.value = true;
  passwordTouched.value = true;

  // Valida telefone manualmente via lastPhoneValidation
  if (!lastPhoneValidation.value?.valid) {
    setFieldError('account_phone_validate', 'Telefone inválido');
    setFieldValue('account_phone_validate', false);
  } else {
    // Se telefone válido, limpa erro
    setFieldError('account_phone_validate', undefined);
    setFieldValue('account_phone_validate', true);
  }

  // Sempre chama handleRegister para validar os outros campos via Zod
  await handleRegister();
};

const handleRegister = handleSubmit(async (formValues: AuthRegister) => {
  // Bloqueia o envio se o telefone não for válido
  if (!lastPhoneValidation.value?.valid) {
    return;
  }

  // Bloqueia o envio se a senha não for válida
  if (!passwordIsValid.value) {
    return;
  }

  // Mescla os valores do formulário com os campos manuais (telefone e código do país)
  const payload = {
    ...formValues,
    account_phone: values.account_phone,
    account_country_code: values.account_country_code,
  };

  loading.value = true;

  try {
    await auth.register(payload);

    const email = user_email.value;

    toastStore.triggerToast('Cadastro realizado com sucesso!', 'success');

    resetForm();
    lastPhoneValidation.value = null;
    phoneTouched.value = false;
    passwordTouched.value = false;

    router.push(`/login?email=${email}`);
  } catch (err) {
    const e = err as AxiosError<{ message: string }>;
    console.log(e);
    if (e.response?.status === 409) {
      setFieldError('user_email', 'Email já está em uso');
      return;
    }

    toastStore.triggerToast('Erro ao registrar usuário', 'error');
  } finally {
    loading.value = false;
  }
});

function validatePhone(event: PhoneValidationEvent) {
  lastPhoneValidation.value = event;
  const { valid, countryCode } = event;

  // Só mostra erros se o campo foi tocado
  if (!phoneTouched.value) {
    phoneTouched.value = true;
    return;
  }

  // Se não for válido → "Telefone inválido"
  if (!valid) {
    setFieldError('account_phone_validate', 'Telefone inválido');
    setFieldValue('account_phone_validate', false);
    return;
  }

  // Se for válido → limpa erro e salva país
  if (valid) {
    setFieldError('account_phone_validate', undefined);
    setFieldValue('account_phone_validate', true);
    if (countryCode) setFieldValue('account_country_code', countryCode);
  }
}
</script>

<template>
  <div class="flex h-screen w-full flex-col items-center justify-center bg-base-200">
    <div
      class="relative min-h-[600px] w-[768px] max-w-full overflow-hidden rounded-[30px] bg-base-100 shadow-2xl"
    >
      <!-- Register -->
      <div
        class="absolute top-0 left-0 h-full w-1/2 transition-all duration-600 ease-in-out"
        :class="[isRegister ? 'translate-x-full opacity-100 z-50' : 'opacity-0 z-10']"
      >
        <form
          @submit.prevent="onRegisterSubmit"
          autocomplete="off"
          class="relative flex h-full flex-col items-center justify-center bg-base-100 px-10 text-center"
        >
          <button
            class="absolute top-4 right-4 btn btn-circle btn-ghost"
            @click="toggleTheme"
            type="button"
          >
            <PhSun v-if="currentTheme === 'forest'" size="24" />
            <PhMoon v-else size="24" />
          </button>
          <h1 class="font-bold text-2xl mb-4">Criar conta</h1>
          <div class="flex flex-col items-start">
            <input
              v-model="account_name"
              :class="{ 'input-error': errors.account_name }"
              type="text"
              placeholder="Nome do salão"
              autocomplete="off"
              class="input input-sm input-bordered w-full bg-base-200"
            />
            <span v-if="errors.account_name" class="text-error text-xs mt-1">{{
              errors.account_name
            }}</span>

            <input
              v-model="account_slug"
              :class="{ 'input-error': errors.account_slug }"
              type="text"
              placeholder="Slug do salão"
              autocomplete="off"
              class="mt-2 input input-sm input-bordered w-full bg-base-200"
            />
            <span v-if="errors.account_slug" class="text-error text-xs mt-1">{{
              errors.account_slug
            }}</span>

            <InputPhone
              v-model="account_phone"
              :class="{ 'input-error': errors.account_phone_validate }"
              class="mt-2 bg-base-200"
              @validate="validatePhone"
            />
            <span v-if="errors.account_phone_validate" class="text-error text-xs mt-1">{{
              errors.account_phone_validate
            }}</span>

            <input
              v-model="user_name"
              :class="{ 'input-error': errors.user_name }"
              type="text"
              placeholder="Seu nome"
              autocomplete="off"
              class="input input-sm input-bordered w-full mt-2 bg-base-200"
            />
            <span v-if="errors.user_name" class="text-error text-xs mt-1">{{
              errors.user_name
            }}</span>

            <input
              v-model="user_email"
              :class="{ 'input-error': errors.user_email }"
              type="email"
              placeholder="E-mail"
              autocomplete="new-email"
              class="input input-sm input-bordered w-full mt-2 bg-base-200"
            />
            <span v-if="errors.user_email" class="text-error text-xs mt-1">{{
              errors.user_email
            }}</span>

            <label class="w-full mt-2">
              <div
                class="input input-sm input-bordered flex items-center gap-2 bg-base-200"
                :class="{ 'input-error': passwordHasError }"
              >
                <svg
                  class="h-4 w-4 opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"
                  />
                  <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
                </svg>
                <input
                  v-model="user_password"
                  type="password"
                  class="grow"
                  placeholder="Senha"
                  autocomplete="new-password"
                  @focus="passwordTouched = true"
                />
              </div>
            </label>
            <div
              v-if="passwordTouched && !passwordIsValid"
              class="text-xs mt-1 space-y-0.5 text-left w-full"
            >
              <p class="font-medium text-base-content/70">A senha deve conter:</p>
              <p :class="passwordRequirements.minLength ? 'text-success' : 'text-error'">
                {{ passwordRequirements.minLength ? '✓' : '✗' }} Mínimo de 8 caracteres
              </p>
              <p :class="passwordRequirements.hasUpperCase ? 'text-success' : 'text-error'">
                {{ passwordRequirements.hasUpperCase ? '✓' : '✗' }} Uma letra maiúscula
              </p>
              <p :class="passwordRequirements.hasLowerCase ? 'text-success' : 'text-error'">
                {{ passwordRequirements.hasLowerCase ? '✓' : '✗' }} Uma letra minúscula
              </p>
              <p :class="passwordRequirements.hasNumber ? 'text-success' : 'text-error'">
                {{ passwordRequirements.hasNumber ? '✓' : '✗' }} Um número
              </p>
              <p :class="passwordRequirements.hasSpecialChar ? 'text-success' : 'text-error'">
                {{ passwordRequirements.hasSpecialChar ? '✓' : '✗' }} Um caractere especial
              </p>
            </div>
            <span v-if="errors.user_password && !passwordTouched" class="text-error text-xs mt-1">{{
              errors.user_password
            }}</span>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn btn-primary mt-4 uppercase tracking-wider px-8"
          >
            <span v-if="loading" class="loading loading-spinner loading-xs"></span>
            Criar
          </button>
        </form>
      </div>

      <!-- Login -->
      <div
        class="absolute top-0 left-0 h-full w-1/2 z-20 transition-all duration-600 ease-in-out"
        :class="[isRegister ? 'translate-x-full' : '']"
      >
        <form
          @submit.prevent="handleLogin"
          class="relative flex h-full flex-col items-center justify-center bg-base-100 px-10 text-center"
        >
          <button
            class="absolute top-4 right-4 btn btn-circle btn-ghost"
            @click="toggleTheme"
            type="button"
          >
            <PhSun v-if="currentTheme === 'forest'" size="24" />
            <PhMoon v-else size="24" />
          </button>
          <h1 class="font-bold text-2xl mb-4">Acesse sua conta</h1>
          <input
            v-model="loginEmail"
            type="email"
            placeholder="E-mail"
            class="input input-sm input-bordered w-full my-2 bg-base-200"
          />
          <input
            v-model="loginPassword"
            type="password"
            placeholder="Senha"
            class="input input-sm input-bordered w-full my-2 bg-base-200"
          />

          <button
            type="submit"
            :disabled="loading"
            class="btn btn-primary mt-4 uppercase tracking-wider px-8"
          >
            Entrar
          </button>
          <p v-if="error" class="mt-4 text-xs text-error">{{ error }}</p>
        </form>
      </div>

      <!-- Toggle Container -->
      <div
        class="absolute top-0 left-1/2 z-[100] h-full w-1/2 overflow-hidden transition-all duration-600 ease-in-out"
        :class="[isRegister ? '-translate-x-full rounded-r-[150px]' : 'rounded-l-[150px]']"
      >
        <div
          class="relative -left-full h-full w-[200%] bg-primary text-primary-content transition-all duration-600 ease-in-out"
          :class="[isRegister ? 'translate-x-1/2' : 'translate-x-0']"
        >
          <!-- Toggle Left (Visible on Register) -->
          <div
            class="absolute top-0 flex h-full w-1/2 flex-col items-center justify-center px-[30px] text-center transition-all duration-600 ease-in-out"
            :class="[isRegister ? 'translate-x-0' : '-translate-x-[200%]']"
          >
            <h1 class="font-bold text-2xl">Bom te ver de novo</h1>
            <p class="my-5 text-sm leading-5 tracking-[0.3px]">
              Entre para continuar gerenciando seu salão.
            </p>
            <button
              @click="toggleMode"
              class="btn btn-outline btn-accent text-white border-white hover:bg-white hover:text-primary uppercase tracking-wider px-8"
            >
              Entrar
            </button>
          </div>

          <!-- Toggle Right (Visible on Login) -->
          <div
            class="absolute top-0 right-0 flex h-full w-1/2 flex-col items-center justify-center px-[30px] text-center transition-all duration-600 ease-in-out"
            :class="[isRegister ? 'translate-x-[200%]' : 'translate-x-0']"
          >
            <h1 class="font-bold text-2xl">Gerencie seu salão com mais controle</h1>
            <p class="my-5 text-sm leading-5 tracking-[0.3px]">
              Crie sua conta e comece a organizar serviços, horários e clientes em minutos.
            </p>
            <button
              @click="toggleMode"
              class="btn btn-outline btn-accent text-white border-white hover:bg-white hover:text-primary uppercase tracking-wider px-8"
            >
              Criar conta
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Remove fundo amarelado do autocomplete do navegador */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px hsl(var(--b2)) inset !important;
  -webkit-text-fill-color: hsl(var(--bc)) !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
