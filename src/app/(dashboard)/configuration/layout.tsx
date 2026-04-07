import { requireWriteDirectory } from "@/lib/dashboard-access";

export default async function ConfigurationSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWriteDirectory();
  return children;
}
