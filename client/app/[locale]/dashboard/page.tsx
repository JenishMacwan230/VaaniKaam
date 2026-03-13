"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentLocale } from "@/lib/authClient";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const locale = getCurrentLocale(pathname);
    router.replace(`/${locale}`);
  }, [pathname, router]);

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl items-center justify-center px-4 py-10">
      <p className="rounded-2xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
        Redirecting to home...
      </p>
    </div>
  );
}