<!-- eslint-disable vue/multi-word-component-names -->
<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import {
  PhHouse,
  PhHairDryer,
  PhFolderSimplePlus,
  PhPen,
} from "@phosphor-icons/vue";
import Breadcrumbs from "@/components/ui/Breadcrumbs.vue";
import LoaderComponent from "@/components/ui/AppLoader.vue";
import ServiceService from "@/services/services";
import {
  ServiceFormSchema,
  type ServiceFormValues,
} from "@/schemas/service.schema";
import type { Service } from "@/types";
import { useToastStore } from "@/stores/toast";
import InputMoney from "@/components/forms/InputMoney.vue";

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();

const isEditMode = computed(() => !!route.params.id);
const loading = ref(false);
const loadingData = ref(false);

const { errors, defineField, setValues, handleSubmit } = useForm<ServiceFormValues>({
  validationSchema: toTypedSchema(ServiceFormSchema),
  initialValues: {
    name: "",
    price: 0,
    duration: "",
  },
});

const [name] = defineField("name");
const [price] = defineField("price");
const [duration] = defineField("duration");

onMounted(() => {
  if (isEditMode.value) loadServiceData();
});

async function loadServiceData() {
  loadingData.value = true;

  try {
    const { data } = await ServiceService.show(route.params.id as string);
    const service = data as Service;

    setValues({
      name: service.name ?? "",
      price: service.price ?? 0,
      duration: service.duration,
    });
  } catch (error) {
    console.error("Erro ao carregar serviço:", error);
    toastStore.triggerToast("Erro ao carregar serviço.", "error");
  } finally {
    loadingData.value = false;
  }
}

const onSubmit = handleSubmit(async (formValues) => {
  loading.value = true;

  try {
    const payload = {
      name: formValues.name,
      price: Number(formValues.price),
      duration: formValues.duration,
    };

    if (isEditMode.value) {
      await ServiceService.update(route.params.id as string, payload);
      toastStore.triggerToast("Serviço atualizado com sucesso!", "success");
    } else {
      await ServiceService.create(payload);
      toastStore.triggerToast("Serviço criado com sucesso!", "success");
    }

    router.push({ name: "Services" });
  } catch (error) {
    console.error("Erro ao salvar serviço:", error);
    toastStore.triggerToast("Erro ao salvar serviço.", "error");
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <div class="flex justify-between items-center mb-4">
      <Breadcrumbs
        :items="[
          { label: 'Home', to: '/', icon: PhHouse },
          { label: 'Serviços', to: { name: 'Services' }, icon: PhHairDryer },
          {
            label: isEditMode ? 'Atualizar' : 'Criar',
            icon: isEditMode ? PhPen : PhFolderSimplePlus,
          },
        ]"
      />

      <div class="flex gap-2">
        <router-link
          :to="{ name: 'Services' }"
          class="btn btn-dash btn-secondary btn-sm"
          >Cancelar</router-link
        >
        <button
          type="submit"
          form="service-form"
          class="btn btn-active btn-success btn-sm"
          :disabled="loading"
        >
          <span
            v-if="loading"
            class="loading loading-spinner loading-xs"
          ></span>
          {{ isEditMode ? "Atualizar" : "Criar" }}
        </button>
      </div>
    </div>

    <form id="service-form" @submit="onSubmit" autocomplete="off">
      <fieldset
        class="fieldset bg-base-200 border-base-300 rounded-box w-full border p-4"
      >
        <LoaderComponent v-if="loadingData" :paddingY="173" />

        <div
          v-show="!loadingData"
          class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
        >
          <div class="w-full">
            <label class="label mb-1">Nome</label>
            <input
              v-model="name"
              type="text"
              class="input input-sm w-full"
              placeholder="Ex: Corte Feminino"
              :class="{ 'input-error': errors.name }"
              maxlength="255"
            />
            <span v-if="errors.name" class="text-error text-xs mt-1">{{
              errors.name
            }}</span>
          </div>

          <div class="w-full">
            <label class="label mb-1">Preço</label>
            <InputMoney
              v-model="price"
              :class="{ 'input-error': errors.price }"
            />
            <span v-if="errors.price" class="text-error text-xs mt-1">{{
              errors.price
            }}</span>
          </div>

          <div class="w-full">
            <label class="label mb-1">Duração</label>
            <input
              v-model="duration"
              type="time"
              class="input input-sm w-full"
              :class="{ 'input-error': errors.duration }"
            />
            <span v-if="errors.duration" class="text-error text-xs mt-1">{{
              errors.duration
            }}</span>
          </div>
        </div>
      </fieldset>
    </form>
  </div>
</template>
