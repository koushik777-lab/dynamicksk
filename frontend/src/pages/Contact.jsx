import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Phone, Linkedin, Instagram, ArrowRight, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
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
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/docs" className="hover:text-white">Docs</Link>
            <Link to="/contact" className="text-white font-medium">Contact</Link>
          </nav>
          <Button asChild className="bg-[#FF3B30] hover:bg-[#D63026] text-white rounded-none">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-24">
        <Link to="/" className="text-white/60 hover:text-white text-sm">← Back home</Link>

        {/* HERO */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-3">Get In Touch</div>
            <h1 className="font-display text-6xl md:text-7xl font-bold leading-[0.9] tracking-[-0.03em]">
              Let's build<br /><span className="text-[#FF3B30]">something</span><br />great.
            </h1>
            <p className="text-white/60 text-lg mt-6 max-w-lg leading-relaxed">
              Looking for a custom SaaS, a dynamic QR system, or any tailored software solution?
              I build premium, production-ready software — reach out and let's talk.
            </p>

            {/* CONTACT CARDS */}
            <div className="mt-12 space-y-px border border-white/12">
              {/* Phone */}
              <a
                href="tel:+919564392070"
                className="flex items-center gap-5 bg-[#0a0a0a] hover:bg-[#111] transition-colors p-5 border-b border-white/12 group"
              >
                <div className="size-11 bg-[#FF3B30]/10 border border-[#FF3B30]/30 grid place-items-center flex-shrink-0">
                  <Phone className="size-5 text-[#FF3B30]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Business Phone</div>
                  <div className="font-display text-xl font-semibold group-hover:text-[#FF3B30] transition-colors">+91 9564392070</div>
                </div>
                <ArrowRight className="size-4 text-white/30 ml-auto group-hover:text-[#FF3B30] transition-colors" />
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/koushik-sarkar-2849882b9/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-5 bg-[#0a0a0a] hover:bg-[#111] transition-colors p-5 border-b border-white/12 group"
              >
                <div className="size-11 bg-[#0A66C2]/10 border border-[#0A66C2]/30 grid place-items-center flex-shrink-0">
                  <Linkedin className="size-5 text-[#0A66C2]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">LinkedIn</div>
                  <div className="font-display text-xl font-semibold group-hover:text-[#0A66C2] transition-colors">Koushik Sarkar</div>
                  <div className="text-xs text-white/40 mt-0.5">linkedin.com/in/koushik-sarkar-2849882b9</div>
                </div>
                <ArrowRight className="size-4 text-white/30 ml-auto group-hover:text-[#0A66C2] transition-colors" />
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/its_koushik777/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-5 bg-[#0a0a0a] hover:bg-[#111] transition-colors p-5 border-b border-white/12 group"
              >
                <div className="size-11 bg-[#E1306C]/10 border border-[#E1306C]/30 grid place-items-center flex-shrink-0">
                  <Instagram className="size-5 text-[#E1306C]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Instagram</div>
                  <div className="font-display text-xl font-semibold group-hover:text-[#E1306C] transition-colors">@its_koushik777</div>
                  <div className="text-xs text-white/40 mt-0.5">instagram.com/its_koushik777</div>
                </div>
                <ArrowRight className="size-4 text-white/30 ml-auto group-hover:text-[#E1306C] transition-colors" />
              </a>

              {/* Location */}
              <div className="flex items-center gap-5 bg-[#0a0a0a] p-5">
                <div className="size-11 bg-white/5 border border-white/12 grid place-items-center flex-shrink-0">
                  <MapPin className="size-5 text-white/60" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-1">Location</div>
                  <div className="font-display text-xl font-semibold">Kolkata, West Bengal</div>
                  <div className="text-xs text-white/40 mt-0.5">India</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: DEVELOPER PROMO */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-6">
            {/* Dev card */}
            <div className="border border-white/12 bg-[#0a0a0a] p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-14 bg-gradient-to-br from-[#FF3B30] to-[#FF6B30] grid place-items-center font-display font-bold text-2xl rounded-none flex-shrink-0">
                  KS
                </div>
                <div>
                  <div className="font-display text-xl font-bold">Koushik Sarkar</div>
                  <div className="text-[#FF3B30] text-xs uppercase tracking-[0.2em] mt-0.5">Professional Software Developer</div>
                </div>
              </div>
              <p className="text-white/60 leading-relaxed text-sm mb-6">
                Specializing in building <span className="text-white font-medium">custom SaaS products</span>, enterprise-grade web applications,
                and dynamic software solutions tailored to your exact business requirements.
                From idea to production — I handle it all.
              </p>
              <a
                href="https://www.linkedin.com/in/koushik-sarkar-2849882b9/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#0A66C2] hover:text-[#0A66C2]/80 font-medium"
              >
                <Linkedin className="size-4" /> View LinkedIn Profile <ArrowRight className="size-3" />
              </a>
            </div>

            {/* Services */}
            <div className="border border-white/12 bg-[#0a0a0a] p-8">
              <div className="flex items-center gap-2 mb-5">
                <Code2 className="size-5 text-[#FF3B30]" strokeWidth={1.5} />
                <div className="text-xs uppercase tracking-[0.2em] text-white/60 font-medium">What I Build</div>
              </div>
              <div className="space-y-3">
                {[
                  { title: "Custom SaaS Platforms", desc: "Full-stack web apps built to your spec — QR systems, CRMs, dashboards, and more." },
                  { title: "Dynamic QR Systems", desc: "Enterprise-grade QR infrastructure like this one — multi-tenant, analytics-ready." },
                  { title: "Business Automation Tools", desc: "Streamline your operations with smart, tailored software solutions." },
                  { title: "API & Backend Development", desc: "Scalable REST APIs, databases, and cloud-ready server infrastructure." },
                ].map((s) => (
                  <div key={s.title} className="flex items-start gap-3 p-3 border border-white/8 hover:border-white/20 transition-colors">
                    <span className="size-1.5 bg-[#FF3B30] mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">{s.title}</div>
                      <div className="text-xs text-white/50 mt-0.5">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="border border-[#FF3B30]/30 bg-[#FF3B30]/5 p-6 flex items-center gap-4">
              <Sparkles className="size-6 text-[#FF3B30] flex-shrink-0" strokeWidth={1.5} />
              <div>
                <div className="font-medium text-sm">Ready to start your project?</div>
                <div className="text-xs text-white/50 mt-0.5">Call or message — I respond fast.</div>
              </div>
              <a
                href="tel:+919564392070"
                className="ml-auto flex-shrink-0 bg-[#FF3B30] hover:bg-[#D63026] text-white text-sm font-medium px-4 py-2 transition-colors"
              >
                Call Now
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div>© {new Date().getFullYear()} QR Nexus. Built by <span className="text-white/60">Koushik Sarkar</span>.</div>
          <div className="flex items-center gap-4">
            <Link to="/pricing" className="hover:text-white/60">Pricing</Link>
            <Link to="/docs" className="hover:text-white/60">Docs</Link>
            <Link to="/login" className="hover:text-white/60">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
