import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8">
      <div className="max-w-md">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF3B30] mb-4">Error 404</div>
        <h1 className="font-display text-8xl font-bold leading-none tracking-tight mb-6">Off-grid.</h1>
        <p className="text-white/60 mb-8">The page you were trying to reach doesn't exist or has been moved.</p>
        <Link to="/" className="inline-flex items-center gap-2 border border-white/20 hover:border-[#FF3B30] hover:text-[#FF3B30] px-6 py-3">
          <ArrowLeft className="size-4" /> Back to home
        </Link>
      </div>
    </div>
  );
}
