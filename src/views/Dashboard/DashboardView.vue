<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  PhUsers, 
  PhCalendar, 
  PhTrendUp, 
  PhHourglass,
  PhCaretRight,
  PhCalendarCheck
} from "@phosphor-icons/vue";
import ReportsService from '@/services/reports';
import AppointmentService from '@/services/appointments';
import ClientService from '@/services/clients';
import type { Appointment } from '@/types';
import { formatPrice } from '@/utils';
import { formatDateToBr } from '@/utils/format-date';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';
import LoaderComponent from '@/components/ui/AppLoader.vue';

const router = useRouter();
const loading = ref(true);
const stats = ref({
  revenue: 0,
  appointmentsCount: 0,
  clientsCount: 0,
  pendingCount: 0
});

const recentAppointments = ref<Appointment[]>([]);

// Gráfico de Agendamentos (Miniatura)
const appointmentsSeries = ref([{ name: 'Agendamentos', data: [] as number[] }]);
const appointmentsOptions = ref<ApexOptions>({
  chart: {
    type: 'area',
    fontFamily: 'inherit',
    toolbar: { show: false },
    sparkline: { enabled: true }
  },
  stroke: { curve: 'smooth', width: 2 },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [20, 100, 100, 100]
    }
  },
  colors: ['#3b82f6'],
  tooltip: { enabled: false }
});

onMounted(async () => {
  try {
    const [revRes, apptsRes, clientsRes, listRes] = await Promise.all([
      ReportsService.revenueInWeek(),
      ReportsService.appointmentsInWeek(),
      ClientService.paginate(1, 1), 
      AppointmentService.paginate(1, 5) 
    ]);

    // Revenue
    stats.value.revenue = Number(revRes.data?.total || 0);

    // Appointments Weekly Count
    const weeklyAppts = apptsRes.data || [];
    stats.value.appointmentsCount = weeklyAppts.reduce((acc: number, curr: any) => acc + Number(curr.total), 0);
    
    // Chart data
    appointmentsSeries.value = [{
      name: 'Agendamentos',
      data: weeklyAppts.map((a: any) => Number(a.total))
    }];

    // Clients Count
    stats.value.clientsCount = clientsRes.data?.total || clientsRes.data?.length || 0;

    // Recent Appointments
    recentAppointments.value = listRes.data?.data || [];
    
    // Pending Count (Mock ou filtrar da lista se disponível)
    // Para simplificar, vamos contar os pendentes da lista carregada ou apenas deixar fixo por enquanto
    stats.value.pendingCount = recentAppointments.value.filter(a => a.status === 'pending').length;

  } catch (error) {
    console.error('Erro ao carregar dados do dashboard:', error);
  } finally {
    loading.value = false;
  }
});

function getStatusClass(status: string) {
  switch (status) {
    case 'accepted': return 'badge-success';
    case 'rejected': return 'badge-error';
    default: return 'badge-warning';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'accepted': return 'Confirmado';
    case 'rejected': return 'Cancelado';
    default: return 'Pendente';
  }
}
</script>

