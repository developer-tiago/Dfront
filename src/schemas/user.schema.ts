import { z } from 'zod';

export const UserSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: 'Informe o nome completo' })
      .max(255, { message: 'Máximo de 255 caracteres' })
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Nome deve conter apenas letras' })
      .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: 'Informe o nome completo',
    }),
    email: z.union([
      z
        .string()
        .email({ message: 'E-mail inválido' })
        .max(255, { message: 'Máximo de 255 caracteres' }),
      z.literal(''),
    ]),
    password: z
      .string()
      .min(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
      .max(100, { message: 'Máximo de 100 caracteres' }),
    confirmPassword: z.string().min(1, { message: 'Confirmação de senha é obrigatória' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export const UserEditSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Nome é obrigatório' })
    .max(100, { message: 'Máximo de 100 caracteres' }),
  email: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

export const UserProfileEditSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    current_password: z.string().optional(),
    password: z
      .union([z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'), z.literal('')])
      .optional(),
    password_confirmation: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password && !data.current_password) {
        return false;
      }
      return true;
    },
    {
      message: 'Senha atual é obrigatória para alterar a senha',
      path: ['current_password'],
    }
  )
  .refine(
    (data) => {
      if (data.password && data.password !== data.password_confirmation) {
        return false;
      }
      return true;
    },
    {
      message: 'As senhas não coincidem',
      path: ['password_confirmation'],
    }
  );

export type UserFormData = z.infer<typeof UserSchema>;
export type UserEditFormData = z.infer<typeof UserEditSchema>;
export type UserProfileEditFormData = z.infer<typeof UserProfileEditSchema>;
