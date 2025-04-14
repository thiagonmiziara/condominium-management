import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import Providers from "@/components/providers";

const inter = Roboto({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão Condomínio",
  description: "Sistema de gestão para condomínios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='pt-BR'
      className='dark'
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <Providers>
          {children}
          <SonnerToaster richColors theme='dark' position='top-right' />{" "}
        </Providers>
      </body>
    </html>
  );
}
