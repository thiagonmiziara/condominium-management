"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
// Importe ThemeProvider se for usar toggle de tema do Shadcn/UI
// import { ThemeProvider } from "next-themes";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {/*
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      */}
      {children}
      {/*
      </ThemeProvider>
      */}
    </SessionProvider>
  );
}
