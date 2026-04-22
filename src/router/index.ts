import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Auth/LoginRegister.vue"),
    meta: { guest: true },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/Auth/LoginRegister.vue"),
    meta: { guest: true },
  },
  {
    path: "/schedule/:slug",
    name: "PublicAppointmentCreate",
    component: () => import("@/views/Appointments/PublicAppointmentForm.vue"),
  },
  {
    path: "/",
    component: () => import("@/layouts/DefaultLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      {
        path: "account",
        name: "AccountSettings",
        component: () => import("@/views/Account/AccountView.vue"),
      },
      {
        path: "appointments",
        name: "Appointments",
        component: () => import("@/views/Appointments/AppointmentsList.vue"),
      },
      {
        path: "appointments/create",
        name: "AppointmentCreate",
        component: () => import("@/views/Appointments/AppointmentsForm.vue"),
      },
      {
        path: "appointments/edit/:id",
        name: "AppointmentEdit",
        component: () => import("@/views/Appointments/AppointmentsForm.vue"),
      },
      {
        path: "",
        name: "Dashboard",
        component: () => import("@/views/Dashboard/DashboardView.vue"),
      },
      {
        path: "clients",
        name: "Clients",
        component: () => import("@/views/Clients/ClientsList.vue"),
      },
      {
        path: "clients/create",
        name: "ClientCreate",
        component: () => import("@/views/Clients/ClientsForm.vue"),
      },
      {
        path: "clients/edit/:id",
        name: "ClientEdit",
        component: () => import("@/views/Clients/ClientsForm.vue"),
      },
      {
        path: "profile",
        name: "ProfileSettings",
        component: () => import("@/views/Profile/ProfileView.vue"),
      },
      {
        path: "reports",
        name: "Reports",
        component: () => import("@/views/Reports/ReportsView.vue"),
      },
      {
        path: "services",
        name: "Services",
        component: () => import("@/views/Services/ServicesList.vue"),
      },
      {
        path: "services/create",
        name: "ServiceCreate",
        component: () => import("@/views/Services/ServicesForm.vue"),
      },
      {
        path: "services/edit/:id",
        name: "ServiceEdit",
        component: () => import("@/views/Services/ServicesForm.vue"),
      },
      {
        path: "users",
        name: "Users",
        component: () => import("@/views/Users/UsersList.vue"),
      },
      {
        path: "users/create",
        name: "UserCreate",
        component: () => import("@/views/Users/UsersForm.vue"),
      },
      {
        path: "users/edit/:id",
        name: "UserEdit",
        component: () => import("@/views/Users/UsersForm.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth);

  const isGuestRoute = to.matched.some((route) => route.meta.guest);

  // 🔒 rota protegida sem login
  if (requiresAuth && !auth.isAuthenticated) {
    return { name: "Login" };
  }

  // 🔁 usuário logado acessando login
  if (isGuestRoute && auth.isAuthenticated) {
    return { name: "Dashboard" };
  }
});

export default router;
