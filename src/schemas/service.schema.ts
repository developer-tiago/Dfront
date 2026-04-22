import { z } from "zod";

export const ServiceFormSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Nome é obrigatório" })
    .max(255, { message: "Máximo de 255 caracteres" }),
  price: z.coerce
    .number()
    .min(0, { message: 'Preço não pode ser negativo' })
    .max(999999.99, { message: 'Valor máximo é 999.999,99' }),
  duration: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
      message: "Informe uma duração válida",
    }),
});

export type ServiceFormValues = z.infer<typeof ServiceFormSchema>;
