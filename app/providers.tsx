"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster position="bottom-right" richColors />
      </TooltipProvider>
    </SessionProvider>
  );
}
