import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Building2, Trash2, Pause, Play, Loader2, Palette } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function Companies() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", brand_color: "#FF3B30", description: "", website: "", email: "", phone: "" });

  const load = async () => {
    try {
      const res = await api.get("/companies", { params: { q } });
      setItems(res.data);
    } catch (e) { toast.error(formatError(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q]);

  const create = async () => {
    if (!form.name) return toast.error("Name required");
    setSaving(true);
    try {
      await api.post("/companies", form);
      toast.success("Company created");
      setOpen(false);
      setForm({ name: "", brand_color: "#FF3B30", description: "", website: "", email: "", phone: "" });
      load();
    } catch (e) { toast.error(formatError(e)); }
    finally { setSaving(false); }
  };

  const toggle = async (c) => {
    try {
      await api.post(`/companies/${c.id}/${c.status === "active" ? "suspend" : "activate"}`);
      toast.success(c.status === "active" ? "Suspended" : "Activated");
      load();
    } catch (e) { toast.error(formatError(e)); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete ${c.name}? This will also delete its QR codes and detach managers.`)) return;
    try { await api.delete(`/companies/${c.id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(formatError(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">Tenant Provisioning</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Companies</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search companies..." value={q} onChange={(e) => setQ(e.target.value)} data-testid="companies-search" className="pl-9 h-10 rounded-none w-64" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 rounded-none h-10" data-testid="new-company-btn"><Plus className="size-4 mr-1.5" /> New Company</Button>
            </DialogTrigger>
            <DialogContent className="rounded-none">
              <DialogHeader><DialogTitle className="font-display text-2xl">Create Company</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {[["Name", "name", "text", "Acme Corp"], ["Website", "website", "text", "https://..."], ["Email", "email", "email", "hello@acme.com"], ["Phone", "phone", "text", "+1 555 000 1234"]].map(([label, k, type, ph]) => (
                  <div key={k}>
                    <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
                    <Input type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1.5 h-10 rounded-none" placeholder={ph} data-testid={`company-input-${k}`} />
                  </div>
                ))}
                <div>
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Brand color</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input type="color" value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="size-10 border border-border" />
                    <Input value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="h-10 rounded-none font-mono w-32" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 rounded-none" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={saving} className="bg-primary hover:bg-primary/90 rounded-none" data-testid="create-company-submit">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? <div className="text-muted-foreground">Loading...</div> : items.length === 0 ? (
        <EmptyCompanies onNew={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border" data-testid="companies-grid">
          {items.map((c) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-6" data-testid={`company-card-${c.id}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="size-10 grid place-items-center font-bold border" style={{ background: c.brand_color + "15", color: c.brand_color, borderColor: c.brand_color + "40" }}>{c.name?.slice(0, 1)}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground font-mono truncate">{c.slug}</div>
                </div>
                <Badge variant={c.status === "active" ? "default" : "destructive"} className={`rounded-none ${c.status === "active" ? "bg-primary" : ""}`}>{c.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                <div className="border border-border p-2">
                  <div className="text-muted-foreground uppercase tracking-wider text-[10px]">QR Codes</div>
                  <div className="font-display font-bold text-xl mt-1">{c.qr_count}</div>
                </div>
                <div className="border border-border p-2">
                  <div className="text-muted-foreground uppercase tracking-wider text-[10px]">Total Scans</div>
                  <div className="font-display font-bold text-xl mt-1">{c.total_scans}</div>
                </div>
              </div>
              {c.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{c.description}</p>}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle(c)} className="rounded-none flex-1" data-testid={`toggle-${c.id}`}>
                  {c.status === "active" ? <><Pause className="size-3.5 mr-1.5" /> Suspend</> : <><Play className="size-3.5 mr-1.5" /> Activate</>}
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(c)} className="rounded-none text-primary hover:text-primary" data-testid={`delete-${c.id}`}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyCompanies({ onNew }) {
  return (
    <div className="border border-border p-16 grid place-items-center text-center">
      <Building2 className="size-12 text-muted-foreground mb-4" strokeWidth={1.5} />
      <h3 className="font-display text-2xl font-bold mb-2">No companies yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">Provision your first tenant. Every QR code you issue must belong to a company.</p>
      <Button onClick={onNew} className="bg-primary hover:bg-primary/90 rounded-none"><Plus className="size-4 mr-2" /> Create Company</Button>
    </div>
  );
}
