import { z } from 'zod';

export const ClientSchema = z
  .object({
    id: z.uuid().optional(),
    name: z
      .string()
      .min(3, { message: 'Mínimo de 3 caracteres' })
      .max(255, { message: 'Máximo de 255 caracteres' }),
    
    country_code: z.string().max(5, { message: 'Máximo de 5 caracteres' }).optional(),
    phone: z.string().max(20, { message: 'Máximo de 20 caracteres' }).optional(),
  })

export type Client = z.infer<typeof ClientSchema>;
