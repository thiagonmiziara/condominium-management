"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { SidebarContent } from "@/components/layout/sidebar-content";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/signin");
    },
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className='flex items-center justify-center min-h-screen bg-zinc-950 text-zinc-400'>
        Carregando Sessão...
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-zinc-950'>
      <Sidebar />

      <div className='flex flex-col flex-1'>
        <header className='sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-zinc-900/95 px-4 backdrop-blur-sm md:hidden'>
          {" "}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='-ml-2 text-zinc-400 hover:text-zinc-100'
              >
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Abrir menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent
              side='left'
              className='w-64 bg-gradient-to-b from-zinc-900 to-zinc-950 p-0 border-r border-zinc-800 text-zinc-200'
            >
              <SidebarContent onLinkClick={() => setIsMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className='flex-1 text-lg mt-0.5 font-semibold text-cyan-400 text-center mr-8'>
            Gestão Condomínio
          </h1>
        </header>

        <main className='flex-1 p-4 md:p-6 lg:p-8 overflow-auto'>
          {children}
        </main>
      </div>
    </div>
  );
}
