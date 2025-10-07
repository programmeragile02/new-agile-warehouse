"use client";

import * as React from "react";
import { LanguageProvider } from "@/lib/contexts/language-context";
import { ThemeProvider } from "@/lib/contexts/theme-context";
import { TemplateProvider } from "@/lib/contexts/template-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <TemplateProvider>{children}</TemplateProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
