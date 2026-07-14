import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, QrCode, BarChart3, Shield, Zap, Building2, LineChart, Radio, Code2, Linkedin, Instagram, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const heroImg = "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1pbmltYWwlMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzg0MDYxMjgwfDA&ixlib=rb-4.1.0&q=85";
const phoneImg = "https://images.unsplash.com/photo-1629494893504-d41e26a02631?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzbWFydHBob25lJTIwbW9ja3VwfGVufDB8fHx8MTc4NDA2MTI4MHww&ixlib=rb-4.1.0&q=85";
const teamImg = "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwyfHxjb3Jwb3JhdGUlMjB0ZWFtJTIwbWVldGluZ3xlbnwwfHx8fDE3ODQwMTQxMzR8MA&ixlib=rb-4.1.0&q=85";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white grain">
      <Nav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/60 border border-white/12 px-3 py-1.5 mb-8">
                <span className="size-1.5 bg-[#FF3B30]" /> Enterprise QR Infrastructure
              </div>
              <h1 className="font-display font-bold text-[clamp(3rem,9vw,7.5rem)] leading-[0.9] tracking-[-0.03em]">
                Dynamic QR.<br />
                <span className="text-[#FF3B30]">Owned</span> by you.
              </h1>
              <p className="mt-6 max-w-xl text-xl text-white/70 leading-relaxed">
                Stop renting your QR codes. Own your infrastructure. Create, track, and control
                every scan — with real-time analytics, multi-company management, and
                30+ QR types — all from your private console.
              </p>
              <div className="mt-4 text-sm text-white/40 font-mono">
                No subscription. No data sharing. No lock-in. <span className="text-[#FF3B30]">Yours forever.</span>
              </div>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild className="bg-[#FF3B30] hover:bg-[#D63026] text-white rounded-none h-12 px-6 font-medium" data-testid="cta-login">
                  <Link to="/login">Access Console <ArrowRight className="ml-2 size-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent hover:bg-white/5 text-white rounded-none h-12 px-6" data-testid="cta-docs">
                  <Link to="/docs">Read the docs</Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent hover:bg-white/5 text-white rounded-none h-12 px-6">
                  <Link to="/pricing">View pricing</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-px bg-white/12 border border-white/12">
              <Stat k="99.99%" v="Redirect uptime" />
              <Stat k="<80ms" v="Median TTFB" />
              <Stat k="30+" v="QR content types" />
              <Stat k="Realtime" v="Scan analytics" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 border-t border-white/12">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-10 text-center">Why QR Nexus</div>
        <div className="grid grid-cols-12 gap-px bg-white/12 border border-white/12">
          <FeatureCard className="col-span-12 md:col-span-8 md:row-span-2 min-h-[420px]" icon={QrCode} title="Unified QR fabric" body="Every code you issue routes through your infrastructure. Dynamic destinations. Version history. Instant kill-switch. All from a single owner console." accent />
          <FeatureCard className="col-span-6 md:col-span-4" icon={Building2} title="Multi-tenant by design" body="Provision companies. Assign managers. Delegate without giving up control." />
          <FeatureCard className="col-span-6 md:col-span-4" icon={BarChart3} title="Realtime analytics" body="Scans, geolocation, devices, browsers — surfaced live." />
          <FeatureCard className="col-span-6 md:col-span-4" icon={Shield} title="Zero-trust ACL" body="Role-based routes, bcrypt, rotating JWT, audit trail." />
          <FeatureCard className="col-span-6 md:col-span-4" icon={LineChart} title="Version history" body="Every URL change is diffed. Roll back in one click." />
          <FeatureCard className="col-span-12 md:col-span-4" icon={Radio} title="30+ QR types" body="URL, WiFi, vCard, PDF, Video, Menu, Multi-link, Crypto, and more." />
        </div>
      </section>

      {/* SPLIT: product mockup */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 border-t border-white/12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-4">Scan → Decide → Redirect</div>
            <h2 className="font-display text-5xl md:text-6xl leading-none tracking-[-0.02em] mb-6">
              Every scan is<br />a decision point.
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 max-w-lg">
              QR Nexus routes each scan through your rules — geo, device, time, scan
              limit, expiry, password — before deciding where the visitor lands. Analytics
              are recorded before redirect, in under 100ms.
            </p>
            <ul className="space-y-3 text-white/80">
              {["Password protection", "Geo & device restrictions", "Expiry & scan limits", "Scheduled redirects", "Version rollback"].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="size-1.5 bg-[#FF3B30]" /> <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 border border-white/12" />
            <img src={phoneImg} alt="Scan a QR code" className="w-full aspect-[4/5] object-cover relative" />
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 border-t border-white/12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <img src={teamImg} alt="Built for teams" className="w-full aspect-[16/11] object-cover grayscale" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-4">Built for operators</div>
            <h2 className="font-display text-5xl md:text-6xl leading-none tracking-[-0.02em] mb-6">
              One console. <br /> Zero surprises.
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 max-w-lg">
              You're the owner. Everyone else — companies, managers — operates inside a
              scope you define. No self-signup. No hidden analytics. No shared destinations.
            </p>
            <Button asChild className="bg-white text-black hover:bg-white/90 rounded-none h-12 px-6">
              <Link to="/login">Open the console <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* BUILT BY KOUSHIK — Developer Promo */}
      <section className="border-t border-white/12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-4">The Developer</div>
              <h2 className="font-display text-5xl md:text-6xl leading-none tracking-[-0.02em] mb-6">
                Custom software,<br /><span className="text-[#FF3B30]">built your way.</span>
              </h2>
              <p className="text-white/70 leading-relaxed max-w-lg">
                QR Nexus was designed and built by <strong className="text-white">Koushik Sarkar</strong>,
                a professional software developer based in Kolkata, India. Need a tailored SaaS product,
                an enterprise QR system like this one, or any custom software for your business?
              </p>
              <p className="text-white/70 leading-relaxed max-w-lg mt-4">
                From idea to production — full-stack development, clean architecture, and
                premium UI/UX. Let's build something great together.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://www.linkedin.com/in/koushik-sarkar-2849882b9/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/20 px-4 py-2.5 text-sm transition-colors"
                >
                  <Linkedin className="size-4" /> LinkedIn
                </a>
                <a
                  href="https://www.instagram.com/its_koushik777/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#E1306C]/10 border border-[#E1306C]/30 text-[#E1306C] hover:bg-[#E1306C]/20 px-4 py-2.5 text-sm transition-colors"
                >
                  <Instagram className="size-4" /> Instagram
                </a>
                <a
                  href="tel:+919564392070"
                  className="inline-flex items-center gap-2 bg-white/5 border border-white/12 text-white/70 hover:bg-white/10 px-4 py-2.5 text-sm transition-colors"
                >
                  <Phone className="size-4" /> +91 9564392070
                </a>
              </div>
              <div className="mt-6">
                <Button asChild className="bg-[#FF3B30] hover:bg-[#D63026] text-white rounded-none h-12 px-6">
                  <Link to="/contact">Discuss your project <ArrowRight className="ml-2 size-4" /></Link>
                </Button>
              </div>
            </div>

            {/* Services cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/12 border border-white/12">
              {[
                { icon: Code2, title: "Custom SaaS", body: "Full-stack web applications built precisely to your spec." },
                { icon: QrCode, title: "QR Systems", body: "Enterprise dynamic QR platforms with analytics, like this one." },
                { icon: Zap, title: "Automation Tools", body: "Smart business process automation and workflow software." },
                { icon: BarChart3, title: "Dashboards & APIs", body: "Scalable REST APIs, analytics dashboards, admin consoles." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-[#050505] p-6 hover:bg-[#0a0a0a] transition-colors group">
                  <Icon className="size-5 text-[#FF3B30] mb-4" strokeWidth={1.5} />
                  <div className="font-display font-semibold text-base mb-2">{title}</div>
                  <div className="text-white/50 text-xs leading-relaxed">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 glass bg-black/60 border-b border-white/12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center">
        <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-lg" data-testid="landing-logo">
          <div className="size-8 bg-[#FF3B30] grid place-items-center font-bold text-lg">Q</div>
          QR<span className="text-[#FF3B30]">.</span>NEXUS
        </Link>
        <nav className="hidden md:flex items-center gap-8 mx-auto text-sm text-white/70">
          <Link to="/pricing" className="hover:text-white">Pricing</Link>
          <Link to="/docs" className="hover:text-white">Docs</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
        </nav>
        <Button asChild className="bg-[#FF3B30] hover:bg-[#D63026] text-white rounded-none">
          <Link to="/login" data-testid="nav-login">Sign in</Link>
        </Button>
      </div>
    </header>
  );
}

function Stat({ k, v }) {
  return (
    <div className="bg-[#050505] p-6">
      <div className="font-display text-4xl font-bold tracking-tight text-white">{k}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-white/50 mt-2">{v}</div>
    </div>
  );
}

function FeatureCard({ className = "", icon: Icon, title, body, accent = false }) {
  return (
    <div className={`bg-[#050505] p-8 lg:p-10 group hover:bg-[#0a0a0a] transition-colors ${className}`}>
      <div className={`size-10 grid place-items-center mb-6 ${accent ? "bg-[#FF3B30]" : "bg-white/8 border border-white/12"}`}>
        <Icon className="size-5" strokeWidth={1.5} />
      </div>
      <h3 className="font-display font-semibold text-2xl leading-tight mb-3">{title}</h3>
      <p className="text-white/60 leading-relaxed text-sm">{body}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-white/60">
        <div>
          <div className="font-display font-bold text-white mb-2">QR.NEXUS</div>
          <p className="text-xs text-white/40 leading-relaxed">
            Private-label dynamic QR platform.<br />
            Built by Koushik Sarkar.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a href="https://www.linkedin.com/in/koushik-sarkar-2849882b9/" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#0A66C2] transition-colors">
              <Linkedin className="size-4" />
            </a>
            <a href="https://www.instagram.com/its_koushik777/" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#E1306C] transition-colors">
              <Instagram className="size-4" />
            </a>
            <a href="tel:+919564392070" className="text-white/40 hover:text-white transition-colors">
              <Phone className="size-4" />
            </a>
          </div>
        </div>
        <div>
          <div className="text-white mb-3 font-medium">Product</div>
          <ul className="space-y-2">
            <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link to="/docs" className="hover:text-white">Docs</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-white mb-3 font-medium">Developer</div>
          <ul className="space-y-2">
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li>
              <a href="https://www.linkedin.com/in/koushik-sarkar-2849882b9/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                LinkedIn
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/its_koushik777/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Instagram
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-white mb-3 font-medium">Console</div>
          <ul className="space-y-2">
            <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/12 py-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} QR Nexus · Built by{" "}
        <a
          href="https://www.linkedin.com/in/koushik-sarkar-2849882b9/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white transition-colors"
        >
          Koushik Sarkar
        </a>{" "}
        · Kolkata, India
      </div>
    </footer>
  );
}
