import { ToasterHost } from "./toaster-host";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToasterHost />
    </>
  );
}
