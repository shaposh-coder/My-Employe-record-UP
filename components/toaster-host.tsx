"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function ToasterHost() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Toaster
      theme={mounted && resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      richColors
      closeButton
      expand
      gap={10}
    />
  );
}
