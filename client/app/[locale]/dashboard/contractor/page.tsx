"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentLocale } from "@/lib/authClient";

export default function ContractorDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    router.replace(`/${getCurrentLocale(pathname)}`);
  }, [pathname, router]);

  return null;
}