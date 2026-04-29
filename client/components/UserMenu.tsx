"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { AuthUser, getCurrentLocale } from "@/lib/authClient";
import { Button } from "./ui/button";

interface UserMenuProps {
  user: AuthUser;
}

const DEFAULT_PROFILE_PICTURE = "/default-avatar.png";

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);

  return (
    <Button 
      variant="ghost" 
      onClick={() => router.push(`/${locale}/user`)}
      className="relative h-10 w-10 rounded-full p-0 hover:bg-secondary/10 border border-gray-200 dark:border-gray-700"
    >
      <Image
        src={user.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
        alt={user.name || "Profile"}
        fill
        sizes="40px"
        className="rounded-full object-cover"
      />
    </Button>
  );
}
