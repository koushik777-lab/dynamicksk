import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, FolderKanban, Trash2 } from "lucide-react";

export default function Folders() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const load = () => api.get("/folders").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return;
    try { await api.post("/folders", { name }); setName(""); setOpen(false); load(); toast.success("Folder created"); }
    catch (e) { toast.error(formatError(e)); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this folder? QR codes inside will be moved to root.")) return;
    await api.delete(`/folders/${id}`); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">Organization</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Folders</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-primary hover:bg-primary/90 rounded-none" data-testid="new-folder-btn"><Plus className="size-4 mr-1.5" /> New folder</Button></DialogTrigger>
          <DialogContent className="rounded-none">
            <DialogHeader><DialogTitle>Create folder</DialogTitle></DialogHeader>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" className="h-10 rounded-none" data-testid="folder-name" />
            <DialogFooter><Button onClick={create} className="bg-primary hover:bg-primary/90 rounded-none" data-testid="folder-submit">Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {items.length === 0 ? (
        <div className="border border-border p-16 grid place-items-center text-center">
          <FolderKanban className="size-12 text-muted-foreground mb-4" strokeWidth={1.5} />
          <h3 className="font-display text-2xl font-bold">No folders yet</h3>
          <p className="text-muted-foreground mt-2">Create folders to organize your QR codes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
          {items.map((f) => (
            <div key={f.id} className="bg-card p-4 flex items-center justify-between group">
              <div>
                <FolderKanban className="size-5 text-primary mb-2" />
                <div className="font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{f.id.slice(0, 8)}</div>
              </div>
              <button className="opacity-0 group-hover:opacity-100 text-primary" onClick={() => remove(f.id)} data-testid={`delete-folder-${f.id}`}><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
