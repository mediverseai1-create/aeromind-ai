import { z } from "zod";

export const signUpSchema = z.object({
  fullName: z.string().min(1, "Enter your full name"),
  email: z.string().min(1, "Enter your work email").email("Enter a valid email"),
  company: z.string().optional(),
  password: z.string().min(8, "Use 8 characters or more"),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Enter your email").email("Enter a valid email"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Use 8 characters or more"),
    confirmPassword: z.string().min(8, "Use 8 characters or more"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const onboardingSchema = z.object({
  organizationName: z.string().min(1, "Enter your company or organization name"),
  industry: z.string().min(1, "Choose an industry"),
  companySize: z.string().min(1, "Choose a company size"),
  country: z.string().min(1, "Enter your country"),
  role: z.string().min(1, "Choose your role"),
});
export type OnboardingValues = z.infer<typeof onboardingSchema>;
