import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Terminal, Shield, BarChart3, QrCode, Building2, Users, Zap, ArrowRight, Code2, Linkedin } from "lucide-react";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "quickstart", label: "Quick Start" },
  { id: "companies", label: "Companies" },
  { id: "managers", label: "Managers" },
  { id: "qrcodes", label: "QR Codes" },
  { id: "analytics", label: "Analytics" },
  { id: "api", label: "API Reference" },
  { id: "security", label: "Security" },
];

function Tag({ children, color = "red" }) {
  const colors = {
    red: "bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };
  return (
    <span className={`inline-block border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
}

function Section({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 pt-12 first:pt-0 border-t border-white/8 first:border-0">
      <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="size-5 text-[#FF3B30]" strokeWidth={1.5} />}
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
      </div>
      <div className="space-y-4 text-white/65 leading-relaxed">{children}</div>
    </section>
  );
}

export default function Docs() {
  const [active, setActive] = useState("overview");

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-40 bg-black/80 backdrop-blur border-b border-white/12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-lg">
            <div className="size-8 bg-[#FF3B30] grid place-items-center font-bold text-lg">Q</div>
            QR<span className="text-[#FF3B30]">.</span>NEXUS
          </Link>
          <nav className="hidden md:flex items-center gap-8 mx-auto text-sm text-white/70">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/docs" className="text-white font-medium">Docs</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </nav>
          <Link to="/login" className="bg-[#FF3B30] hover:bg-[#D63026] text-white text-sm font-medium px-4 py-2 transition-colors">Sign in</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-24 flex gap-12">
        {/* SIDEBAR */}
        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24 self-start">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/40 mb-4">Contents</div>
          <nav className="space-y-0.5">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActive(s.id)}
                className={`block text-sm py-1.5 px-3 transition-colors ${
                  active === s.id
                    ? "text-[#FF3B30] border-l-2 border-[#FF3B30] bg-[#FF3B30]/5"
                    : "text-white/50 hover:text-white border-l-2 border-white/8"
                }`}
              >
                {s.label}
              </a>
            ))}
          </nav>

          {/* Quick links */}
          <div className="mt-8 pt-6 border-t border-white/8">
            <div className="text-[10px] uppercase tracking-[0.28em] text-white/40 mb-3">Resources</div>
            <div className="space-y-2 text-xs">
              <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/50 hover:text-white">
                <Terminal className="size-3" /> Interactive API Docs
              </a>
              <Link to="/contact" className="flex items-center gap-2 text-white/50 hover:text-white">
                <ArrowRight className="size-3" /> Get Support
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 max-w-3xl space-y-0">
          <div className="mb-8">
            <Link to="/" className="text-white/50 hover:text-white text-sm flex items-center gap-1">← Back home</Link>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mt-4 mb-2">Documentation</div>
            <h1 className="font-display text-5xl font-bold tracking-tight">QR Nexus Docs</h1>
            <p className="text-white/50 mt-3 text-lg">
              Everything you need to set up, manage, and scale your QR infrastructure.
            </p>
          </div>

          {/* OVERVIEW */}
          <Section id="overview" icon={QrCode} title="Overview">
            <p>
              <strong className="text-white">QR Nexus</strong> is a private-label, enterprise-grade dynamic QR platform.
              It gives you complete ownership of your QR infrastructure — from creating codes to tracking every scan.
            </p>
            <p>
              The system is built around a <strong className="text-white">three-tier hierarchy</strong>: a single
              Super Admin (you) controls everything. Under you are <strong className="text-white">Companies</strong> —
              organizational units that own QR codes. Each company can have one or more
              <strong className="text-white"> Managers</strong> who operate within scoped permissions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/8 border border-white/8 mt-6">
              {[
                { icon: Shield, title: "Super Admin", desc: "Full control. Creates companies, managers, and QR codes." },
                { icon: Building2, title: "Company", desc: "Owns QR codes. A business unit or client in your system." },
                { icon: Users, title: "Manager", desc: "Operates within a company scope. Edits URLs, views analytics." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-[#0a0a0a] p-5">
                  <Icon className="size-4 text-[#FF3B30] mb-3" strokeWidth={1.5} />
                  <div className="font-medium text-sm text-white mb-1">{title}</div>
                  <div className="text-xs text-white/50">{desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* QUICK START */}
          <Section id="quickstart" icon={Zap} title="Quick Start">
            <p>Get up and running in under 5 minutes:</p>
            <div className="space-y-3 mt-2">
              {[
                {
                  step: "01",
                  title: "Sign in as Super Admin",
                  body: "Use your configured admin credentials to access the console. Only Super Admins can manage the full system.",
                },
                {
                  step: "02",
                  title: "Create a Company",
                  body: "Navigate to Companies → New Company. Give it a name and optional branding. This is the owner of your QR codes.",
                },
                {
                  step: "03",
                  title: "Create your first QR Code",
                  body: "Go to QR Codes → New QR. The 4-step wizard guides you: choose a type → set content → customise design → assign to a company.",
                },
                {
                  step: "04",
                  title: "Share and track",
                  body: "Download or share your QR code. Every scan is logged with device, browser, and location data. View analytics from the QR detail page.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 p-5 border border-white/8 bg-[#0a0a0a]">
                  <div className="font-mono text-3xl font-bold text-[#FF3B30]/30 leading-none flex-shrink-0 w-10">{item.step}</div>
                  <div>
                    <div className="font-medium text-white text-sm mb-1">{item.title}</div>
                    <div className="text-xs text-white/50">{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* COMPANIES */}
          <Section id="companies" icon={Building2} title="Companies">
            <p>
              Companies are the organizational unit that own QR codes. Each QR code must be assigned to exactly one company.
            </p>
            <p>
              From the Companies page, you can: create a new company, add a logo, view all QR codes belonging to it, and assign managers.
              Deleting a company will <strong className="text-white">not</strong> delete its QR codes — they will become unassigned.
            </p>
            <div className="bg-[#0a0a0a] border border-white/8 p-4 font-mono text-xs mt-4 whitespace-pre text-white/70">
{`POST  /api/companies          Create a company
GET   /api/companies          List all companies
GET   /api/companies/:id      Get company details
PUT   /api/companies/:id      Update company
DELETE /api/companies/:id     Delete company`}
            </div>
          </Section>

          {/* MANAGERS */}
          <Section id="managers" icon={Users} title="Managers">
            <p>
              Managers are scoped operators assigned to one or more companies. They can edit the redirect URL of QR codes,
              pause or resume them, and view analytics — but cannot create new codes or access other companies.
            </p>
            <p>
              Managers log in using the same login page as the Super Admin. The interface adapts to show only their permitted scope.
            </p>
            <div className="bg-[#0a0a0a] border border-white/8 p-4 font-mono text-xs mt-4 whitespace-pre text-white/70">
{`POST  /api/managers          Create a manager
GET   /api/managers          List managers
GET   /api/managers/:id      Get manager details
PUT   /api/managers/:id      Update manager
DELETE /api/managers/:id     Delete manager`}
            </div>
          </Section>

          {/* QR CODES */}
          <Section id="qrcodes" icon={QrCode} title="QR Codes">
            <p>
              QR codes are the core entity. Each code has a <strong className="text-white">type</strong> (URL, WiFi, vCard, etc.),
              a <strong className="text-white">design</strong> (colors, pattern, logo), and is assigned to a company.
            </p>
            <p>
              <strong className="text-white">Dynamic QR codes</strong> (recommended) route through a short redirect URL{" "}
              <code className="font-mono text-[#FF3B30] text-xs bg-black/40 px-1 py-0.5">/r/{"{shortCode}"}</code>.
              This lets you change the destination without reprinting the QR code.
            </p>
            <div className="mt-4">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Supported QR Types</div>
              <div className="flex flex-wrap gap-2">
                {["URL", "Text", "Email", "SMS", "WhatsApp", "Phone", "WiFi", "vCard", "Location", "PDF", "Video", "Menu", "Multi-link", "Crypto", "App Store", "Social", "Feedback", "Coupon", "Event", "UPI"].map((t) => (
                  <span key={t} className="text-[10px] font-mono border border-white/12 px-2 py-1 text-white/50">{t}</span>
                ))}
              </div>
            </div>
            <div className="mt-6">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40 mb-3">Advanced Controls</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Password protection", desc: "Require a PIN before redirect" },
                  { label: "Expiry date", desc: "Auto-expire the QR on a set date" },
                  { label: "Scan limit", desc: "Disable after N total scans" },
                  { label: "Version history", desc: "See every URL change with a diff" },
                  { label: "Pause / resume", desc: "Instantly disable and re-enable" },
                  { label: "Folder organisation", desc: "Group codes into folders" },
                ].map((item) => (
                  <div key={item.label} className="border border-white/8 bg-[#0a0a0a] p-3">
                    <div className="text-xs font-medium text-white">{item.label}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* ANALYTICS */}
          <Section id="analytics" icon={BarChart3} title="Analytics">
            <p>
              Every scan through a dynamic QR code is captured before the visitor is redirected — in under 100ms.
              Data collected includes:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-white/8 border border-white/8 mt-4">
              {["Timestamp", "Country", "City", "Device type", "OS", "Browser", "Referrer", "IP (hashed)", "Scan count"].map((d) => (
                <div key={d} className="bg-[#0a0a0a] px-4 py-3 text-xs text-white/60 flex items-center gap-2">
                  <span className="size-1 bg-[#FF3B30]" />{d}
                </div>
              ))}
            </div>
            <p className="mt-4">
              Access analytics per-QR from the QR detail page, or globally from the Analytics section.
              The dashboard shows total scans, active codes, and top-performing QRs.
            </p>
          </Section>

          {/* API REFERENCE */}
          <Section id="api" icon={Terminal} title="API Reference">
            <p>
              The full REST API is available at{" "}
              <code className="font-mono text-[#FF3B30] text-xs bg-black/40 px-1 py-0.5">/api/*</code>.
              All endpoints (except{" "}
              <code className="font-mono text-[#FF3B30] text-xs bg-black/40 px-1 py-0.5">/api/auth/*</code> and{" "}
              <code className="font-mono text-[#FF3B30] text-xs bg-black/40 px-1 py-0.5">/r/:shortCode</code>) require a
              Bearer token from the login response.
            </p>

            <div className="space-y-4 mt-4">
              {[
                {
                  group: "Authentication",
                  color: "green",
                  endpoints: [
                    { method: "POST", path: "/api/auth/login", desc: "Login and receive access + refresh tokens" },
                    { method: "POST", path: "/api/auth/refresh", desc: "Refresh access token" },
                    { method: "POST", path: "/api/auth/logout", desc: "Invalidate current session" },
                  ],
                },
                {
                  group: "Dashboard",
                  color: "blue",
                  endpoints: [
                    { method: "GET", path: "/api/dashboard/stats", desc: "Total QR codes, scans, companies, managers" },
                  ],
                },
                {
                  group: "QR Codes",
                  color: "red",
                  endpoints: [
                    { method: "GET", path: "/api/qr", desc: "List QR codes (paginated)" },
                    { method: "POST", path: "/api/qr", desc: "Create a QR code (super admin only)" },
                    { method: "GET", path: "/api/qr/:id", desc: "Get QR code details" },
                    { method: "PUT", path: "/api/qr/:id", desc: "Update QR code" },
                    { method: "DELETE", path: "/api/qr/:id", desc: "Delete QR code" },
                    { method: "GET", path: "/r/:shortCode", desc: "Public redirect (no auth required)" },
                  ],
                },
                {
                  group: "Analytics",
                  color: "yellow",
                  endpoints: [
                    { method: "GET", path: "/api/analytics/overview", desc: "Scan analytics for a QR code (?qr_id=...)" },
                    { method: "GET", path: "/api/analytics/global", desc: "Global analytics overview" },
                  ],
                },
              ].map((group) => (
                <div key={group.group}>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag color={group.color}>{group.group}</Tag>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/8 divide-y divide-white/8">
                    {group.endpoints.map((ep) => (
                      <div key={ep.path} className="flex items-center gap-4 px-4 py-3">
                        <span className={`font-mono text-[10px] w-12 flex-shrink-0 font-bold ${
                          ep.method === "POST" ? "text-green-400" :
                          ep.method === "PUT" ? "text-yellow-400" :
                          ep.method === "DELETE" ? "text-red-400" : "text-blue-400"
                        }`}>{ep.method}</span>
                        <code className="font-mono text-xs text-white/80 flex-1">{ep.path}</code>
                        <span className="text-xs text-white/40 hidden sm:block">{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-[#0a0a0a] border border-white/8 p-4">
              <div className="text-xs text-white/40 mb-3 uppercase tracking-wider">Example: Login</div>
              <pre className="font-mono text-xs text-white/70 whitespace-pre-wrap overflow-x-auto">{`curl -X POST http://localhost:8000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@dynaqr.com", "password": "Admin@123"}'

# Response
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}`}</pre>
            </div>

            <p className="mt-4">
              Visit{" "}
              <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="text-[#FF3B30] hover:underline font-mono text-sm">
                localhost:8000/docs
              </a>{" "}
              for the interactive Swagger UI where you can test every endpoint directly.
            </p>
          </Section>

          {/* SECURITY */}
          <Section id="security" icon={Shield} title="Security">
            <p>QR Nexus is built with a security-first mindset:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {[
                { title: "bcrypt password hashing", desc: "All passwords are salted and hashed using bcrypt." },
                { title: "JWT authentication", desc: "Short-lived access tokens (60 min) with secure refresh tokens." },
                { title: "Role-based access control", desc: "Super Admin and Manager roles with strict route guards." },
                { title: "CORS protection", desc: "Configurable allowed origins via environment variable." },
                { title: "Audit trail", desc: "Every QR change is logged with user and timestamp." },
                { title: "Scan password protection", desc: "QR codes can require a PIN before redirecting visitors." },
              ].map((item) => (
                <div key={item.title} className="border border-white/8 bg-[#0a0a0a] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="size-1.5 bg-[#FF3B30]" />
                    <div className="text-sm font-medium text-white">{item.title}</div>
                  </div>
                  <div className="text-xs text-white/50 pl-3.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* BUILT BY */}
          <div className="pt-12 border-t border-white/8">
            <div className="bg-gradient-to-r from-[#FF3B30]/10 to-transparent border border-[#FF3B30]/20 p-8">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-4">Built by a Professional</div>
              <div className="flex items-start gap-5">
                <div className="size-14 bg-gradient-to-br from-[#FF3B30] to-[#FF6B30] grid place-items-center font-display font-bold text-2xl flex-shrink-0">
                  KS
                </div>
                <div className="flex-1">
                  <div className="font-display text-xl font-bold">Koushik Sarkar</div>
                  <div className="text-[#FF3B30] text-xs uppercase tracking-wider mt-0.5 mb-3">Professional Software Developer · Kolkata, India</div>
                  <p className="text-white/55 text-sm leading-relaxed mb-4">
                    This platform was designed and engineered by Koushik Sarkar. Looking for a custom SaaS product,
                    a tailored QR system, or any bespoke enterprise software? I build complete, production-ready
                    solutions from scratch — exactly to your specification.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="https://www.linkedin.com/in/koushik-sarkar-2849882b9/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/20 px-4 py-2 transition-colors"
                    >
                      <Linkedin className="size-4" /> LinkedIn Profile
                    </a>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-2 text-sm bg-[#FF3B30] hover:bg-[#D63026] text-white px-4 py-2 transition-colors"
                    >
                      <Code2 className="size-4" /> Start a Project <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