<template>
  <div class="p-6 space-y-8 h-[calc(100vh-96px)] overflow-y-auto">
    <div class="flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p class="text-base-content/60">Bem-vindo de volta! Aqui está o resumo de hoje.</p>
      </div>
      <div class="hidden sm:block">
        <router-link :to="{ name: 'AppointmentCreate' }" class="btn btn-primary btn-sm">
          <PhCalendarCheck :size="18" />
          Novo Agendamento
        </router-link>
      </div>
    </div>

    <LoaderComponent v-if="loading" :paddingY="100" />

    <template v-else>
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Faturamento -->
        <div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
          <div class="p-5 flex justify-between items-start">
            <div>
              <p class="text-sm font-medium opacity-60">Faturamento Semanal</p>
              <h3 class="text-2xl font-bold mt-1">{{ formatPrice(stats.revenue) }}</h3>
            </div>
            <div class="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <PhTrendUp :size="24" />
            </div>
          </div>
          <div class="h-12 w-full">
            <!-- Mini gráfico ou apenas decoração -->
          </div>
        </div>

        <!-- Agendamentos -->
        <div class="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
          <div class="p-5 flex justify-between items-start">
            <div>
              <p class="text-sm font-medium opacity-60">Agendamentos na Semana</p>
              <h3 class="text-2xl font-bold mt-1">{{ stats.appointmentsCount }}</h3>
            </div>
            <div class="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <PhCalendar :size="24" />
            </div>
          </div>
          <div class="h-12 w-full px-2">
            <VueApexCharts 
              type="area" 
              height="48" 
              :options="appointmentsOptions" 
              :series="appointmentsSeries" 
            />
          </div>
        </div>

        <!-- Clientes -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="p-5 flex justify-between items-start">
            <div>
              <p class="text-sm font-medium opacity-60">Total de Clientes</p>
              <h3 class="text-2xl font-bold mt-1">{{ stats.clientsCount }}</h3>
            </div>
            <div class="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
              <PhUsers :size="24" />
            </div>
          </div>
          <div class="px-5 pb-4">
            <div class="text-[10px] uppercase font-bold opacity-40">Base de dados ativa</div>
          </div>
        </div>

        <!-- Pendentes -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="p-5 flex justify-between items-start">
            <div>
              <p class="text-sm font-medium opacity-60">Pendentes de Retorno</p>
              <h3 class="text-2xl font-bold mt-1">{{ stats.pendingCount }}</h3>
            </div>
            <div class="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
              <PhHourglass :size="24" />
            </div>
          </div>
          <div class="px-5 pb-4">
            <div class="text-xs text-orange-500 font-medium">Aguardando confirmação</div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Próximos Agendamentos -->
        <div class="lg:col-span-2 card bg-base-100 shadow-sm border border-base-200">
          <div class="p-5 border-b border-base-200 flex justify-between items-center">
            <h3 class="font-bold">Próximos Agendamentos</h3>
            <router-link :to="{ name: 'Appointments' }" class="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              Ver todos <PhCaretRight :size="12" />
            </router-link>
          </div>
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th class="bg-transparent text-xs opacity-50">Cliente</th>
                  <th class="bg-transparent text-xs opacity-50">Data/Hora</th>
                  <th class="bg-transparent text-xs opacity-50">Status</th>
                  <th class="bg-transparent text-xs opacity-50"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="appt in recentAppointments" :key="appt.id" class="hover">
                  <td>
                    <div class="font-bold text-sm">{{ appt.client?.name }}</div>
                    <div class="text-[10px] opacity-50">{{ appt.user?.name }}</div>
                  </td>
                  <td>
                    <div class="text-sm">{{ formatDateToBr(appt.date) }}</div>
                    <div class="text-xs opacity-50">{{ appt.time }}</div>
                  </td>
                  <td>
                    <span class="badge badge-sm" :class="getStatusClass(appt.status)">
                      {{ getStatusLabel(appt.status) }}
                    </span>
                  </td>
                  <td class="text-right">
                    <button class="btn btn-ghost btn-xs" @click="router.push({ name: 'AppointmentEdit', params: { id: appt.id } })">
                      Editar
                    </button>
                  </td>
                </tr>
                <tr v-if="recentAppointments.length === 0">
                  <td colspan="4" class="text-center py-8 opacity-40 italic">Nenhum agendamento recente.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Side Panel: Quick Tips or More Stats -->
        <div class="space-y-6">
          <div class="card bg-primary text-primary-content shadow-lg">
            <div class="card-body p-6">
              <h3 class="font-bold text-lg mb-2">Dica de Hoje</h3>
              <p class="text-sm opacity-90">Clientes que recebem lembrete de agendamento têm 30% menos chance de faltar. Que tal conferir os pendentes de hoje?</p>
              <div class="card-actions justify-end mt-4">
                
              </div>
            </div>
          </div>

          <div class="card bg-base-100 shadow-sm border border-base-200 p-5">
            <h3 class="font-bold mb-4">Ações Rápidas</h3>
            <div class="grid grid-cols-2 gap-3">
              <button @click="router.push({ name: 'AppointmentCreate' })" class="btn btn-outline btn-sm justify-start gap-2">
                <PhCalendar :size="16" /> Agendamento
              </button>
              <button @click="router.push({ name: 'ClientCreate' })" class="btn btn-outline btn-sm justify-start gap-2">
                <PhUsers :size="16" /> Cliente
              </button>
              <button @click="router.push({ name: 'ServiceCreate' })" class="btn btn-outline btn-sm justify-start gap-2">
                <PhTrendUp :size="16" /> Serviço
              </button>
              <button @click="router.push({ name: 'Reports' })" class="btn btn-outline btn-sm justify-start gap-2">
                <PhCaretRight :size="16" /> Relatórios
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
