import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE } from "@/lib/backendApi";
import { useAuth } from "@/contexts/AuthContext";

export default function WelcomeMagicLogin() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { completeSessionFromTokens } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "err">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("Invalid link — no token.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/welcome-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !json?.success || !json?.data?.accessToken || !json?.data?.refreshToken) {
          setStatus("err");
          setMessage(typeof json?.message === "string" ? json.message : "Link invalid or expired.");
          return;
        }
        const ok = await completeSessionFromTokens(json.data.accessToken, json.data.refreshToken);
        if (cancelled) return;
        if (!ok) {
          setStatus("err");
          setMessage("Could not load your profile. Try signing in manually.");
          return;
        }
        setStatus("ok");
        setMessage("Welcome! Redirecting…");
      } catch {
        if (!cancelled) {
          setStatus("err");
          setMessage("Network error. Check your connection and try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, completeSessionFromTokens]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 shadow-sm text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">LearnX</h1>
        {status === "loading" && <p className="text-muted-foreground">Signing you in…</p>}
        {status === "ok" && <p className="text-muted-foreground">{message}</p>}
        {status === "err" && (
          <>
            <p className="text-destructive text-sm">{message}</p>
            <Link to="/auth" className="inline-block text-primary text-sm font-medium hover:underline">
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
