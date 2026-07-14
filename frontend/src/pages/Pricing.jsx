import React from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Growth",
    price: "₹15,000",
    cadence: "one-time · lifetime access",
    badge: "Best Value",
    accent: true,
    features: [
      "Unlimited QR codes",
      "30+ QR content types",
      "Realtime scan analytics",
      "Custom branding & design",
      "Multi-company management",
      "Manager role delegation",
      "Folders & organisation",
      "Password & expiry controls",
      "Version history & rollback",
      "Full API access",
      "Lifetime updates included",
    ],
  },
  {
    name: "Custom",
    price: "Let's talk",
    cadence: "tailored to your business",
    badge: null,
    accent: false,
    features: [
      "Everything in Growth",
      "White-label & custom domain",
      "SSO / enterprise auth",
      "SLA & priority support",
      "Custom feature development",
      "Dedicated onboarding",
      "Bespoke integrations",
      "Direct developer access",
    ],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#050505] text-white grain">
      {/* NAV */}
      <header className="fixed top-0 inset-x-0 z-40 glass bg-black/60 border-b border-white/12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-lg">
            <div className="size-8 bg-[#FF3B30] grid place-items-center font-bold text-lg">Q</div>
            QR<span className="text-[#FF3B30]">.</span>NEXUS
          </Link>
          <nav className="hidden md:flex items-center gap-8 mx-auto text-sm text-white/70">
            <Link to="/pricing" className="text-white font-medium">Pricing</Link>
            <Link to="/docs" className="hover:text-white">Docs</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </nav>
          <Button asChild className="bg-[#FF3B30] hover:bg-[#D63026] text-white rounded-none">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24">
        <Link to="/" className="text-white/60 hover:text-white text-sm">← Back home</Link>

        <div className="mt-8 max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-3">Pricing</div>
          <h1 className="font-display text-6xl md:text-8xl font-bold leading-[0.9] tracking-[-0.03em]">
            Simple.<br /><span className="text-[#FF3B30]">Lifetime.</span>
          </h1>
          <p className="text-white/60 text-lg mt-6">
            Pay once. Own it forever. No subscriptions, no hidden fees, no surprises.
            Every plan includes the full QR type catalog.
          </p>
        </div>

        {/* PLANS */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-px bg-white/12 border border-white/12 max-w-4xl">
          {PLANS.map((p) => (
            <div key={p.name} className={`bg-[#050505] p-8 relative ${p.accent ? "bg-[#0a0808]" : ""}`}>
              {p.badge && (
                <div className="absolute top-0 left-0 bg-[#FF3B30] px-3 py-1 text-[10px] uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Sparkles className="size-3" /> {p.badge}
                </div>
              )}
              <div className={`text-xs uppercase tracking-[0.2em] text-white/60 mb-4 ${p.badge ? "mt-7" : ""}`}>{p.name}</div>
              <div className="font-display text-5xl font-bold tracking-tight">{p.price}</div>
              <div className="text-sm text-white/50 mt-1 font-mono">{p.cadence}</div>

              <ul className="mt-8 space-y-3 text-sm text-white/80">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check className="size-4 text-[#FF3B30] flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`mt-10 w-full h-12 rounded-none ${
                  p.accent
                    ? "bg-[#FF3B30] hover:bg-[#D63026] text-white"
                    : "bg-white/8 hover:bg-white/12 border border-white/12 text-white"
                }`}
              >
                <Link to="/contact">
                  {p.accent ? (
                    <><Zap className="size-4 mr-2" /> Get Started Now</>
                  ) : (
                    <>Contact Us <ArrowRight className="ml-2 size-4" /></>
                  )}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* BUILT BY */}
        <div className="mt-16 max-w-4xl border border-white/12 bg-[#0a0a0a] p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="size-14 bg-gradient-to-br from-[#FF3B30] to-[#FF6B30] grid place-items-center font-display font-bold text-2xl flex-shrink-0">
            KS
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-1">Built by a Professional</div>
            <div className="font-display text-xl font-bold">Koushik Sarkar — Software Developer</div>
            <p className="text-white/50 text-sm mt-2 max-w-lg">
              Need a custom SaaS, a bespoke QR platform, or tailored enterprise software?
              I build production-ready solutions from scratch — exactly to your requirements.
            </p>
          </div>
          <Button asChild className="bg-white text-black hover:bg-white/90 rounded-none h-11 px-5 flex-shrink-0">
            <Link to="/contact">Get a Custom Build <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-4xl">
          <div className="text-[10px] uppercase tracking-[0.28em] text-white/40 mb-8">Common Questions</div>
          <div className="space-y-px border border-white/12">
            {[
              { q: "Is it really a one-time payment?", a: "Yes. Pay once for the Growth plan and you own it forever — including all future updates and improvements." },
              { q: "What does 'lifetime access' mean?", a: "You pay once and the software is yours. No monthly fees, no renewal, no lock-in." },
              { q: "Can I get a custom version for my business?", a: "Absolutely. The Custom plan is built specifically for your requirements. Contact Koushik to discuss your project." },
              { q: "Is this white-labelled?", a: "Custom plan includes full white-labelling — your brand, your domain, your product." },
            ].map((item) => (
              <div key={item.q} className="bg-[#0a0a0a] p-6 border-b border-white/12 last:border-0">
                <div className="font-medium text-sm mb-2">{item.q}</div>
                <div className="text-white/50 text-sm">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div>© {new Date().getFullYear()} QR Nexus. Built by <span className="text-white/60">Koushik Sarkar</span>.</div>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hover:text-white/60">Pricing</Link>
            <Link to="/docs" className="hover:text-white/60">Docs</Link>
            <Link to="/contact" className="hover:text-white/60">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
