import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { api, formatError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, Moon } from "lucide-react";

export default function Settings() {
  const theme = useAuth((s) => s.theme);
  const setTheme = useAuth((s) => s.setTheme);
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === "super_admin";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">Configuration</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Settings</h1>
      </div>
      <div className="border border-border bg-card p-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Appearance</div>
        <div className="flex items-center gap-3">
          <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="rounded-none" data-testid="set-theme-dark"><Moon className="size-4 mr-1.5" /> Dark</Button>
          <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="rounded-none" data-testid="set-theme-light"><Sun className="size-4 mr-1.5" /> Light</Button>
        </div>
      </div>
      {isAdmin && (
        <div className="border border-border bg-card p-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Platform (owner)</div>
          <p className="text-sm text-muted-foreground">SMTP, storage, brand overrides and API keys are managed via environment variables. Reach the console operator to update <code className="font-mono text-xs">.env</code> or open a ticket.</p>
          <div className="mt-4 space-y-3">
            <KV k="Public base URL" v={window.location.origin} />
            <KV k="Storage" v="Local filesystem (/app/backend/uploads)" />
            <KV k="Analytics geo provider" v="ip-api.com (free)" />
            <KV k="Auth" v="Bcrypt · JWT · Refresh tokens" />
          </div>
        </div>
      )}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono text-xs">{v}</span>
    </div>
  );
}
