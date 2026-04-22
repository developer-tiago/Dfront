<script setup lang="ts">
import { PhHouse, PhHairDryer, PhPen, PhTrash } from "@phosphor-icons/vue";
import { useRouter } from "vue-router";
import { onMounted, reactive, ref } from "vue";
import Breadcrumbs from "@/components/ui/Breadcrumbs.vue";
import type { Service } from "@/types";
import ServiceService from "@/services/services";
import { formatPrice } from "@/utils";
import { useToastStore } from '@/stores/toast';
import DeleteModal from "@/components/ui/DeleteModal.vue";

const services = reactive<Service[]>([]);
const router = useRouter();
const toastStore = useToastStore();
const isLoading = ref(true);
const deleteService = ref<Service | null>(null);
const deleting = ref(false);
const deleteModalRef = ref<{ open: () => void; close: () => void } | null>(
  null,
);

onMounted(() => {
  loadServices();
});

// Funções
async function loadServices() {
  isLoading.value = true;

  await ServiceService.index()
    .then((response) => {
      services.splice(0, services.length, ...response.data);
    })
    .catch((error) => {
      console.error("Erro ao carregar lista de serviços:", error);
    })
    .finally(() => {
      isLoading.value = false;
    });
}

async function handleDeleteService() {
  if (!deleteService.value?.id) return;

  deleting.value = true;

  try {
    await ServiceService.delete(deleteService.value.id);
    toastStore.triggerToast('Serviço excluído com sucesso!', 'success');
    deleteModalRef.value?.close();
    deleteService.value = null;
    await loadServices();
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
  } finally {
    deleting.value = false;
  }
}

function onDeleteClick(service: Service) {
  deleteService.value = service;
  deleteModalRef.value?.open();
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <!-- Breadcrumbs -->
    <div class="flex justify-between items-center mb-4">
      <Breadcrumbs
        :items="[
          { label: 'Home', to: '/', icon: PhHouse },
          { label: 'Serviços', icon: PhHairDryer },
        ]"
      />

      <router-link :to="{ name: 'ServiceCreate' }">
        <button class="btn btn-active btn-success btn-sm">
          Adicionar Serviço
        </button>
      </router-link>
    </div>

    <SkeletonComponent v-if="isLoading" />

    <div
      v-else-if="services.length > 0"
      class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Preço</th>
            <th>Duração</th>
            <td />
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in services" :key="service.name">
            <td>{{ service.name }}</td>
            <td>{{ formatPrice(service.price) }}</td>
            <td>{{ service.duration }}</td>
            <td class="text-right">
              <button
                class="btn btn-ghost btn-xs mr-2"
                @click="
                  router.push({
                    name: 'ServiceEdit',
                    params: { id: service.id },
                  })
                "
              >
                <PhPen :size="16" />
              </button>
              <button
                class="btn btn-ghost btn-xs"
                @click="onDeleteClick(service)"
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
      <PhHairDryer :size="48" class="text-base-content/30 mb-4" />
      <h3 class="text-lg font-semibold text-base-content/70">
        Nenhum serviço encontrado
      </h3>
      <p class="text-sm text-base-content/50">
        Comece adicionando um novo serviço.
      </p>
    </div>
  </div>

  <DeleteModal
    ref="deleteModalRef"
    title="Excluir serviço"
    :message="`Deseja realmente excluir o serviço ${deleteService?.name ?? ''}?`"
    :loading="deleting"
    @callback="handleDeleteService"
    @close="deleteService = null"
  />
</template>
