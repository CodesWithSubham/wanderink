import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const createAdventureSchema = z.object({
  imageKeys: z.array(z.string()).min(3, 'At least 3 images required').max(5, 'Maximum 5 images allowed'),
  visibility: z.enum(['private', 'public']),
});

export const updateAdventureSchema = z.object({
  visibility: z.enum(['private', 'public']).optional(),
  title: z.string().min(1).max(200).optional(),
});

export const publicAdventureQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  search: z.string().optional(),
  sort: z.enum(['newest', 'popular', 'mood']).default('newest'),
});

export const presignUploadSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    type: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Only JPEG, PNG, and WebP images are allowed'),
    size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  })).min(1).max(5),
  visibility: z.enum(['private', 'public']),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateAdventureInput = z.infer<typeof createAdventureSchema>;
export type UpdateAdventureInput = z.infer<typeof updateAdventureSchema>;
export type PublicAdventureQuery = z.infer<typeof publicAdventureQuerySchema>;
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;