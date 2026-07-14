import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Activity as ActIcon } from "lucide-react";

export default function ActivityLogs() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get("/activity", { params: { limit: 200 } }).then((r) => setItems(r.data)); }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">Trail</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Activity</h1>
      </div>
      {items.length === 0 ? (
        <div className="border border-border p-16 grid place-items-center text-center">
          <ActIcon className="size-12 text-muted-foreground mb-4" strokeWidth={1.5} />
          <h3 className="font-display text-2xl font-bold">Nothing yet</h3>
          <p className="text-muted-foreground mt-2">Actions will appear here as they happen.</p>
        </div>
      ) : (
        <div className="border border-border bg-card">
          <div className="divide-y divide-border">
            {items.map((a) => (
              <div key={a.id} className="p-4 flex items-start gap-3 hover:bg-accent" data-testid={`log-${a.id}`}>
                <span className="size-1.5 rounded-full bg-primary mt-2" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm"><span className="font-medium">{a.actor_email}</span> <span className="text-muted-foreground">{a.action.replace(/\./g, " ")}</span> {a.entity_type && <span className="font-mono text-xs text-muted-foreground">· {a.entity_type}/{a.entity_id?.slice(0, 8)}</span>}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{new Date(a.timestamp).toLocaleString()} · {a.ip || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
