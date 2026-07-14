import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, QrCode, Pause, Play, Trash2, Download, Copy, Star, LayoutGrid, List, MoreHorizontal, Eye, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { api, formatError, backendOrigin } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function QRList() {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState("grid");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = { q };
      if (status !== "all") params.status = status;
      const res = await api.get("/qr", { params });
      setItems(res.data);
    } catch (e) { toast.error(formatError(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [q, status]);

  const doAction = async (id, action, verb) => {
    try {
      await api.post(`/qr/${id}/${action}`);
      toast.success(verb);
      load();
    } catch (e) { toast.error(formatError(e)); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this QR? (Can be restored later)")) return;
    try { await api.delete(`/qr/${id}`); toast.success("QR deleted"); load(); }
    catch (e) { toast.error(formatError(e)); }
  };

  const toggleFav = async (q_) => {
    await api.patch(`/qr/${q_.id}`, { favorite: !q_.favorite });
    load();
  };

  const isAdmin = user?.role === "super_admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">{isAdmin ? "Fleet" : "My QR Codes"}</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">QR Codes</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search QR..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 h-10 rounded-none w-64" data-testid="qr-search" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-10 rounded-none w-36" data-testid="qr-filter-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="deleted">Trash</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border">
            <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-primary text-white" : ""}`} data-testid="view-grid"><LayoutGrid className="size-4" /></button>
            <button onClick={() => setView("list")} className={`p-2 border-l border-border ${view === "list" ? "bg-primary text-white" : ""}`} data-testid="view-list"><List className="size-4" /></button>
          </div>
          {isAdmin && <Button asChild className="bg-primary hover:bg-primary/90 rounded-none h-10" data-testid="new-qr-btn"><Link to="/qr/new"><Plus className="size-4 mr-1.5" /> New QR</Link></Button>}
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="border border-border p-16 grid place-items-center text-center">
          <QrCode className="size-12 text-muted-foreground mb-4" strokeWidth={1.5} />
          <h3 className="font-display text-2xl font-bold mb-2">No QR codes yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {isAdmin ? "Create your first QR code to get started." : "Once a Super Admin assigns a QR code to you, it will appear here."}
          </p>
          {isAdmin && <Button asChild className="bg-primary hover:bg-primary/90 rounded-none"><Link to="/qr/new"><Plus className="size-4 mr-2" /> Create QR</Link></Button>}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-border border border-border" data-testid="qr-grid">
          {items.map((it) => (
            <motion.div key={it.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card group relative">
              <div className="aspect-square bg-white grid place-items-center p-6 border-b border-border relative">
                <img src={`${backendOrigin()}/api/qr/${it.id}/preview?size=384&t=${it.version}&k=${(token||'').slice(-8)}`} alt={it.name} crossOrigin="anonymous" className="max-w-full h-auto" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                {it.favorite && <Star className="absolute top-3 right-3 size-4 text-primary fill-primary" />}
                <Badge className={`absolute top-3 left-3 rounded-none ${it.status === "active" ? "bg-primary" : it.status === "paused" ? "bg-muted-foreground" : "bg-muted"}`}>{it.status}</Badge>
              </div>
              <div className="p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Link to={`/qr/${it.id}`} className="font-medium truncate flex-1 hover:text-primary transition-colors">{it.name}</Link>
                  <button onClick={() => toggleFav(it)} className="text-muted-foreground hover:text-primary" data-testid={`fav-${it.id}`}>
                    <Star className={`size-4 ${it.favorite ? "text-primary fill-primary" : ""}`} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mb-3">
                  <span className="uppercase">{it.type}</span> · <span>{it.short_code}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="text-muted-foreground">Scans</div>
                  <div className="font-display font-bold text-lg">{it.scan_count.toLocaleString()}</div>
                </div>
                <div className="mt-4 flex items-center gap-1">
                  <Button asChild size="sm" variant="outline" className="rounded-none flex-1 h-8"><Link to={`/qr/${it.id}`}><Eye className="size-3.5 mr-1" /> Open</Link></Button>
                  {it.status === "active" && <Button size="sm" variant="outline" className="rounded-none h-8" onClick={() => doAction(it.id, "pause", "Paused")}><Pause className="size-3.5" /></Button>}
                  {it.status === "paused" && <Button size="sm" variant="outline" className="rounded-none h-8" onClick={() => doAction(it.id, "resume", "Resumed")}><Play className="size-3.5" /></Button>}
                  {it.status === "deleted" ? (
                    <Button size="sm" variant="outline" className="rounded-none h-8" onClick={() => doAction(it.id, "restore", "Restored")}><ArchiveRestore className="size-3.5" /></Button>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-none h-8 text-primary" onClick={() => remove(it.id)}><Trash2 className="size-3.5" /></Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card overflow-x-auto" data-testid="qr-list-table">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-4">Name</th><th className="p-4">Type</th><th className="p-4">Short code</th><th className="p-4">Scans</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-border last:border-0 hover:bg-accent">
                  <td className="p-4"><Link to={`/qr/${it.id}`} className="font-medium hover:text-primary">{it.name}</Link></td>
                  <td className="p-4 font-mono text-xs text-muted-foreground uppercase">{it.type}</td>
                  <td className="p-4 font-mono text-xs">{it.short_code}</td>
                  <td className="p-4 font-mono">{it.scan_count}</td>
                  <td className="p-4"><Badge className={`rounded-none ${it.status === "active" ? "bg-primary" : "bg-muted text-muted-foreground"}`}>{it.status}</Badge></td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-1">
                      <Button asChild size="sm" variant="outline" className="rounded-none h-8"><Link to={`/qr/${it.id}`}><Eye className="size-3.5" /></Link></Button>
                      {it.status === "active" ? <Button size="sm" variant="outline" className="rounded-none h-8" onClick={() => doAction(it.id, "pause", "Paused")}><Pause className="size-3.5" /></Button> :
                        it.status === "paused" ? <Button size="sm" variant="outline" className="rounded-none h-8" onClick={() => doAction(it.id, "resume", "Resumed")}><Play className="size-3.5" /></Button> : null}
                      <Button size="sm" variant="outline" className="rounded-none h-8 text-primary" onClick={() => remove(it.id)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
