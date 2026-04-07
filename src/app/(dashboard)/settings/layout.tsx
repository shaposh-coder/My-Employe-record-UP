import { requireAdmin } from "@/lib/dashboard-access";

export default async function SettingsSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return children;
}
