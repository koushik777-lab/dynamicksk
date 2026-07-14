import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Wand2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { QR_TYPES, PATTERNS, GRADIENTS, PRESETS } from "@/constants/qr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import QRPreview from "@/components/QRPreview";

const TYPE_GROUPS = ["Basic", "Business", "Location", "Media", "Social", "Advanced"];

export default function QRCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [managers, setManagers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    type: "url",
    data: { url: "" },
    is_dynamic: true,
    company_id: "",
    manager_id: "",
    tags: [],
    password: "",
    expiry: "",
    scan_limit: null,
    design: {
      pattern: "square",
      fg_color: "#0A0A0A",
      fg_color_end: "#0A0A0A",
      bg_color: "#FFFFFF",
      gradient: "none",
      padding: 2,
      error_correction: "H",
      logo_url: null,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const [c, m] = await Promise.all([api.get("/companies"), api.get("/managers")]);
        setCompanies(c.data); setManagers(m.data);
      } catch (e) {}
    })();
  }, []);

  const setData = (k, v) => setForm({ ...form, data: { ...form.data, [k]: v } });
  const setDesign = (k, v) => setForm({ ...form, design: { ...form.design, [k]: v } });

  const applyPreset = (p) => setForm({ ...form, design: { ...form.design, ...p, fg_color_end: p.fg_color_end || p.fg_color } });

  const managersForCompany = managers.filter((m) => !form.company_id || m.company_id === form.company_id);

  const submit = async () => {
    if (!form.name) return toast.error("Name required");
    if (!form.company_id) return toast.error("Assign a company");
    setSaving(true);
    try {
      const res = await api.post("/qr", form);
      toast.success("QR code created");
      navigate(`/qr/${res.data.id}`);
    } catch (e) { toast.error(formatError(e)); }
    finally { setSaving(false); }
  };

  const uploadLogo = async (file) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setDesign("logo_url", res.data.url);
      toast.success("Logo uploaded");
    } catch (e) { toast.error(formatError(e)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link to="/qr" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="size-4" /> Back to QR codes</Link>
        <div className="flex items-center gap-3">
          <div className="text-[10px] uppercase tracking-[0.28em] text-primary">Wizard</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <span className={step >= 1 ? "text-primary" : ""}>01 Type</span> <ChevronRight className="size-3" />
            <span className={step >= 2 ? "text-primary" : ""}>02 Content</span> <ChevronRight className="size-3" />
            <span className={step >= 3 ? "text-primary" : ""}>03 Design</span> <ChevronRight className="size-3" />
            <span className={step >= 4 ? "text-primary" : ""}>04 Assign</span>
          </div>
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight mt-2">Create QR Code</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
        {/* Left: form */}
        <div className="lg:col-span-2 bg-card p-6 lg:p-8 space-y-6">
          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-semibold mb-4">Choose a QR type</h2>
              {TYPE_GROUPS.map((g) => (
                <div key={g} className="mb-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3">{g}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-border border border-border">
                    {QR_TYPES.filter((t) => t.group === g).map((t) => (
                      <button
                        key={t.value}
                        onClick={() => { setForm({ ...form, type: t.value, data: {} }); setStep(2); }}
                        data-testid={`type-${t.value}`}
                        className={`bg-card p-4 text-left hover:bg-accent transition-colors ${form.type === t.value ? "outline outline-2 outline-primary -outline-offset-2" : ""}`}
                      >
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase mt-1">{t.value}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold">Content</h2>
              <div>
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">QR Name (internal)</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-11 rounded-none" placeholder="e.g. Menu at Downtown location" data-testid="qr-name" />
              </div>
              <div className="flex items-center justify-between border border-border p-3">
                <div>
                  <div className="text-sm font-medium">Dynamic QR</div>
                  <div className="text-xs text-muted-foreground">Editable destination + full analytics. Recommended.</div>
                </div>
                <Switch checked={form.is_dynamic} onCheckedChange={(v) => setForm({ ...form, is_dynamic: v })} data-testid="qr-dynamic" />
              </div>
              <ContentForm type={form.type} data={form.data} setData={setData} />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="rounded-none">Back</Button>
                <Button onClick={() => setStep(3)} className="bg-primary hover:bg-primary/90 rounded-none" data-testid="step-next-design">Next: Design</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold">Design</h2>
              <div>
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-2 block">Presets</Label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-border border border-border">
                  {PRESETS.map((p) => (
                    <button key={p.name} onClick={() => applyPreset(p)} className="bg-card p-3 text-xs hover:bg-accent" data-testid={`preset-${p.name.toLowerCase()}`}>
                      <div className="size-10 mx-auto mb-2" style={{ background: p.fg_color, border: `2px solid ${p.bg_color === "#FFFFFF" ? "#0A0A0A20" : "transparent"}` }} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <Tabs defaultValue="pattern">
                <TabsList className="rounded-none bg-transparent border-b border-border p-0 h-auto">
                  <TabsTrigger value="pattern" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">Pattern</TabsTrigger>
                  <TabsTrigger value="colors" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">Colors</TabsTrigger>
                  <TabsTrigger value="logo" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">Logo</TabsTrigger>
                  <TabsTrigger value="advanced" className="rounded-none data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="pattern" className="pt-4">
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-px bg-border border border-border">
                    {PATTERNS.map((p) => (
                      <button key={p.value} onClick={() => setDesign("pattern", p.value)} className={`bg-card p-3 text-xs hover:bg-accent ${form.design.pattern === p.value ? "outline outline-2 outline-primary -outline-offset-2" : ""}`}>{p.label}</button>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="colors" className="pt-4 space-y-4">
                  <ColorField label="Foreground" value={form.design.fg_color} onChange={(v) => setDesign("fg_color", v)} testid="fg-color" />
                  <div>
                    <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Gradient</Label>
                    <Select value={form.design.gradient} onValueChange={(v) => setDesign("gradient", v)}>
                      <SelectTrigger className="mt-1.5 h-10 rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>{GRADIENTS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {form.design.gradient !== "none" && (
                    <ColorField label="Gradient end color" value={form.design.fg_color_end} onChange={(v) => setDesign("fg_color_end", v)} testid="fg-color-end" />
                  )}
                  <ColorField label="Background" value={form.design.bg_color} onChange={(v) => setDesign("bg_color", v)} testid="bg-color" />
                </TabsContent>
                <TabsContent value="logo" className="pt-4 space-y-3">
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Upload logo (PNG/SVG, up to 2MB)</Label>
                  <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} className="rounded-none" data-testid="logo-upload" />
                  {form.design.logo_url && (
                    <div className="flex items-center gap-3 border border-border p-3">
                      <img src={`${process.env.REACT_APP_BACKEND_URL}${form.design.logo_url}`} alt="logo" className="size-10 object-contain" />
                      <span className="text-xs font-mono flex-1 truncate">{form.design.logo_url}</span>
                      <Button size="sm" variant="outline" className="rounded-none" onClick={() => setDesign("logo_url", null)}>Remove</Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="advanced" className="pt-4 space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Padding (border)</Label>
                    <Slider value={[form.design.padding]} onValueChange={(v) => setDesign("padding", v[0])} min={0} max={8} step={1} className="mt-3" />
                    <div className="text-xs text-muted-foreground mt-1 font-mono">{form.design.padding} modules</div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Error correction</Label>
                    <Select value={form.design.error_correction} onValueChange={(v) => setDesign("error_correction", v)}>
                      <SelectTrigger className="mt-1.5 h-10 rounded-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["L", "M", "Q", "H"].map((e) => <SelectItem key={e} value={e}>{e} — {e === "H" ? "High (30%)" : e === "Q" ? "Quartile (25%)" : e === "M" ? "Medium (15%)" : "Low (7%)"}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="rounded-none">Back</Button>
                <Button onClick={() => setStep(4)} className="bg-primary hover:bg-primary/90 rounded-none">Next: Assign</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold">Assign</h2>
              <div>
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">QR Name (required)</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 h-11 rounded-none"
                  placeholder="e.g. Menu at Downtown location"
                  data-testid="qr-name-assign"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Company (required)</Label>
                <Select value={form.company_id} onValueChange={(v) => setForm({ ...form, company_id: v, manager_id: "" })}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-none" data-testid="assign-company"><SelectValue placeholder="Pick a company" /></SelectTrigger>
                  <SelectContent>{companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Manager (optional)</Label>
                <Select value={form.manager_id} onValueChange={(v) => setForm({ ...form, manager_id: v })}>
                  <SelectTrigger className="mt-1.5 h-11 rounded-none" data-testid="assign-manager"><SelectValue placeholder="Pick a manager" /></SelectTrigger>
                  <SelectContent>{managersForCompany.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} · {m.email}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">The manager will be able to edit URL, pause/resume, and view analytics for this QR.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Password (optional)</Label>
                  <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 h-10 rounded-none" placeholder="—" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Expiry</Label>
                  <Input type="datetime-local" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="mt-1.5 h-10 rounded-none" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Scan limit</Label>
                  <Input type="number" value={form.scan_limit || ""} onChange={(e) => setForm({ ...form, scan_limit: e.target.value ? parseInt(e.target.value) : null })} className="mt-1.5 h-10 rounded-none" placeholder="Unlimited" />
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)} className="rounded-none">Back</Button>
                <Button onClick={submit} disabled={saving} className="bg-primary hover:bg-primary/90 rounded-none" data-testid="create-qr-submit">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <><Wand2 className="size-4 mr-2" /> Create QR</>}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right: sticky preview */}
        <div className="bg-card p-6 lg:sticky lg:top-16 lg:self-start">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Live preview</div>
          <QRPreview type={form.type} data={form.data} design={form.design} is_dynamic={form.is_dynamic} />
          <div className="mt-4 text-xs text-muted-foreground font-mono break-all">
            {form.type.toUpperCase()} · {form.is_dynamic ? "dynamic" : "static"}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange, testid }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2 mt-1.5">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-11 border border-border" data-testid={testid} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-none font-mono w-32" />
      </div>
    </div>
  );
}

function ContentForm({ type, data, setData }) {
  const F = (label, key, props = {}) => (
    <div key={key}>
      <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</Label>
      <Input value={data[key] || ""} onChange={(e) => setData(key, e.target.value)} className="mt-1.5 h-10 rounded-none" data-testid={`content-${key}`} {...props} />
    </div>
  );
  switch (type) {
    case "text":
      return <div><Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Text</Label><Textarea value={data.text || ""} onChange={(e) => setData("text", e.target.value)} className="mt-1.5 rounded-none" rows={5} data-testid="content-text" /></div>;
    case "email":
      return <div className="space-y-4">{F("To", "to")}{F("Subject", "subject")}<div><Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Body</Label><Textarea value={data.body || ""} onChange={(e) => setData("body", e.target.value)} className="mt-1.5 rounded-none" /></div></div>;
    case "sms":
    case "whatsapp":
      return <div className="space-y-4">{F("Phone", "phone")}<div><Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Message</Label><Textarea value={data.message || ""} onChange={(e) => setData("message", e.target.value)} className="mt-1.5 rounded-none" /></div></div>;
    case "phone":
      return <div className="space-y-4">{F("Phone", "phone")}</div>;
    case "wifi":
      return <div className="space-y-4">
        {F("SSID", "ssid")}
        {F("Password", "password", { type: "password" })}
        <div>
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Encryption</Label>
          <Select value={data.encryption || "WPA"} onValueChange={(v) => setData("encryption", v)}>
            <SelectTrigger className="mt-1.5 h-10 rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="WPA">WPA / WPA2</SelectItem><SelectItem value="WEP">WEP</SelectItem><SelectItem value="nopass">None</SelectItem></SelectContent>
          </Select>
        </div>
      </div>;
    case "vcard":
    case "business_card":
      return <div className="grid grid-cols-2 gap-4">{F("Full name", "name")}{F("Organization", "organization")}{F("Title", "title")}{F("Phone", "phone")}{F("Email", "email")}{F("Website", "website")}<div className="col-span-2">{F("Address", "address")}</div></div>;
    case "location":
      return <div className="grid grid-cols-2 gap-4">{F("Latitude", "lat")}{F("Longitude", "lng")}</div>;
    case "crypto":
      return <div className="space-y-4">
        <div>
          <Label className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Coin</Label>
          <Select value={data.coin || "bitcoin"} onValueChange={(v) => setData("coin", v)}>
            <SelectTrigger className="mt-1.5 h-10 rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="bitcoin">Bitcoin</SelectItem><SelectItem value="ethereum">Ethereum</SelectItem><SelectItem value="litecoin">Litecoin</SelectItem></SelectContent>
          </Select>
        </div>
        {F("Wallet address", "address")}
      </div>;
    default:
      return F("Destination URL", "url", { placeholder: "https://..." });
  }
}
