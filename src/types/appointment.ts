import type { Client } from "./client";
import type { User } from "./user";
import type { Service } from "./service";

export type AppointmentStatus = "pending" | "accepted" | "rejected";

export interface AppointmentItem {
  id?: string;
  appointment_id?: string;
  service_id?: string;
  service?: Partial<Service>;
  status?: AppointmentStatus;
  created_at?: string;
  updated_at?: string;
}

export type AppointmentItemStatus = AppointmentStatus;

export type EditableAppointmentItem = {
  id: string;
  service_id: string;
  status: AppointmentItemStatus;
  service?: Partial<Service>;
};

export interface Appointment {
  id: string;
  account_id?: string;
  client_id: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  client?: Partial<Client>;
  user?: Partial<User>;
  items?: AppointmentItem[];
  created_at?: string;
  updated_at?: string;
}


export interface AppointmentEditData {
  client_id?: string;
  user_id?: string;
  date?: string;
  time?: string;
  status?: AppointmentStatus;
  client?: Client;
  items?: Pick<AppointmentItem, "service_id">[];
}
