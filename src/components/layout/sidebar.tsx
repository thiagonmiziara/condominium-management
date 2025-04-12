import React from "react";
import { cn } from "@/lib/utils";
import { SidebarContent } from "./sidebar-content";

export default function Sidebar() {
  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:w-64",
        "bg-gradient-to-b from-zinc-900 to-zinc-950",
        "border-r border-zinc-800",
        "h-screen sticky top-0"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
