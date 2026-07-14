import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("If the account exists, a reset link has been sent");
    } catch (err) { toast.error(formatError(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8"><ArrowLeft className="size-4" /> Back to sign in</Link>
        <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-3">Recovery</div>
        <h1 className="font-display text-5xl font-bold tracking-tight mb-3">Reset password</h1>
        <p className="text-white/50 mb-8">Enter your email and we'll send you a link to set a new password.</p>
        {sent ? (
          <div className="border border-white/12 p-6">
            <div className="font-medium mb-2">Check your inbox</div>
            <p className="text-white/60 text-sm">If an account exists for {email}, you'll receive a reset email shortly. (Dev mode: check backend logs for the link.)</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5" data-testid="forgot-form">
            <div>
              <Label className="text-xs uppercase tracking-[0.16em] text-white/60">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" data-testid="forgot-email" className="mt-2 h-12 rounded-none bg-transparent border-white/20 focus-visible:border-[#FF3B30] focus-visible:ring-0" placeholder="you@company.com" />
            </div>
            <Button type="submit" disabled={loading} data-testid="forgot-submit" className="w-full h-12 bg-[#FF3B30] hover:bg-[#D63026] rounded-none">
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
