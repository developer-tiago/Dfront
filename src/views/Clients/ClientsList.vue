<script lang="ts" setup>
import { PhUsersThree, PhHouse, PhPen, PhTrash } from '@phosphor-icons/vue';
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import ClientService from '@/services/clients';
import type { Client } from '@/types';
import { formatPhone } from '@/utils/format-phone';
import { formatDateToBr } from '@/utils/format-date';
import SkeletonComponent from './components/SkeletonList.vue';
import { useToastStore } from '@/stores/toast';
import DeleteModal from '@/components/ui/DeleteModal.vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';

// Variáveis reativas
const clients = reactive<Array<Client>>([]);
const isLoading = ref(true);
const router = useRouter();
const toastStore = useToastStore();
const deleteClient = ref<Client | null>(null);
const deleting = ref(false);
const deleteModalRef = ref<{ open: () => void; close: () => void } | null>(null);

// Mounted
onMounted(() => {
  loadClients();
});

// Funções
async function loadClients() {
  isLoading.value = true;

  await ClientService.paginate()
    .then((response) => {
      clients.splice(0, clients.length, ...response.data.data);
    })
    .catch((error) => {
      console.error('Erro ao carregar lista de clientes:', error);
    })
    .finally(() => {
      isLoading.value = false;
    });
}

async function handleDeleteClient() {
  if (!deleteClient.value?.id) return;

  deleting.value = true;

  try {
    await ClientService.delete(deleteClient.value.id);
    toastStore.triggerToast('Cliente excluído com sucesso!', 'success');
    deleteModalRef.value?.close();
    deleteClient.value = null;
    await loadClients();
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
  } finally {
    deleting.value = false;
  }
}

function onDeleteClick(client: Client) {
  deleteClient.value = client;
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
          { label: 'Clientes', icon: PhUsersThree },
        ]"
      />

      <router-link :to="{ name: 'ClientCreate' }">
        <button class="btn btn-active btn-success btn-sm">Adicionar Cliente</button>
      </router-link>
    </div>

    <SkeletonComponent v-if="isLoading" />

    <div
      v-else-if="clients.length > 0"
      class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100"
    >
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Criado em</th>
            <td />
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in clients" :key="client.name">
            <td>{{ client.name }}</td>
            <td>{{ formatPhone(client.phone) }}</td>
            <td>{{ formatDateToBr(client.created_at) }}</td>
            <td class="text-right">
              <button
                class="btn btn-ghost btn-xs mr-2"
                @click="router.push({ name: 'ClientEdit', params: { id: client.id } })"
              >
                <PhPen :size="16" />
              </button>
              <button class="btn btn-ghost btn-xs" @click="onDeleteClick(client)">
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
      <PhUsersThree :size="48" class="text-base-content/30 mb-4" />
      <h3 class="text-lg font-semibold text-base-content/70">Nenhum cliente encontrado</h3>
      <p class="text-sm text-base-content/50">Comece adicionando um novo cliente.</p>
    </div>
  </div>

  <DeleteModal
    ref="deleteModalRef"
    title="Excluir cliente"
    :message="`Deseja realmente excluir o cliente ${deleteClient?.name ?? ''}?`"
    :loading="deleting"
    @callback="handleDeleteClient"
    @close="deleteClient = null"
  />
</template>
