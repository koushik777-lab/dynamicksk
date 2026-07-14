import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Download, Pause, Play, Trash2, Loader2, RotateCcw, ExternalLink } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { toast } from "sonner";
import { api, formatError, backendOrigin } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#FF3B30", "#0A0A0A", "#404040", "#787878", "#B0B0B0"];

export default function QRDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const [qr, setQr] = useState(null);
  const [overview, setOverview] = useState(null);
  const [recent, setRecent] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [q, o, r] = await Promise.all([
        api.get(`/qr/${id}`),
        api.get("/analytics/overview", { params: { qr_id: id, days: 30 } }),
        api.get("/analytics/recent-scans", { params: { qr_id: id, limit: 25 } }),
      ]);
      setQr(q.data); setOverview(o.data); setRecent(r.data);
    } catch (e) { toast.error(formatError(e)); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/qr/${id}`, { name: qr.name, data: qr.data, design: qr.design });
      toast.success("QR updated");
      load();
    } catch (e) { toast.error(formatError(e)); }
    finally { setSaving(false); }
  };

  const doAction = async (action, verb) => {
    try { await api.post(`/qr/${id}/${action}`); toast.success(verb); load(); }
    catch (e) { toast.error(formatError(e)); }
  };

  const remove = async () => {
    if (!window.confirm("Delete this QR?")) return;
    await api.delete(`/qr/${id}`);
    toast.success("Deleted"); nav("/qr");
  };

  const download = async (fmt) => {
    try {
      const res = await api.get(`/qr/${id}/download`, { params: { format: fmt, size: 1024 }, responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `qr-${qr.short_code}.${fmt}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast.error(formatError(e)); }
  };

  if (!qr) return <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-none" />)}</div>;

  const redirectUrl = `${backendOrigin()}/api/r/${qr.short_code}`;
  const isAdmin = user?.role === "super_admin";

  return (
    <div className="space-y-6">
      <Link to="/qr" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> All QR codes</Link>

      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">{qr.type}</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">{qr.name}</h1>
          <div className="flex items-center gap-3 mt-3 text-sm">
            <Badge className={`rounded-none ${qr.status === "active" ? "bg-primary" : "bg-muted-foreground"}`}>{qr.status}</Badge>
            <span className="font-mono text-muted-foreground">{qr.short_code}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">v{qr.version}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {qr.status === "active" ? <Button variant="outline" className="rounded-none" onClick={() => doAction("pause", "Paused")} data-testid="pause-btn"><Pause className="size-4 mr-1.5" /> Pause</Button> :
           qr.status === "paused" ? <Button variant="outline" className="rounded-none" onClick={() => doAction("resume", "Resumed")} data-testid="resume-btn"><Play className="size-4 mr-1.5" /> Resume</Button> : null}
          {qr.status === "deleted" && <Button variant="outline" className="rounded-none" onClick={() => doAction("restore", "Restored")}><RotateCcw className="size-4 mr-1.5" /> Restore</Button>}
          <Button variant="outline" className="rounded-none text-primary hover:text-primary" onClick={remove} data-testid="delete-btn"><Trash2 className="size-4 mr-1.5" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
        <div className="bg-card p-6 lg:col-span-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Preview</div>
          <div className="aspect-square bg-white grid place-items-center p-4 border border-border">
            <img src={`${backendOrigin()}/api/qr/${id}/preview?size=384&t=${qr.version}&k=${(token||'').slice(-8)}`} alt={qr.name} crossOrigin="anonymous" className="max-w-full h-auto" />
          </div>
          <div className="mt-4 space-y-2">
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Redirect URL</Label>
            <div className="flex gap-1">
              <Input value={redirectUrl} readOnly className="h-10 rounded-none font-mono text-xs" />
              <Button variant="outline" className="rounded-none h-10" onClick={() => { navigator.clipboard.writeText(redirectUrl); toast.success("Copied"); }} data-testid="copy-redirect"><Copy className="size-4" /></Button>
              <a href={redirectUrl} target="_blank" rel="noreferrer" className="border border-border h-10 grid place-items-center px-3 hover:border-primary hover:text-primary"><ExternalLink className="size-4" /></a>
            </div>
          </div>
          <div className="mt-4">
            <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Download</Label>
            <div className="grid grid-cols-4 gap-1 mt-1.5">
              {["png", "svg", "pdf", "jpg"].map((f) => (
                <Button key={f} variant="outline" className="rounded-none h-10" onClick={() => download(f)} data-testid={`download-${f}`}>{f.toUpperCase()}</Button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card p-6">
          <Tabs defaultValue="analytics">
            <TabsList className="rounded-none bg-transparent border-b border-border p-0 h-auto w-full justify-start">
              <TabsTrigger value="analytics" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary" data-testid="tab-analytics">Analytics</TabsTrigger>
              <TabsTrigger value="edit" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary" data-testid="tab-edit">Edit</TabsTrigger>
              <TabsTrigger value="scans" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary" data-testid="tab-scans">Scans</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="pt-6 space-y-6">
              <div className="grid grid-cols-3 gap-px bg-border border border-border">
                <Kpi label="Total scans" value={overview?.total_scans || 0} />
                <Kpi label="Unique visitors" value={overview?.unique_visitors || 0} />
                <Kpi label="Today" value={overview?.today_scans || 0} />
              </div>
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={overview?.timeline || []}>
                    <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                    <Line type="monotone" dataKey="scans" stroke="#FF3B30" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TopList title="Countries" items={overview?.countries || []} />
                <TopList title="Devices" items={overview?.devices || []} />
                <TopList title="Browsers" items={overview?.browsers || []} />
                <TopList title="OS" items={overview?.os || []} />
              </div>
              <Button variant="outline" className="rounded-none" onClick={async () => {
                const res = await api.get("/analytics/export", { params: { qr_id: id }, responseType: "blob" });
                const url = URL.createObjectURL(res.data);
                const a = document.createElement("a");
                a.href = url; a.download = `scans-${qr.short_code}.csv`; a.click();
              }} data-testid="export-csv"><Download className="size-4 mr-2" /> Export CSV</Button>
            </TabsContent>

            <TabsContent value="edit" className="pt-6 space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Name</Label>
                <Input value={qr.name || ""} onChange={(e) => setQr({ ...qr, name: e.target.value })} className="mt-1.5 h-11 rounded-none" data-testid="edit-name" />
              </div>
              <EditFields qr={qr} setQr={setQr} />
              <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 rounded-none h-11" data-testid="save-changes">
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
              </Button>
              {(qr.version > 1) && <div className="text-xs text-muted-foreground">Version {qr.version} — previous versions are stored automatically.</div>}
            </TabsContent>

            <TabsContent value="scans" className="pt-6">
              {recent.length === 0 ? <div className="text-muted-foreground text-sm">No scans yet.</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr><th className="py-2 pr-3">When</th><th className="py-2 pr-3">Country / City</th><th className="py-2 pr-3">Device</th><th className="py-2 pr-3">Browser</th><th className="py-2 pr-3">OS</th></tr>
                    </thead>
                    <tbody>
                      {recent.map((s) => (
                        <tr key={s.id} className="border-b border-border last:border-0">
                          <td className="py-2 pr-3 font-mono text-xs">{new Date(s.timestamp).toLocaleString()}</td>
                          <td className="py-2 pr-3">{s.country} · <span className="text-muted-foreground">{s.city}</span></td>
                          <td className="py-2 pr-3">{s.device}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{s.browser}</td>
                          <td className="py-2 pr-3 text-xs text-muted-foreground">{s.os}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="bg-card p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-bold mt-1">{Number(value).toLocaleString()}</div>
    </div>
  );
}

function TopList({ title, items }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</div>
      <div className="space-y-1">
        {items.slice(0, 6).map((it) => (
          <div key={it.name} className="text-xs">
            <div className="flex items-center justify-between mb-0.5"><span>{it.name}</span><span className="font-mono text-muted-foreground">{it.value}</span></div>
            <div className="h-0.5 bg-muted"><div className="h-full bg-primary" style={{ width: `${(it.value / max) * 100}%` }} /></div>
          </div>
        ))}
        {items.length === 0 && <div className="text-muted-foreground text-xs">No data yet</div>}
      </div>
    </div>
  );
}

function EditFields({ qr, setQr }) {
  const setData = (k, v) => setQr({ ...qr, data: { ...qr.data, [k]: v } });
  const t = qr.type;
  if (["url", "website", "pdf", "image", "video", "audio", "google_maps", "google_review", "youtube", "facebook", "instagram", "linkedin", "twitter", "telegram", "app_store", "play_store", "menu", "coupon", "feedback", "multi_link"].includes(t)) {
    return (
      <div>
        <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Destination URL</Label>
        <Input value={qr.data.url || ""} onChange={(e) => setData("url", e.target.value)} className="mt-1.5 h-11 rounded-none" data-testid="edit-url" />
      </div>
    );
  }
  if (t === "text") return <Textarea value={qr.data.text || ""} onChange={(e) => setData("text", e.target.value)} rows={5} className="rounded-none" />;
  if (t === "email") return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <Input placeholder="to" value={qr.data.to || ""} onChange={(e) => setData("to", e.target.value)} className="h-10 rounded-none" />
    <Input placeholder="subject" value={qr.data.subject || ""} onChange={(e) => setData("subject", e.target.value)} className="h-10 rounded-none" />
    <Textarea className="col-span-full rounded-none" placeholder="body" value={qr.data.body || ""} onChange={(e) => setData("body", e.target.value)} />
  </div>;
  return <Input value={qr.data.url || qr.data.text || ""} onChange={(e) => setData("url", e.target.value)} className="h-11 rounded-none" placeholder="Content" />;
}
