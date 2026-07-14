import React, { useState, useEffect } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Building2, Users, QrCode } from "lucide-react";

export default function GlobalSearch({ open, setOpen }) {
  const [q, setQ] = useState("");
  const [data, setData] = useState({ companies: [], managers: [], qr: [] });
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  useEffect(() => {
    if (!q) { setData({ companies: [], managers: [], qr: [] }); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/dashboard/search", { params: { q } });
        setData(res.data);
      } catch (_) {}
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path) => { setOpen(false); navigate(path); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search companies, managers, QR codes..." value={q} onValueChange={setQ} data-testid="global-search-input" />
      <CommandList>
        <CommandEmpty>{q ? "No results" : "Start typing to search"}</CommandEmpty>
        {data.companies?.length > 0 && (
          <CommandGroup heading="Companies">
            {data.companies.map((c) => (
              <CommandItem key={c.id} onSelect={() => go(`/companies?id=${c.id}`)} data-testid={`search-result-company-${c.id}`}>
                <Building2 className="mr-2 size-4" /> {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {data.managers?.length > 0 && (
          <CommandGroup heading="Managers">
            {data.managers.map((m) => (
              <CommandItem key={m.id} onSelect={() => go(`/managers?id=${m.id}`)}>
                <Users className="mr-2 size-4" /> {m.name} <span className="text-muted-foreground ml-2">{m.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {data.qr?.length > 0 && (
          <CommandGroup heading="QR Codes">
            {data.qr.map((q_) => (
              <CommandItem key={q_.id} onSelect={() => go(`/qr/${q_.id}`)}>
                <QrCode className="mr-2 size-4" /> {q_.name} <span className="text-muted-foreground ml-2 font-mono text-xs">{q_.short_code}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
