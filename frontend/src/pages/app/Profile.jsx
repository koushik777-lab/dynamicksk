import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { api, formatError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [name, setName] = useState(user?.name || "");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [history, setHistory] = useState([]);

  useEffect(() => { api.get("/auth/login-history").then((r) => setHistory(r.data)); }, []);

  const saveProfile = async () => {
    try { const r = await api.patch("/auth/me", { name }); setUser(r.data); toast.success("Saved"); }
    catch (e) { toast.error(formatError(e)); }
  };
  const changePw = async () => {
    try { await api.post("/auth/change-password", { current_password: pw.current, new_password: pw.next }); toast.success("Password updated"); setPw({ current: "", next: "" }); }
    catch (e) { toast.error(formatError(e)); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">Account</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Profile</h1>
      </div>

      <div className="border border-border bg-card p-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Profile</div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 h-10 rounded-none" data-testid="profile-name" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Email</Label>
            <Input value={user?.email || ""} readOnly className="mt-1.5 h-10 rounded-none bg-muted" />
          </div>
          <Button onClick={saveProfile} className="bg-primary hover:bg-primary/90 rounded-none" data-testid="profile-save">Save profile</Button>
        </div>
      </div>

      <div className="border border-border bg-card p-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Change password</div>
        <div className="space-y-4">
          <Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} placeholder="Current password" className="h-10 rounded-none" data-testid="current-password" />
          <Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="New password (min 6)" className="h-10 rounded-none" data-testid="new-password" />
          <Button onClick={changePw} className="bg-primary hover:bg-primary/90 rounded-none" data-testid="change-password-submit">Update password</Button>
        </div>
      </div>

      <div className="border border-border bg-card p-6">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Recent logins</div>
        {history.length === 0 ? <div className="text-sm text-muted-foreground">No history yet</div> : (
          <div className="space-y-2 text-sm">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between border-b border-border py-2">
                <div className="font-mono text-xs">{new Date(h.timestamp).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground truncate max-w-md">{h.user_agent}</div>
                <div className="font-mono text-xs">{h.ip}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
