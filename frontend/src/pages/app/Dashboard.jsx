import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { QrCode, Building2, Users, Activity as ActIcon, TrendingUp, Globe, Smartphone } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#FF3B30", "#0A0A0A", "#404040", "#787878", "#B0B0B0"];

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, o] = await Promise.all([api.get("/dashboard/stats"), api.get("/analytics/overview", { params: { days: 30 } })]);
        setStats(s.data);
        setOverview(o.data);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-none" />)}</div>;

  const isAdmin = user?.role === "super_admin";

  const kpis = isAdmin ? [
    { label: "Companies", value: stats.total_companies, icon: Building2 },
    { label: "Managers", value: stats.total_managers, icon: Users },
    { label: "QR Codes", value: stats.total_qr, icon: QrCode },
    { label: "Total Scans", value: stats.total_scans, icon: ActIcon },
    { label: "Today", value: stats.today_scans, icon: TrendingUp, accent: true },
    { label: "This Month", value: stats.month_scans, icon: TrendingUp },
    { label: "Active", value: stats.active_qr, icon: QrCode },
    { label: "Paused", value: stats.paused_qr, icon: QrCode },
  ] : [
    { label: "My QR Codes", value: stats.total_qr, icon: QrCode },
    { label: "Active", value: stats.active_qr, icon: QrCode },
    { label: "Paused", value: stats.paused_qr, icon: QrCode },
    { label: "Total Scans", value: stats.total_scans, icon: ActIcon },
    { label: "Today", value: stats.today_scans, icon: TrendingUp, accent: true },
    { label: "This Month", value: stats.month_scans, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-2">{isAdmin ? "Owner Overview" : "Manager Overview"}</div>
        <h1 className="font-display text-5xl font-bold tracking-tight">Hello, {user?.name?.split(" ")[0]}.</h1>
        <p className="text-muted-foreground mt-2">Everything running under your control, at a glance.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border" data-testid="kpi-grid">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={`bg-card p-5 ${k.accent ? "border-l-2 border-primary" : ""}`} data-testid={`kpi-${k.label.toLowerCase().replace(/\s+/g,"-")}`}>
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[10px] uppercase tracking-[0.2em]">{k.label}</span>
              <k.icon className="size-4" strokeWidth={1.5} />
            </div>
            <div className="font-display text-4xl font-bold tracking-tight">{Number(k.value).toLocaleString()}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
        <div className="lg:col-span-2 bg-card p-6" data-testid="timeline-chart">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">30-Day Scan Trend</div>
              <div className="font-display text-2xl font-bold mt-1">{overview?.recent_scans?.toLocaleString() || 0} scans</div>
            </div>
            <div className="text-xs text-muted-foreground font-mono">{overview?.unique_visitors} unique</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={overview?.timeline || []}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                <Line type="monotone" dataKey="scans" stroke="#FF3B30" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6" data-testid="devices-chart">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 flex items-center gap-2"><Smartphone className="size-3.5" /> Devices</div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={overview?.devices?.slice(0, 5) || []} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} strokeWidth={0}>
                  {(overview?.devices || []).slice(0, 5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            {(overview?.devices || []).slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span className="size-2" style={{ background: COLORS[i % COLORS.length] }} />{d.name}</span>
                <span className="text-muted-foreground font-mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border">
        <div className="bg-card p-6" data-testid="top-countries">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2"><Globe className="size-3.5" /> Top Countries</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={overview?.countries?.slice(0, 8) || []} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={90} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                <Bar dataKey="value" fill="#FF3B30" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card p-6" data-testid="recent-qr">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Recent QR Codes</div>
          {(stats.recent_qr || []).length === 0 && <div className="text-muted-foreground text-sm">No QR codes yet.</div>}
          <div className="divide-y divide-border">
            {(stats.recent_qr || []).map((q) => (
              <Link key={q.id} to={`/qr/${q.id}`} className="flex items-center py-3 group hover:bg-accent -mx-2 px-2 transition-colors">
                <div className="size-9 bg-primary/10 border border-primary/20 grid place-items-center text-primary mr-3"><QrCode className="size-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate group-hover:text-primary transition-colors">{q.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{q.type} · {q.short_code}</div>
                </div>
                <div className="text-sm font-mono text-muted-foreground">{q.scan_count} scans</div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border">
          <div className="bg-card p-6" data-testid="recent-companies">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Recent Companies</div>
            {(stats.recent_companies || []).length === 0 && <div className="text-muted-foreground text-sm">No companies yet.</div>}
            <div className="divide-y divide-border">
              {(stats.recent_companies || []).map((c) => (
                <div key={c.id} className="flex items-center py-3">
                  <div className="size-9 bg-accent border border-border grid place-items-center mr-3 font-medium">{c.name?.slice(0, 1)}</div>
                  <div className="flex-1"><div className="font-medium">{c.name}</div><div className="text-xs text-muted-foreground">{c.status}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card p-6" data-testid="activity-feed">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Latest Activity</div>
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {(stats.activities || []).map((a) => (
                <div key={a.id} className="text-sm flex items-start gap-3">
                  <span className="size-1.5 rounded-full bg-primary mt-2" />
                  <div className="flex-1 min-w-0">
                    <div><span className="font-medium">{a.actor_email}</span> <span className="text-muted-foreground">{a.action.replace(/\./g, " ")}</span></div>
                    <div className="text-xs text-muted-foreground font-mono">{new Date(a.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {(stats.activities || []).length === 0 && <div className="text-muted-foreground text-sm">No activity yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
