import axios from '@/services/index';
import type { Account, Service } from '@/types';
import type { User } from '@/types/user';

export interface AccountBookingInfo extends Account {
  services?: Service[];
  users?: User[];
}

interface PublicClientPayload {
  account_id: string;
  name: string;
  phone: string;
}

interface PublicAppointmentPayload {
  account_id: string;
  client_id: string;
  user_id: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "rejected";
  service_ids: string[];
}

export default {
  getInfoBySlug(slug: string) {
    return axios.get<AccountBookingInfo>(`/public/accounts/slug/${slug}`);
  },

  createClient(data: PublicClientPayload) {
    return axios.post("/public/clients", data);
  },

  createAppointment(data: PublicAppointmentPayload) {
    return axios.post("/public/appointments", data);
  },

  checkAppointment(date: string, client_id: string) {
    return axios.get(`/public/appointments/check?date=${date}&client_id=${client_id}`);
  },

  clientAppointments(clientId: string) {
    return axios.get(`/public/appointments/client/${clientId}`);
  },

  updateAppointment(id: string, data: PublicAppointmentPayload) {
    return axios.put(`/public/appointments/${id}`, data);
  }
};
