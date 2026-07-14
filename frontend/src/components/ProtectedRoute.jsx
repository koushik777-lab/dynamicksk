import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/store/auth";

export default function ProtectedRoute({ children, role }) {
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  if (!user || !token) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children || <Outlet />;
}
