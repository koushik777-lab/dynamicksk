import React, { useEffect, useState } from "react";
import { Plus, Search, Users, Pause, Play, Trash2, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Managers() {
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(null);
  const [resetPw, setResetPw] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", company_id: "" });

  const load = async () => {
    const [r, c] = await Promise.all([api.get("/managers", { params: { q } }), api.get("/companies")]);
    setItems(r.data); setCompanies(c.data);
  };
  useEffect(() => { load().catch((e) => toast.error(formatError(e))); }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q]);

  const create = async () => {
    if (!form.name || !form.email || !form.password) return toast.error("Fill all required fields");
    setSaving(true);
    try {
      await api.post("/managers", { ...form, company_id: form.company_id || null });
      toast.success("Manager created");
      setOpen(false); setForm({ name: "", email: "", password: "", company_id: "" });
      load();
    } catch (e) { toast.error(formatError(e)); } finally { setSaving(false); }
  };

  const toggle = async (m) => {
    await api.post(`/managers/${m.id}/${m.active ? "suspend" : "activate"}`);
    toast.success(m.active ? "Suspended" : "Activated");
    load();
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete ${m.name}?`)) return;
    await api.delete(`/managers/${m.id}`);
    toast.success("Deleted");
    load();
  };

  const resetPassword = async () => {
    if (resetPw.length < 6) return toast.error("Min 6 chars");
    await api.post(`/managers/${resetOpen.id}/reset-password`, { new_password: resetPw });
    toast.success("Password reset");
    setResetOpen(null); setResetPw("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">Delegated Access</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Managers</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10 rounded-none w-64" data-testid="managers-search" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 rounded-none h-10" data-testid="new-manager-btn"><Plus className="size-4 mr-1.5" /> New Manager</Button>
            </DialogTrigger>
            <DialogContent className="rounded-none">
              <DialogHeader><DialogTitle className="font-display text-2xl">Create Manager</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {[["Name", "name", "text"], ["Email", "email", "email"], ["Password", "password", "password"]].map(([l, k, t]) => (
                  <div key={k}>
                    <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{l}</Label>
                    <Input type={t} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1.5 h-10 rounded-none" data-testid={`manager-input-${k}`} />
                  </div>
                ))}
                <div>
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Assign Company</Label>
                  <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v })}>
                    <SelectTrigger className="mt-1.5 h-10 rounded-none" data-testid="manager-company"><SelectValue placeholder="Select a company (optional)" /></SelectTrigger>
                    <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={saving} className="bg-primary hover:bg-primary/90 rounded-none" data-testid="create-manager-submit">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="border border-border p-16 grid place-items-center text-center">
          <Users className="size-12 text-muted-foreground mb-4" strokeWidth={1.5} />
          <h3 className="font-display text-2xl font-bold mb-2">No managers yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">Create managers to delegate QR management to your customers or teammates.</p>
          <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 rounded-none"><Plus className="size-4 mr-2" /> Create Manager</Button>
        </div>
      ) : (
        <div className="border border-border" data-testid="managers-table">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((m) => (
                <TableRow key={m.id} className="border-border" data-testid={`manager-row-${m.id}`}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{m.email}</TableCell>
                  <TableCell>{m.company_name || <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell><Badge className={`rounded-none ${m.active ? "bg-primary" : "bg-muted text-muted-foreground"}`}>{m.active ? "Active" : "Suspended"}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{m.last_login ? new Date(m.last_login).toLocaleString() : "Never"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="outline" className="rounded-none h-8" onClick={() => setResetOpen(m)} data-testid={`reset-${m.id}`}><KeyRound className="size-3.5" /></Button>
                      <Button size="sm" variant="outline" className="rounded-none h-8" onClick={() => toggle(m)} data-testid={`toggle-manager-${m.id}`}>{m.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}</Button>
                      <Button size="sm" variant="outline" className="rounded-none h-8 text-primary" onClick={() => remove(m)} data-testid={`delete-manager-${m.id}`}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!resetOpen} onOpenChange={(v) => !v && setResetOpen(null)}>
        <DialogContent className="rounded-none">
          <DialogHeader><DialogTitle>Reset password for {resetOpen?.name}</DialogTitle></DialogHeader>
          <Input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder="New password" className="h-10 rounded-none" />
          <DialogFooter><Button onClick={resetPassword} className="bg-primary hover:bg-primary/90 rounded-none">Reset</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
