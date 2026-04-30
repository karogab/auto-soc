import { type SuggestionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { suggestionSchema, suggestionStatusUpdateSchema } from "@/lib/validators";

export async function createSuggestion(userId: string, input: unknown) {
  const data = suggestionSchema.parse(input);
  return prisma.suggestion.create({
    data: { userId, message: data.message },
    select: { id: true },
  });
}

export async function listSuggestionsForAdmin() {
  return prisma.suggestion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true, email: true } },
    },
  });
}

export async function updateSuggestionStatus(input: unknown) {
  const { suggestionId, status } = suggestionStatusUpdateSchema.parse(input);
  return prisma.suggestion.update({
    where: { id: suggestionId },
    data: { status: status as SuggestionStatus },
  });
}
