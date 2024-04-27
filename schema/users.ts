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
export const acceptFriendshipRequestSchema = z.object({
  friendshipId: z.string().uuid(),
});
export const handleFrienshipRequestSchema = z.object({
  frienshipId: z.string().uuid(),
  status: z.string(),
});

export const dedleteFriendshipRequestSchema = z.object({
  friendshipId: z.string().uuid(),
});

export const blockUserSchema = z.object({
  blockedUserId: z.string().uuid(),
});
