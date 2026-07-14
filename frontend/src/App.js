import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/store/auth";
import Landing from "@/pages/Landing";
import Pricing from "@/pages/Pricing";
import Docs from "@/pages/Docs";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/app/Dashboard";
import Companies from "@/pages/app/Companies";
import Managers from "@/pages/app/Managers";
import QRList from "@/pages/app/QRList";
import QRCreate from "@/pages/app/QRCreate";
import QRDetails from "@/pages/app/QRDetails";
import Analytics from "@/pages/app/Analytics";
import ActivityLogs from "@/pages/app/ActivityLogs";
import Settings from "@/pages/app/Settings";
import Profile from "@/pages/app/Profile";
import Folders from "@/pages/app/Folders";
import NotFound from "@/pages/NotFound";
import "@/App.css";

function ThemeApplier() {
  const theme = useAuth((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <div className="App min-h-screen">
      <ThemeApplier />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authenticated */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/companies" element={<ProtectedRoute role="super_admin"><Companies /></ProtectedRoute>} />
            <Route path="/managers" element={<ProtectedRoute role="super_admin"><Managers /></ProtectedRoute>} />
            <Route path="/qr" element={<QRList />} />
            <Route path="/qr/new" element={<ProtectedRoute role="super_admin"><QRCreate /></ProtectedRoute>} />
            <Route path="/qr/:id" element={<QRDetails />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/folders" element={<Folders />} />
            <Route path="/activity" element={<ActivityLogs />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "4px",
          },
        }}
      />
    </div>
  );
}
