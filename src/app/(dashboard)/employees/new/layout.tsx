import { requireWriteDirectory } from "@/lib/dashboard-access";

export default async function NewEmployeeSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWriteDirectory();
  return children;
}
