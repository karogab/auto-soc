import { requireSession } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { ProfileSection } from "@/components/account/profile-section";

export default async function AccountProfilePage() {
  const session = await requireSession();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      username: true,
      firstName: true,
      lastName: true,
    },
  });

  return <ProfileSection profile={user} />;
}
