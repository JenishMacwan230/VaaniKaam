"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthUser, logoutSession } from "@/lib/authClient";
import { Button } from "./ui/button";

interface UserMenuProps {
  user: AuthUser;
}

const DEFAULT_PROFILE_PICTURE = "/default-avatar.png";

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutSession();
    localStorage.removeItem("user");
    localStorage.removeItem("firebaseToken");
    // Dispatch auth-changed
    window.dispatchEvent(new Event("auth-changed"));
    // Optionally redirect
    router.push("/"); 
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-secondary/10 border border-gray-200 dark:border-gray-700">
          <Image
            src={user.profilePictureUrl || DEFAULT_PROFILE_PICTURE}
            alt={user.name || "Profile"}
            fill
            sizes="40px"
            className="rounded-full object-cover"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount sideOffset={8}>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.phone || user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
