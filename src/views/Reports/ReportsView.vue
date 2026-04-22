<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { PhHouse, PhChartDonut } from '@phosphor-icons/vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import VueApexCharts from 'vue3-apexcharts';
import type { ApexOptions } from 'apexcharts';
import ReportsService from '@/services/reports';
import LoaderComponent from '@/components/ui/AppLoader.vue';

const loading = ref(true);

// Agendamentos - Gráfico de Barras
const appointmentsSeries = ref([{ name: 'Agendamentos', data: [] as number[] }]);
const appointmentsOptions = ref<ApexOptions>({
  chart: {
    type: 'bar',
    fontFamily: 'inherit',
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
  dataLabels: { enabled: false },
  stroke: { width: 2, colors: ['transparent'] },
  xaxis: { categories: [] as string[] },
  yaxis: { title: { text: 'Qtd de Agendamentos' } },
  fill: { opacity: 1 },
  colors: ['#3b82f6'],
  tooltip: { y: { formatter: (val: number) => val + " agendamentos" } }
});

// Faturamento - Card de Valor Total
const totalRevenue = ref(0);

// Serviços mais Populares - Gráfico Donut
const servicesSeries = ref([] as number[]);
const servicesOptions = ref<ApexOptions>({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: [] as string[],
  colors: ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#3b82f6'],
  plotOptions: { pie: { donut: { size: '70%' } } },
  dataLabels: { enabled: false },
  legend: { position: 'bottom' },
  tooltip: { y: { formatter: (val: number) => val + " vezes" } }
});

// Profissionais - Barras Horizontais
const professionalsSeries = ref([{ name: 'Agendamentos Realizados', data: [] as number[] }]);
const professionalsOptions = ref<ApexOptions>({
  chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
  colors: ['#f59e0b'],
  dataLabels: { enabled: true, style: { colors: ['#fff'] } },
  xaxis: { categories: [] as string[] },
  tooltip: { y: { formatter: (val: number) => val + " agendamentos" } }
});

onMounted(async () => {
  try {
    const [apptsRes, revRes, servsRes, profsRes] = await Promise.all([
      ReportsService.appointmentsInWeek(),
      ReportsService.revenueInWeek(),
      ReportsService.servicesPopular(),
      ReportsService.professionalsTop()
    ]);

    // Format Appointments
    const appts = apptsRes.data || [];
    appointmentsOptions.value = {
      ...appointmentsOptions.value,
      xaxis: { categories: appts.map((a: any) => new Date(a.date).toLocaleDateString('pt-BR')) }
    };
    appointmentsSeries.value = [{
      name: 'Agendamentos',
      data: appts.map((a: any) => Number(a.total))
    }];

    // Format Revenue
    totalRevenue.value = Number(revRes.data?.total || 0);

    // Format Services
    const servs = servsRes.data || [];
    servicesOptions.value = {
      ...servicesOptions.value,
      labels: servs.map((s: any) => s.name)
    };
    servicesSeries.value = servs.map((s: any) => Number(s.total));

    // Format Professionals
    const profs = profsRes.data || [];
    professionalsOptions.value = {
      ...professionalsOptions.value,
      xaxis: { categories: profs.map((p: any) => p.name) }
    };
    professionalsSeries.value = [{
      name: 'Agendamentos Realizados',
      data: profs.map((p: any) => Number(p.total))
    }];
  } catch (error) {
    console.error('Erro ao buscar relatórios:', error);
  } finally {
    loading.value = false;
  }
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-96px)]">
    <!-- Breadcrumbs -->
    <Breadcrumbs
      :items="[
        { label: 'Home', icon: PhHouse },
        { label: 'Relatórios', icon: PhChartDonut },
      ]"
    />

    <div class="p-4 space-y-6 overflow-y-auto">
      <LoaderComponent v-if="loading" :paddingY="160" />

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Gráfico de Agendamentos -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg font-bold">Agendamentos na Semana</h2>
            <p class="text-sm opacity-70 mb-4">Quantidade total de agendamentos por dia</p>
            <VueApexCharts 
              v-if="(appointmentsSeries[0]?.data?.length || 0) > 0"
              type="bar" 
              height="280" 
              :options="appointmentsOptions" 
              :series="appointmentsSeries" 
            />
            <div v-else class="flex-1 flex items-center justify-center text-sm opacity-50 h-[280px]">
              Nenhum dado encontrado para a semana.
            </div>
          </div>
        </div>

        <!-- Gráfico de Receita (Substituído por Card de Valor) -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg font-bold">Faturamento na Semana</h2>
            <p class="text-sm opacity-70 mb-4">Receita bruta gerada</p>
            <div class="flex-1 flex items-center justify-center h-[280px]">
              <span class="text-5xl lg:text-6xl font-extrabold text-emerald-500">
                {{ formatCurrency(totalRevenue) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Gráfico de Serviços -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg font-bold">Serviços Mais Populares</h2>
            <p class="text-sm opacity-70 mb-4">Distribuição de serviços mais realizados</p>
            <VueApexCharts 
              v-if="(servicesSeries?.length || 0) > 0"
              type="donut" 
              height="280" 
              :options="servicesOptions" 
              :series="servicesSeries" 
            />
            <div v-else class="flex-1 flex items-center justify-center text-sm opacity-50 h-[280px]">
              Nenhum dado encontrado.
            </div>
          </div>
        </div>

        <!-- Gráfico de Profissionais -->
        <div class="card bg-base-100 shadow-sm border border-base-200">
          <div class="card-body">
            <h2 class="card-title text-lg font-bold">Top Profissionais</h2>
            <p class="text-sm opacity-70 mb-4">Volume de atendimentos por membro da equipe</p>
            <VueApexCharts 
              v-if="(professionalsSeries[0]?.data?.length || 0) > 0"
              type="bar" 
              height="280" 
              :options="professionalsOptions" 
              :series="professionalsSeries" 
            />
            <div v-else class="flex-1 flex items-center justify-center text-sm opacity-50 h-[280px]">
              Nenhum dado encontrado.
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
