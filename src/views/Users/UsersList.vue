<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { PhHouse, PhUserGear, PhPen, PhTrash } from '@phosphor-icons/vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import DeleteModal from '@/components/ui/DeleteModal.vue';
import SkeletonComponent from './components/SkeletonList.vue';
import UserService from '@/services/users';
import { useToastStore } from '@/stores/toast';
import type { User } from '@/types';

// Variáveis reativas
const loading = ref(true);
const users = ref<Array<User>>([]);
const router = useRouter();
const toastStore = useToastStore();
const deleteUser = ref<User | null>(null);
const deleting = ref(false);
const deleteModalRef = ref<{ open: () => void; close: () => void } | null>(null);

onMounted(() => {
  loadUsers();
});

async function loadUsers() {
  try {
    const response = await UserService.index();

    users.value = response.data;
  } catch (error) {
    console.error('Erro ao carregar lista de usuários:', error);
  } finally {
    loading.value = false;
  }
}

function onDeleteClick(user: User) {
  deleteUser.value = user;
  deleteModalRef.value?.open();
}

async function handleDeleteUser() {
  if (!deleteUser.value?.id) return;

  deleting.value = true;

  try {
    await UserService.delete(deleteUser.value.id);
    toastStore.triggerToast('Usuário excluído com sucesso!', 'success');
    deleteModalRef.value?.close();
    deleteUser.value = null;
    await loadUsers();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    toastStore.triggerToast('Erro ao excluir usuário', 'error');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <div class="flex justify-between items-center mb-4">
      <Breadcrumbs
        :items="[
          { label: 'Home', to: '/', icon: PhHouse },
          { label: 'Usuários', icon: PhUserGear },
        ]"
      />

      <router-link :to="{ name: 'UserCreate' }">
        <button class="btn btn-active btn-success btn-sm">Adicionar Usuário</button>
      </router-link>
    </div>

    <SkeletonComponent v-if="loading" />

    <div v-else class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
      <table class="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <div class="flex items-center gap-3">
                <div class="avatar">
                  <div class="mask mask-squircle h-12 w-12">
                    <img
                      :src="`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=e0e0e0,d4d4d4,c7c7c7,b0b0b0,f5f5f0&textColor=1a1a1a`"
                      :alt="`Avatar do usuário ${user.name}`"
                    />
                  </div>
                </div>
                <div>
                  <div class="font-bold">{{ user.name }}</div>
                </div>
              </div>
            </td>
            <td>
              {{ user.email }}
            </td>
            <td class="text-right">
              <button
                class="btn btn-ghost btn-xs mr-2"
                @click="router.push({ name: 'UserEdit', params: { id: user.id } })"
              >
                <PhPen :size="16" />
              </button>
              <button class="btn btn-ghost btn-xs" @click="onDeleteClick(user)">
                <PhTrash :size="16" class="text-error" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <DeleteModal
    ref="deleteModalRef"
    title="Excluir usuário"
    :message="`Deseja realmente excluir o usuário ${deleteUser?.name ?? ''}?`"
    :loading="deleting"
    @callback="handleDeleteUser"
    @close="deleteUser = null"
  />
</template>
