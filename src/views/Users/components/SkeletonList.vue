<template>
  <div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
    <table class="table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>E-mail</th>
          <th>Função</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="i in 5" :key="i">
          <td>
            <div class="flex items-center gap-3">
              <div class="skeleton h-12 w-12 rounded-box"></div>
              <div class="skeleton h-4 w-28"></div>
            </div>
          </td>
          <td>
            <div class="skeleton h-4 w-44"></div>
          </td>
          <td>
            <div class="skeleton h-4 w-20"></div>
          </td>
          <td class="text-right">
            <div class="flex justify-end gap-2">
              <div class="skeleton h-6 w-6 rounded"></div>
              <div class="skeleton h-6 w-6 rounded"></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
