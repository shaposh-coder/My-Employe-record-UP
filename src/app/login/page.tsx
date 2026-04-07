import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

function LoginFallback() {
  return (
    <div className="h-10 w-full max-w-[400px] animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800" />
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-100/90 px-4 py-12 dark:bg-slate-950">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
