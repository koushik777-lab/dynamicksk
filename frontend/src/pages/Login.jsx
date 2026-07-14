import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const bgImg = "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1pbmltYWwlMjBhcmNoaXRlY3R1cmV8ZW58MHx8fHwxNzg0MDYxMjgwfDA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const setSession = useAuth((s) => s.setSession);
  const user = useAuth((s) => s.user);
  const setTheme = useAuth((s) => s.setTheme);
  const navigate = useNavigate();

  useEffect(() => { setTheme("dark"); }, [setTheme]);
  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password, remember });
      setSession(res.data.user, res.data.access_token, res.data.refresh_token);
      toast.success(`Welcome back, ${res.data.user.name.split(" ")[0]}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#050505] text-white">
      {/* Left visual */}
      <div className="hidden lg:block relative overflow-hidden border-r border-white/12 grain">
        <img src={bgImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#050505]/60 via-transparent to-[#050505]" />
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2.5 font-display font-bold text-lg z-10">
          <div className="size-8 bg-[#FF3B30] grid place-items-center font-bold text-lg">Q</div>
          QR<span className="text-[#FF3B30]">.</span>NEXUS
        </Link>
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-4">Owner Console</div>
          <h2 className="font-display text-5xl font-bold leading-[0.9] tracking-[-0.02em] mb-4">
            Every QR<br />is a decision.
          </h2>
          <p className="text-white/60 max-w-md text-sm leading-relaxed">
            Sign in to the private-label dynamic QR platform. Owners and delegated managers only.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-8 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8" data-testid="back-to-home">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
          <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-3">Access</div>
          <h1 className="font-display text-5xl font-bold leading-none tracking-[-0.02em] mb-3">Sign in</h1>
          <p className="text-white/50 mb-10">Authenticate to continue to the console.</p>

          <form onSubmit={submit} className="space-y-5" data-testid="login-form">
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-[0.16em] text-white/60">Email</Label>
              <Input id="email" data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="mt-2 h-12 rounded-none bg-transparent border-white/20 focus-visible:border-[#FF3B30] focus-visible:ring-0" placeholder="you@company.com" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-[0.16em] text-white/60">Password</Label>
              <div className="relative mt-2">
                <Input id="password" data-testid="login-password" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="h-12 rounded-none bg-transparent border-white/20 focus-visible:border-[#FF3B30] focus-visible:ring-0 pr-12" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass((v) => !v)} data-testid="toggle-password" className="absolute inset-y-0 right-3 my-auto text-white/50 hover:text-white">
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-white/70">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} data-testid="remember-me" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-white/70 hover:text-[#FF3B30]" data-testid="forgot-password-link">Forgot password?</Link>
            </div>
            <Button type="submit" disabled={loading} data-testid="login-submit" className="w-full h-12 bg-[#FF3B30] hover:bg-[#D63026] text-white rounded-none font-medium">
              {loading ? <Loader2 className="size-4 animate-spin" /> : (<>Sign in <ArrowRight className="ml-2 size-4" /></>)}
            </Button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/10 text-xs text-white/40 font-mono">
            SUPER_ADMIN · MANAGER · <span className="text-white/60">JWT / bcrypt / refresh</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
