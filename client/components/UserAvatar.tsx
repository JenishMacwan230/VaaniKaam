"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthUser } from "@/lib/authClient";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: AuthUser | null | undefined;
  className?: string; // Additional classes for avatar container
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const getInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={cn("h-8 w-8 border border-border shadow-sm", className)}>
      <AvatarImage 
        src={user?.profilePictureUrl || ""} 
        alt={user?.name || "User"} 
        className="object-cover"
      />
      <AvatarFallback className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white font-bold text-xs uppercase">
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}