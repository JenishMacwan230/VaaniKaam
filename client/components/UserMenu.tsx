"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserAvatar } from "./UserAvatar";
import { AuthUser, getCurrentLocale } from "@/lib/authClient";
import { Button } from "./ui/button";

interface UserMenuProps {
  user: AuthUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getCurrentLocale(pathname);

  return (
    <Button 
      variant="ghost" 
      onClick={() => router.push(`/${locale}/user`)}
      className="relative h-10 w-10 rounded-full p-0 hover:bg-secondary/10 border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <UserAvatar user={user} className="h-full w-full border-none shadow-none" />
    </Button>
  );
}
