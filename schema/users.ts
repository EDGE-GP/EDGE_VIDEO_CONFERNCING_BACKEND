import * as z from "zod";

export const signupSchema = z
  .object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6).max(16),
    confirmPassword: z.string().min(6).max(16),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(16),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export const resetPasswordSchema = z
  .object({
    password: z.string().min(6).max(16),
    confirmPassword: z.string().min(6).max(16),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
  });

export const createFriendshipRequestSchema = z.object({
  userId: z.string().uuid(),
});

export const handleFrienshipRequestSchema = z.object({
  friendshipId: z.string().uuid(),
  status: z.enum(["accepted", "rejected"]),
});

export const deleteFriendshipSchema = z.object({
  friendshipId: z.string().uuid(),
});

export const blockUserSchema = z.object({
  blockedUserId: z.string().uuid(),
});

export const updatePersonalInformationSchema = z.object({
  name: z.string(),
  bio: z.string(),
  location: z.string(),
  remindersViaEmail: z.string(),
  notifyEmail: z.string(),
  photo: z
    .any()
    .refine((file) => file?.size <= 5000000, `Max image size is 5MB.`)
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file?.type
        ),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

export const updateUserPasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
  });
