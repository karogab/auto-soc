import { requireSession } from "@/lib/permissions";
import { SupportSection } from "@/components/account/support-section";

export default async function AccountSupportPage() {
  await requireSession();

  return <SupportSection />;
}
