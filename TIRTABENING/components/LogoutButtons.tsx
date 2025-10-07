// components/LogoutButtons.tsx
"use client";
import { Button } from "@/components/ui/button";
export function LogoutUserButton() {
  return (
    <Button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
      variant="secondary"
    >
      Logout User
    </Button>
  );
}

export function LogoutCompanyButton() {
  return (
    <Button
      onClick={async () => {
        await fetch("/api/auth/logout-company", { method: "DELETE" });
        window.location.href = "/company-login";
      }}
      variant="destructive"
    >
      Logout Company
    </Button>
  );
}
