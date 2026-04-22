import axios from ".";
import type { Service } from "@/types";

type ServicePayload = Omit<Service, "id" | "account_id">;

export default {
  index() {
    return axios.get("/services");
  },

  create(data: ServicePayload) {
    return axios.post<Service>("/services", data);
  },

  show(id: string) {
    return axios.get<Service>(`/services/${id}`);
  },

  update(id: string, data: Partial<ServicePayload>) {
    return axios.put<Service>(`/services/${id}`, data);
  },

  delete(id: string) {
    return axios.delete<void>(`/services/${id}`);
  },
};
