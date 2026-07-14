import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Building2, Users, QrCode, BarChart3, FolderKanban,
  Activity, Settings as SettingsIcon, User as UserIcon, LogOut, Sun, Moon,
  Menu, X, Plus, Search, Zap,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlobalSearch from "@/components/GlobalSearch";

const NAV_ADMIN = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/managers", label: "Managers", icon: Users },
  { to: "/qr", label: "QR Codes", icon: QrCode },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/folders", label: "Folders", icon: FolderKanban },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const NAV_MGR = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/qr", label: "My QR Codes", icon: QrCode },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/folders", label: "Folders", icon: FolderKanban },
  { to: "/activity", label: "Activity", icon: Activity },
];

export default function AppLayout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const theme = useAuth((s) => s.theme);
  const toggleTheme = useAuth((s) => s.toggleTheme);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const nav = user?.role === "super_admin" ? NAV_ADMIN : NAV_MGR;

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); } catch (_) {}
    logout();
    toast.success("Signed out");
    navigate("/login");
  };

  const Sidebar = (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 border-r border-border bg-card flex flex-col">
      <div className="px-6 py-6 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2.5" data-testid="brand-logo">
          <div className="size-8 bg-primary text-primary-foreground grid place-items-center font-display font-bold text-lg">Q</div>
          <div className="font-display font-bold text-xl leading-none">
            QR<span className="text-primary">.</span>NEXUS
          </div>
        </Link>
        <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground pl-10">
          {user?.role === "super_admin" ? "Owner Console" : "Manager Console"}
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={() => setSearchOpen(true)}
          data-testid="global-search-trigger"
          className="w-full flex items-center gap-3 px-3 py-2 border border-border text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          <Search className="size-4" /> Search...
          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 border border-border">⌘K</span>
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto no-scrollbar">
        {nav.map((n) => {
          const active = location.pathname === n.to || (n.to !== "/dashboard" && location.pathname.startsWith(n.to));
          const Icon = n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                active ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent border-l-2 border-transparent"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.5} />
              <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>

      {user?.role === "super_admin" && (
        <div className="p-3">
          <Button
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-none h-10 font-medium"
            data-testid="create-qr-cta"
          >
            <Link to="/qr/new"><Plus className="size-4 mr-1.5" /> Create QR Code</Link>
          </Button>
        </div>
      )}

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-8 bg-primary/10 text-primary grid place-items-center font-medium border border-primary/20">
            {(user?.name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 mt-2">
          <button
            onClick={toggleTheme}
            data-testid="theme-toggle"
            className="border border-border p-2 grid place-items-center hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link
            to="/profile"
            className="border border-border p-2 grid place-items-center hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors"
            title="Profile"
            data-testid="nav-profile"
          >
            <UserIcon className="size-4" />
          </Link>
          <button
            onClick={handleLogout}
            data-testid="logout-btn"
            className="border border-border p-2 grid place-items-center hover:border-primary hover:text-primary text-muted-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "tween", duration: 0.2 }} className="fixed inset-y-0 left-0 z-50 lg:hidden">
              {Sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 min-w-0">
        <header className="glass sticky top-0 z-30 border-b border-border bg-background/60 flex items-center h-14 px-4 lg:px-8 gap-3">
          <button className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} data-testid="mobile-menu">
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <div className="font-display font-semibold text-lg tracking-tight">{pageTitle(location.pathname)}</div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground border border-border px-2.5 py-1">
              <Zap className="size-3 text-primary" /> {user?.role === "super_admin" ? "Owner" : "Manager"}
            </span>
          </div>
        </header>
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      <GlobalSearch open={searchOpen} setOpen={setSearchOpen} />
    </div>
  );
}

function pageTitle(path) {
  if (path === "/dashboard") return "Overview";
  if (path.startsWith("/companies")) return "Companies";
  if (path.startsWith("/managers")) return "Managers";
  if (path === "/qr") return "QR Codes";
  if (path === "/qr/new") return "New QR Code";
  if (path.startsWith("/qr/")) return "QR Details";
  if (path.startsWith("/analytics")) return "Analytics";
  if (path.startsWith("/folders")) return "Folders";
  if (path.startsWith("/activity")) return "Activity";
  if (path.startsWith("/settings")) return "Settings";
  if (path.startsWith("/profile")) return "Profile";
  return "QR Nexus";
}
