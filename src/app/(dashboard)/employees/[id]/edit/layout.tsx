import { requireWriteDirectory } from "@/lib/dashboard-access";

export default async function EditEmployeeSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireWriteDirectory();
  return children;
}
