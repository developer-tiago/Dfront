import axios from ".";
import type { Appointment } from "@/types";

export type AppointmentPayload = {
    client_id: string;
    user_id: string;
    date: string;
    time: string;
    status: Appointment["status"];
    service_ids?: string[];
};

export default {
    paginate(page = 1, perPage = 15, startDate?: string, endDate?: string) {
        return axios.get("/appointments", {
            params: {
                page,
                per_page: perPage,
                ...(startDate ? { start_date: startDate } : {}),
                ...(endDate ? { end_date: endDate } : {}),
            },
        });
    },

    create(data: AppointmentPayload) {
        return axios.post("/appointments", data);
    },

    show(id: string) {
        return axios.get(`/appointments/${id}`);
    },

    update(id: string, data: Partial<AppointmentPayload>) {
        return axios.put(`/appointments/${id}`, data);
    },

    delete(id: string) {
        return axios.delete(`/appointments/${id}`);
    }
};