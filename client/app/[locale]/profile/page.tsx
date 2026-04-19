"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";

  useEffect(() => {
    router.replace(`/${locale}/dashboard?editProfile=1`);
  }, [router, locale]);

  return null;
}
