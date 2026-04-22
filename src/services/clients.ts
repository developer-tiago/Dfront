import axios from ".";
import type { Client } from "@/types";

export default {
  paginate(page = 1, perPage = 15, search?: string) {

    return axios.get("/clients?", {
      params: {
        page,
        per_page: perPage,
        search,
      },
    });
  },

  create(data: Client) {
    return axios.post("/clients", data);
  },

  show(id: string) {
    return axios.get(`/clients/${id}`);
  },

  update(id: string, data: Client) {
    return axios.put(`/clients/${id}`, data);
  },

  delete(id: string) {
    return axios.delete(`/clients/${id}`);
  },
};
