<script lang="ts" setup>
import {
  PhHouse,
  PhUsersThree,
  PhUserCircleGear,
  PhBuildings,
  PhHairDryer,
  PhSun,
  PhMoon,
  PhCalendarDots,
  PhSignOut,
  PhChartDonut,
  PhUserGear,
} from "@phosphor-icons/vue";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Icon from "/favicon.png";

const isDark = ref(false);

const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  // Carregar tema salvo
  const savedTheme = localStorage.getItem('theme') || 'lofi';
  document.documentElement.setAttribute("data-theme", savedTheme);
  isDark.value = savedTheme === "forest";

  // Atualizar checkbox
  const themeController = document.querySelector(
    ".theme-controller",
  ) as HTMLInputElement | null;
  if (themeController) {
    themeController.checked = isDark.value;
  }
});

const toggleTheme = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const theme = target.checked ? 'forest' : 'lofi';
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  isDark.value = target.checked;
};

const logout = async () => {
  await auth.logout();
  router.replace("/login");
};
</script>

<template>
  <div class="drawer drawer-open">
    <input id="my-drawer-4" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content">
      <!-- Navbar -->
      <nav class="navbar w-full bg-base-200 flex justify-between px-4">
        <div class="flex flex-row items-center"></div>

        <div>
          <label class="toggle text-base-content">
            <input
              type="checkbox"
              class="theme-controller"
              @change="toggleTheme"
            />
            <PhSun :size="16" />
            <PhMoon :size="16" />
          </label>
        </div>
      </nav>
      <!-- Page content here -->
      <div class="p-4">
        <router-view />
      </div>
    </div>

    <div class="drawer-side is-drawer-close:overflow-visible">
      <label
        for="my-drawer-4"
        aria-label="close sidebar"
        class="drawer-overlay"
      ></label>
      <div
        class="flex min-h-full flex-col items-start bg-base-200 is-drawer-close:w-14 is-drawer-open:w-64"
      >
        <!-- Sidebar content here -->
        <ul class="menu w-full grow">
          <li class="mb-3">
            <label
              for="my-drawer-4"
              aria-label="open sidebar"
              class="btn btn-ghost mt-1 flex items-center gap-2 justify-start px-0"
            >
              <img :src="Icon" alt="icon" class="w-6 h-6 ml-2" />
              <span
                class="is-drawer-close:hidden leading-none text-lg font-bold tracking-wide"
                >
                {{ auth.user?.account_name }}</span
              >
            </label>
          </li>
          <li class="mb-3 mt-[20px]">
            <router-link
              :to="{ name: 'Dashboard' }"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Home"
            >
              <PhHouse :size="16" />
              <span class="is-drawer-close:hidden leading-none">Home</span>
            </router-link>
          </li>

          <li class="mb-3">
            <router-link
              :to="{ name: 'Appointments' }"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Agendamentos"
            >
              <PhCalendarDots :size="16" />
              <span class="is-drawer-close:hidden leading-none">Agendamentos</span>
            </router-link>
          </li>

          <li class="mb-3">
            <router-link
              :to="{ name: 'Clients' }"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Clientes"
            >
              <PhUsersThree :size="16" />
              <span class="is-drawer-close:hidden leading-none">Clientes</span>
            </router-link>
          </li>

          <li class="mb-3">
            <router-link
              :to="{ name: 'Services' }"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Serviços"
            >
              <PhHairDryer :size="16" />
              <span class="is-drawer-close:hidden leading-none">Serviços</span>
            </router-link>
          </li>

          <li class="mb-3">
            <router-link
              :to="{ name: 'Reports' }"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Relatórios"
            >
              <PhChartDonut :size="16" />
              <span class="is-drawer-close:hidden leading-none"
                >Relatórios</span
              >
            </router-link>
          </li>

          <li class="mb-3 mt-auto">
            <router-link
              :to="{ name: 'AccountSettings' }"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Empresa"
            >
              <PhBuildings :size="16" />
              <span class="is-drawer-close:hidden leading-none">Empresa</span>
            </router-link>
          </li>

          <li class="mb-3">
            <router-link
              :to="{ name: 'ProfileSettings' }"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Meu Perfil"
            >
              <PhUserCircleGear :size="16" />
              <span class="is-drawer-close:hidden leading-none"
                >Meu Perfil</span
              >
            </router-link>
          </li>

          <li class="mb-3">
            <router-link
              :to="{ name: 'Users' }"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Usuários"
            >
              <PhUserGear :size="16" />
              <span class="is-drawer-close:hidden leading-none">Usuários</span>
            </router-link>
          </li>

          <li class="mb-5">
            <button
              @click="logout"
              class="is-drawer-close:tooltip is-drawer-close:tooltip-right flex items-center gap-2"
              data-tip="Sair"
            >
              <PhSignOut :size="16" />

              <span class="is-drawer-close:hidden leading-none">Sair</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
