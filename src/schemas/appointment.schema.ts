import { z } from "zod";

export const AppointmentFormSchema = z.object({
  appointment_date: z
    .string()
    .min(1, { message: "Data do agendamento é obrigatória" }),
  status: z.enum(["pending", "accepted", "rejected"], {
    message: "Status é obrigatório",
  }),
  time: z.string().min(1, { message: "Horário é obrigatório" }),
  user_id: z.string().min(1, { message: "Profissional é obrigatório" }),
  service_ids: z
    .array(z.string())
    .min(1, { message: "Selecione pelo menos 1 serviço" }),
  client_id: z.string().optional(),
  create_new_client: z.boolean(),
  new_client_name: z.string().optional(),
  new_client_phone: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.create_new_client) {
    if (!values.new_client_name || values.new_client_name.trim().length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_client_name"],
        message: "Nome do cliente deve ter pelo menos 3 caracteres",
      });
    }

    if (!values.new_client_phone || values.new_client_phone.trim().length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["new_client_phone"],
        message: "Telefone do cliente é obrigatório",
      });
    }

    return;
  }

  if (!values.client_id || values.client_id.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["client_id"],
      message: "Cliente é obrigatório",
    });
  }
});

export type AppointmentFormValues = z.infer<typeof AppointmentFormSchema>;
