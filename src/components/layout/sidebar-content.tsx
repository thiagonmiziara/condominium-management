"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@prisma/client";
import AuthButtons from "../auth/auth-buttons";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CircleDollarSign,
  CreditCard,
  Megaphone,
  Users,
} from "lucide-react";

const NavLink = ({
  href,
  children,
  icon: Icon,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  onClick?: () => void;
}) => {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link href={href} passHref onClick={onClick}>
      <Button
        variant={"ghost"}
        className={cn(
          "w-full justify-start text-sm font-medium",
          isActive
            ? "bg-cyan-900/30 text-cyan-300 hover:bg-cyan-900/40 hover:text-cyan-200"
            : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "mr-2 h-4 w-4",
              isActive ? "text-cyan-400" : "text-zinc-500"
            )}
          />
        )}
        {children}
      </Button>
    </Link>
  );
};

interface SidebarContentProps {
  onLinkClick?: () => void;
}

export function SidebarContent({ onLinkClick }: SidebarContentProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <div className='flex flex-col h-full relative'>
      <h1 className='text-xl font-bold mb-6 text-center text-cyan-400 tracking-tight pt-8'>
        Edifício José Cunha
      </h1>
      {/* Navegação */}
      <nav className='flex-grow space-y-1 px-4'>
        <NavLink href='/dashboard' icon={LayoutDashboard} onClick={onLinkClick}>
          Dashboard
        </NavLink>
        <NavLink href='/revenue' icon={CircleDollarSign} onClick={onLinkClick}>
          Receitas
        </NavLink>
        <NavLink href='/expenses' icon={CreditCard} onClick={onLinkClick}>
          Despesas
        </NavLink>
        <NavLink href='/bulletin' icon={Megaphone} onClick={onLinkClick}>
          Mural
        </NavLink>
        {userRole === UserRole.SINDICO && (
          <NavLink href='/residents' icon={Users} onClick={onLinkClick}>
            Moradores
          </NavLink>
        )}
      </nav>
      <div className='mt-auto p-4 border-t border-zinc-800'>
        <AuthButtons />
      </div>
    </div>
  );
}
