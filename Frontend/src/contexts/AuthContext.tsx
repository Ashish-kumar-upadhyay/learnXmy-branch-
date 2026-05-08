import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, API_BASE, clearTokens, getAccessToken, getRefreshToken, setTokens, clearApiCache } from "@/lib/backendApi";

type AppRole = "student" | "teacher" | "admin";

type FrontendUser = { id: string; email: string };
type ProfilePayload = {
  id?: string;
  email?: string;
  full_name: string | null;
  avatar_url: string | null;
  batch: string | null;
  class_name: string | null;
  is_approved?: boolean;
  student_id?: string | null;
  teacher_code?: string | null;
  roles?: AppRole[];
};
type RefreshTokenPayload = { accessToken?: string; refreshToken?: string };

function normalizeAvatarUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl;
  if (avatarUrl.startsWith('/api/files/')) return `${API_BASE}${avatarUrl}`;
  return `${API_BASE}/api/files/${avatarUrl}`;
}

interface AuthContextType {
  user: FrontendUser | null;
  profile: {
    id?: string;
    email?: string;
    full_name: string | null;
    avatar_url: string | null;
    batch: string | null;
    class_name: string | null;
    is_approved?: boolean;
    student_id?: string | null;
    teacher_code?: string | null;
  } | null;
  roles: AppRole[];
  loading: boolean;
  signOutLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** After magic-link login: store tokens, load profile, navigate by role. */
  completeSessionFromTokens: (accessToken: string, refreshToken: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOutLoading: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  completeSessionFromTokens: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  async function loadProfileWithAccessToken(accessToken: string) {
    const profileRes = await api<ProfilePayload>("/api/auth/profile", { 
      method: "GET", 
      accessToken, 
      useCache: true, 
      cacheTTL: 30 * 1000 // Reduced from 5 minutes to 30 seconds
    });
    if (profileRes.status !== 200 || !profileRes.data) return false;

    const p = profileRes.data;
    p.avatar_url = normalizeAvatarUrl(p.avatar_url);
    const nextRoles = (p.roles || []) as AppRole[];
    setProfile(p);
    setRoles(nextRoles);
    setUser({ id: String(p.id ?? ""), email: String(p.email ?? "") });

    if (!hasRedirected.current && nextRoles.length > 0) {
      hasRedirected.current = true;
      // Check if user is already on a valid page for their role
      const currentPath = location.pathname;
      const isValidForRole = 
        (nextRoles.includes("admin") && currentPath.startsWith("/admin")) ||
        (nextRoles.includes("teacher") && currentPath.startsWith("/teacher")) ||
        (!nextRoles.includes("admin") && !nextRoles.includes("teacher") && (currentPath === "/" || currentPath.startsWith("/")));
      
      // Only redirect if not already on a valid page for their role
      if (!isValidForRole) {
        if (nextRoles.includes("admin")) navigate("/admin");
        else if (nextRoles.includes("teacher")) navigate("/teacher");
        else navigate("/");
      }
    }
    return true;
  }

  async function bootstrap() {
    const magic =
      location.pathname === "/auth/welcome" && new URLSearchParams(location.search).has("token");
    if (magic) {
      setLoading(false);
      return;
    }

    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Try loading profile with existing token first
      const ok = await loadProfileWithAccessToken(accessToken);
      if (ok) return;

      // Only attempt refresh if profile loading fails
      if (refreshToken) {
        const refreshRes = await api<RefreshTokenPayload>("/api/auth/refresh-token", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshRes.status === 200 && refreshRes.data?.accessToken && refreshRes.data?.refreshToken) {
          setTokens({ accessToken: refreshRes.data.accessToken, refreshToken: refreshRes.data.refreshToken });
          const access2 = refreshRes.data.accessToken as string;
          await loadProfileWithAccessToken(access2);
        } else {
          clearTokens();
          setUser(null);
          setProfile(null);
          setRoles([]);
        }
      } else {
        clearTokens();
        setUser(null);
        setProfile(null);
        setRoles([]);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    setSignOutLoading(true);
    try {
      const accessToken = getAccessToken();
      if (accessToken) {
        await api("/api/auth/logout", { method: "POST", accessToken }).catch(() => undefined);
      }
    } finally {
      clearTokens();
      clearApiCache(); // Clear cache on sign out
      setUser(null);
      setProfile(null);
      setRoles([]);
      setHasRedirectedFalse();
      setSignOutLoading(false);
      navigate("/auth");
    }
  };

  const setHasRedirectedFalse = () => {
    hasRedirected.current = false;
  };

  const refreshProfile = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    const ok = await loadProfileWithAccessToken(accessToken);
    if (!ok) {
      clearTokens();
      setUser(null);
      setProfile(null);
      setRoles([]);
      hasRedirected.current = false;
    }
  };

  const completeSessionFromTokens = async (accessToken: string, refreshToken: string) => {
    setTokens({ accessToken, refreshToken });
    hasRedirected.current = false;
    setLoading(true);
    try {
      return await loadProfileWithAccessToken(accessToken);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roles,
        loading,
        signOutLoading,
        signOut,
        refreshProfile,
        completeSessionFromTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
