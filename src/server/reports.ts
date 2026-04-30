import { PostStatus, Prisma, type ReportReason, type ReportStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createReportSchema, reportStatusUpdateSchema } from "@/lib/validators";

export async function createReport(reporterId: string, input: unknown) {
  const data = createReportSchema.parse(input);

  const post = await prisma.post.findFirst({
    where: { id: data.postId, status: PostStatus.approved },
    select: { id: true },
  });
  if (!post) {
    throw new Error("NOT_FOUND");
  }

  try {
    return await prisma.report.create({
      data: {
        postId: data.postId,
        reporterId,
        reason: data.reason as ReportReason,
        comment: data.comment ?? null,
      },
      select: { id: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("ALREADY_REPORTED");
    }
    throw e;
  }
}

export async function listReportsForAdmin() {
  return prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { username: true, email: true } },
      post: {
        include: {
          author: { select: { username: true, email: true } },
        },
      },
    },
  });
}

export async function updateReportStatus(input: unknown) {
  const { reportId, status } = reportStatusUpdateSchema.parse(input);
  return prisma.report.update({
    where: { id: reportId },
    data: { status: status as ReportStatus },
  });
}
