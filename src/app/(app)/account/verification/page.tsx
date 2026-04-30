import { requireSession } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { VerificationSection } from "@/components/account/verification-section";

const verificationUrl = process.env.NEXT_PUBLIC_VERIFICATION_FORM_URL;

export default async function AccountVerificationPage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { isVerified: true },
  });

  return <VerificationSection verificationUrl={verificationUrl ?? null} isVerified={user.isVerified} />;
}
