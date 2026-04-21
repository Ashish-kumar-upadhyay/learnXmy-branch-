import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { setTokens } from "@/lib/backendApi";
import { toast } from "sonner";

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    if (!accessToken || !refreshToken) {
      toast.error("Google login failed");
      setLoading(false);
      navigate("/auth");
      return;
    }

    try {
      setTokens({ accessToken, refreshToken });
      void refreshProfile().finally(() => {
        setLoading(false);
        navigate("/");
      });
    } catch (e) {
      toast.error("Google callback error");
      setLoading(false);
      navigate("/auth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading) return null;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}

