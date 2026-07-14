import React, { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { Download } from "lucide-react";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ["#FF3B30", "#0A0A0A", "#404040", "#787878", "#B0B0B0"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState("30");

  useEffect(() => { api.get("/analytics/overview", { params: { days: parseInt(days) } }).then((r) => setData(r.data)); }, [days]);

  if (!data) return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-none" />)}</div>;

  const download = async () => {
    const res = await api.get("/analytics/export", { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a"); a.href = url; a.download = "scans.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">Realtime intelligence</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Analytics</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="h-10 rounded-none w-40" data-testid="analytics-range"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last 365 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={download} className="rounded-none h-10" data-testid="analytics-export"><Download className="size-4 mr-1.5" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-border border border-border">
        {[
          ["Total", data.total_scans], ["Range", data.recent_scans], ["Today", data.today_scans], ["Unique", data.unique_visitors], ["Live (5m)", data.live_visitors],
        ].map(([l, v]) => (
          <div key={l} className="bg-card p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{l}</div>
            <div className="font-display text-4xl font-bold mt-1">{Number(v).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
        <div className="lg:col-span-2 bg-card p-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Timeline</div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={data.timeline}>
                <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
                <Line type="monotone" dataKey="scans" stroke="#FF3B30" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card p-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Devices</div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.devices.slice(0, 5)} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                  {data.devices.slice(0, 5).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border border border-border">
        <ChartCard title="Countries" data={data.countries} />
        <ChartCard title="Cities" data={data.cities} />
        <ChartCard title="Browsers" data={data.browsers} />
        <ChartCard title="Operating systems" data={data.os} />
        <ChartCard title="Languages" data={data.languages} />
        <ChartCard title="Referrers" data={data.referrers} />
      </div>
    </div>
  );
}

function ChartCard({ title, data }) {
  return (
    <div className="bg-card p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{title}</div>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 8 }}>
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 0, fontSize: 12 }} />
            <Bar dataKey="value" fill="#FF3B30" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
