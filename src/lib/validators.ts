import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_]{3,32}$/;

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(usernameRegex, "Username may only contain letters, numbers, underscore (3–32 chars)"),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(usernameRegex, "Username may only contain letters, numbers, underscore (3–32 chars)"),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

const postMax = 2000;

export const createPostSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Post cannot be empty")
    .max(postMax, `Post must be at most ${postMax} characters`),
});

export const questionSchema = z.object({
  subject: z.string().trim().max(200).optional().transform((v) => (v === "" ? undefined : v)),
  message: z.string().trim().min(1).max(5000),
});

export const suggestionSchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

export const reportReasonSchema = z.enum([
  "spam",
  "offensive",
  "false_information",
  "inappropriate",
  "other",
]);

export const createReportSchema = z.object({
  postId: z.string().min(1),
  reason: reportReasonSchema,
  comment: z.string().trim().max(2000).optional().transform((v) => (v === "" ? undefined : v)),
});

export const reactionSchema = z.object({
  postId: z.string().min(1),
  type: z.enum(["like", "dislike"]),
});

export const userSearchSchema = z.object({
  query: z.string().trim().min(1).max(64),
});

export const adminUserSearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
});

export const reportStatusUpdateSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["new", "reviewed", "dismissed", "action_taken"]),
});

export const questionStatusUpdateSchema = z.object({
  questionId: z.string().min(1),
  status: z.enum(["new", "read", "answered"]),
});

export const suggestionStatusUpdateSchema = z.object({
  suggestionId: z.string().min(1),
  status: z.enum(["new", "reviewed", "planned", "rejected"]),
});

export const moderationPostIdSchema = z.object({
  postId: z.string().min(1),
});

const commentMax = postMax;

export const createCommentSchema = z.object({
  postId: z.string().min(1),
  parentCommentId: z
    .string()
    .min(1)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  text: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(commentMax, `Comment must be at most ${commentMax} characters`),
});

export const commentReactionSchema = z.object({
  commentId: z.string().min(1),
  type: z.enum(["like", "dislike"]),
});

export const createCommentReportSchema = z.object({
  commentId: z.string().min(1),
  reason: reportReasonSchema,
  comment: z.string().trim().max(2000).optional().transform((v) => (v === "" ? undefined : v)),
});

export const commentIdSchema = z.object({
  commentId: z.string().min(1),
});

export const notificationIdSchema = z.string().min(1);

export const adminUserIdSchema = z.object({
  userId: z.string().min(1),
});
