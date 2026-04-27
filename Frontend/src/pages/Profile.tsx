import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Camera, Save, User, Mail, BookOpen, FileText, Loader2, Check } from "lucide-react";
import { api, API_BASE, getAccessToken } from "@/lib/backendApi";

const DEFAULT_AVATARS = [
  { id: "male1", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Leo&backgroundColor=b6e3f4", label: "Male 1" },
  { id: "male2", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Jack&backgroundColor=c0aede", label: "Male 2" },
  { id: "female1", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Lily&backgroundColor=ffd5dc", label: "Female 1" },
  { id: "female2", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Sophia&backgroundColor=d1d4f9", label: "Female 2" },
  { id: "neutral", url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Riley&backgroundColor=ffdfbf", label: "Neutral" },
];

function resolveAvatarUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== "string") return null;
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (input.startsWith("/api/files/")) return `${API_BASE}${input}`;
  return `${API_BASE}/api/files/${input}`;
}

function avatarValueForDb(input: string | null | undefined): string | null {
  if (!input) return null;
  const [withoutQuery] = input.split("?");
  if (withoutQuery.startsWith(API_BASE)) return withoutQuery.replace(API_BASE, "");
  return withoutQuery;
}

export default function Profile() {
  const { user, profile, roles, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setClassName(profile.class_name || "");
    setAvatarUrl(resolveAvatarUrl(profile.avatar_url));
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }

    const accessToken = getAccessToken();
    if (!accessToken) return toast.error("Please login again");

    setUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("kind", "avatar");

    const res = await fetch(`${API_BASE}/api/files/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      toast.error(json?.message || "Upload failed");
      setUploading(false);
      return;
    }

    const newUrl = json.data?.url as string | undefined;
    const absUrl = resolveAvatarUrl(newUrl);
    
    // Update local state immediately with cache-busting
    const cacheBustingUrl = absUrl ? `${absUrl}?t=${Date.now()}` : null;
    setAvatarUrl(cacheBustingUrl);
    
    // Persist clean value (without cache query) in DB.
    const profileUpdateRes = await api("/api/auth/profile", {
      method: "PUT",
      accessToken,
      body: JSON.stringify({ avatar_url: avatarValueForDb(absUrl) }),
    });
    
    if (profileUpdateRes.status !== 200) {
      console.error("Failed to save avatar to profile:", profileUpdateRes);
      toast.error("Avatar uploaded but not saved to profile");
    } else {
      console.log("Avatar saved to profile successfully");
      toast.success("Avatar updated!");
    }
    
    setUploading(false);
    await refreshProfile?.();
  };

  const selectDefaultAvatar = async (url: string) => {
    const accessToken = getAccessToken();
    if (!accessToken) return;
    if (!user) return;
    
    // Update local state immediately for better UX
    setAvatarUrl(url);
    
    // Save to backend
    const out = await api("/api/auth/profile", {
      method: "PUT",
      accessToken,
      body: JSON.stringify({ avatar_url: url }),
    });
    
    if (out.status !== 200) {
      toast.error("Avatar save failed");
      // Revert local state if backend update failed
      setAvatarUrl(resolveAvatarUrl(profile?.avatar_url));
    } else {
      toast.success("Avatar selected!");
    }
    
    // Refresh profile to ensure consistency
    await refreshProfile?.();
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
    const accessToken = getAccessToken();
    if (!accessToken) return toast.error("Please login again");
    setSaving(true);
    const out = await api("/api/auth/profile", {
      method: "PUT",
      accessToken,
      body: JSON.stringify({
        full_name: fullName.trim(),
        class_name: className.trim() || null,
        avatar_url: avatarValueForDb(avatarUrl),
      }),
    });
    if (out.status !== 200 || !out.data) {
      toast.error("Profile update failed");
    } else {
      toast.success("Profile updated!");
      refreshProfile?.();
    }
    setSaving(false);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-muted/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all";
  const labelClass = "text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-medium";
  const initials = (fullName || user?.email || "U").charAt(0).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Update your personal information</p>
      </div>

      {/* Avatar Section */}
      <div className="glass-card p-8 flex flex-col items-center gap-5">
        <div className="relative group">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-border/50 bg-muted/30 flex items-center justify-center">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                onError={() => setAvatarUrl(null)}
              />
            ) : null}
            <span className={`text-4xl font-bold text-primary ${avatarUrl ? "hidden" : ""}`}>{initials}</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground transition-transform hover:scale-110"
            style={{ background: "var(--gradient-primary)" }}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground text-lg">{fullName || "Your Name"}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{roles[0] || "student"}</p>
          {user?.email && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Mail className="w-3 h-3" />{user.email}
            </p>
          )}
        </div>

        {/* Default Avatar Options */}
        <div className="w-full">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 text-center font-medium">Or choose an avatar</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {DEFAULT_AVATARS.map((av) => (
              <button
                key={av.id}
                onClick={() => selectDefaultAvatar(av.url)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all hover:scale-110 ${avatarUrl === av.url ? "border-primary ring-2 ring-primary/30" : "border-border/50 hover:border-primary/50"}`}
              >
                <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                {avatarUrl === av.url && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-7 space-y-5">
        <div>
          <label className={labelClass}><User className="w-3 h-3 inline mr-1" />Full Name</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" maxLength={100} />
        </div>
                <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl font-semibold text-sm btn-premium flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}
