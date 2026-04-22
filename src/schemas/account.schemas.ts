import { z } from 'zod';

export const AccountSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Mínimo de 3 caracteres' })
    .max(255, { message: 'Máximo de 255 caracteres' }),
  slug: z
    .string()
    .min(3, { message: 'Mínimo de 3 caracteres' })
    .max(255, { message: 'Máximo de 255 caracteres' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'O slug deve conter apenas letras minúsculas, números e hífens',
    }),
  email: z.union([
    z
      .string()
      .email({ message: 'E-mail inválido' })
      .max(255, { message: 'Máximo de 255 caracteres' }),
    z.literal(''),
  ]),
  instagram: z.string().max(255, { message: 'Máximo de 255 caracteres' }).optional(),
  facebook: z.string().max(255, { message: 'Máximo de 255 caracteres' }).optional(),
  zipcode: z.union([z.string().length(9, { message: 'CEP deve ter 8 caracteres' }), z.literal('')]),
  street: z.string().max(255, { message: 'Máximo de 255 caracteres' }).optional(),
  number: z.string().max(20, { message: 'Máximo de 20 caracteres' }).optional(),
  complement: z.string().max(255, { message: 'Máximo de 255 caracteres' }).optional(),
  neighborhood: z.string().max(100, { message: 'Máximo de 100 caracteres' }).optional(),
  city: z.string().max(100, { message: 'Máximo de 100 caracteres' }).optional(),
  state: z.string().max(2, { message: 'Máximo de 2 caracteres' }).optional(),
  country_code: z.string().max(5, { message: 'Máximo de 5 caracteres' }).optional(),
  phone: z.string().max(20, { message: 'Máximo de 20 caracteres' }).optional(),
});
