import { z } from "zod";

export const PublicAppointmentFormSchema = z.object({
  appointment_date: z
    .string()
    .min(1, { message: "Data do agendamento é obrigatória" }),
  time: z.string().min(1, { message: "Horário é obrigatório" }),
  user_id: z.string().min(1, { message: "Profissional é obrigatório" }),
  client_name: z
    .string()
    .min(3, { message: "Nome do cliente deve ter pelo menos 3 caracteres" }),
  client_phone: z
    .string()
    .min(8, { message: "Telefone do cliente é obrigatório" }),
  service_ids: z
    .array(z.string())
    .min(1, { message: "Selecione pelo menos 1 serviço" }),
});

export type PublicAppointmentFormValues = z.infer<typeof PublicAppointmentFormSchema>;
