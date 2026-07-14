import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const submit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Missing token");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      toast.success("Password reset successful. Please sign in.");
      navigate("/login");
    } catch (err) { toast.error(formatError(err)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-8"><ArrowLeft className="size-4" /> Back to sign in</Link>
        <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-3">Recovery</div>
        <h1 className="font-display text-5xl font-bold tracking-tight mb-3">New password</h1>
        <p className="text-white/50 mb-8">Set a strong new password to regain access.</p>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label className="text-xs uppercase tracking-[0.16em] text-white/60">New password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" minLength={6} data-testid="reset-password" className="mt-2 h-12 rounded-none bg-transparent border-white/20 focus-visible:border-[#FF3B30] focus-visible:ring-0" placeholder="At least 6 characters" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#FF3B30] hover:bg-[#D63026] rounded-none">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Reset password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
