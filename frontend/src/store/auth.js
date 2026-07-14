import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuth = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      theme: "dark",
      setSession: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setTheme: (t) => set({ theme: t }),
    }),
    { name: "qrnexus-auth" }
  )
);
