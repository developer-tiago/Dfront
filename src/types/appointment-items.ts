export interface AppointmentItem {
    id?: string;
    appointment_id: string;
    service_id: string;
    status: "pending" | "accepted" | "rejected";
}