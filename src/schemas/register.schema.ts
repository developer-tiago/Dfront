import { z } from 'zod';

export const RegisterSchema = z.object({
  account_name: z
    .string()
    .min(3, { message: 'Mínimo de 3 caracteres' })
    .max(255, { message: 'Máximo de 255 caracteres' }),
  account_slug: z
    .string()
    .min(3, { message: 'Mínimo de 3 caracteres' })
    .max(255, { message: 'Máximo de 255 caracteres' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: 'Slug deve conter apenas letras minúsculas, números e hífens',
    }),
  account_phone_validate: z
    .boolean()
    .refine((val) => val === true, { message: 'Telefone inválido' }),
  user_name: z
    .string()
    .min(3, { message: 'Informe o nome completo' })
    .max(255, { message: 'Máximo de 255 caracteres' })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Nome deve conter apenas letras' })
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: 'Informe o nome completo',
    }),
  user_email: z
    .string()
    .email({ message: 'E-mail inválido' })
    .max(255, { message: 'Máximo de 255 caracteres' }),
  user_password: z
    .string()
    .max(255, { message: 'Máximo de 255 caracteres' })
    .refine(
      (val) => {
        const hasMinLength = val.length >= 8;
        const hasUpperCase = /[A-Z]/.test(val);
        const hasLowerCase = /[a-z]/.test(val);
        const hasNumber = /[0-9]/.test(val);
        const hasSpecialChar = /[^A-Za-z0-9]/.test(val);
        return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
      },
      {
        message:
          'Senha deve ter no mínimo 8 caracteres e conter: letra maiúscula, minúscula, número e caractere especial',
      }
    ),
});

export type Register = z.infer<typeof RegisterSchema>;
