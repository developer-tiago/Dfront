import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPersist from 'pinia-plugin-persistedstate';
import { vMaska } from 'maska/vue';
import '@/assets/css/main.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPersist);

app.use(pinia);
app.use(router);

/* REGISTRO CORRETO DA DIRETIVA */
app.directive('maska', vMaska);

app.mount('#app');
