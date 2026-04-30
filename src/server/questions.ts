import { type QuestionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { questionSchema, questionStatusUpdateSchema } from "@/lib/validators";

export async function createQuestion(userId: string, input: unknown) {
  const data = questionSchema.parse(input);
  return prisma.question.create({
    data: {
      userId,
      subject: data.subject ?? null,
      message: data.message,
    },
    select: { id: true },
  });
}

export async function listQuestionsForAdmin() {
  return prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true, email: true } },
    },
  });
}

export async function updateQuestionStatus(input: unknown) {
  const { questionId, status } = questionStatusUpdateSchema.parse(input);
  return prisma.question.update({
    where: { id: questionId },
    data: { status: status as QuestionStatus },
  });
}
