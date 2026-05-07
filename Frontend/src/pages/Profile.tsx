import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Camera, Save, User, Mail, BookOpen, Loader2, GraduationCap } from "lucide-react";
import { api, API_BASE, getAccessToken } from "@/lib/backendApi";

function resolveAvatarUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== "string") return null;
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (input.startsWith("/api/files/")) return `${API_BASE}${input}`;
  return `${API_BASE}/api/files/${input}`;
}

function avatarValueForDb(input: string | null | undefined): string | null {
  if (!input) return null;
  const [withoutQuery] = input.split("?");
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
      // Silent failure here; user-facing toast appears only on Save click.
    } else {
      console.log("Avatar saved to profile successfully");
    }
    
    setUploading(false);
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
      </div>

      {/* User Info Card */}
      <div className="glass-card p-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
            <Mail className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Email Address</p>
              <p className="text-sm font-medium text-foreground">{user?.email || "Not available"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
            <GraduationCap className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Student Code</p>
              <p className="text-sm font-medium text-foreground">{profile?.student_id || user?.id || "Not available"}</p>
            </div>
          </div>

          {className && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
              <BookOpen className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Class</p>
                <p className="text-sm font-medium text-foreground">{className}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-7 space-y-5">
        <div>
          <label className={labelClass}><User className="w-3 h-3 inline mr-1" />Full Name</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" maxLength={100} />
        </div>
        <div>
          <label className={labelClass}><BookOpen className="w-3 h-3 inline mr-1" />Class Name</label>
          <input 
            className={inputClass} 
            value={className} 
            onChange={(e) => setClassName(e.target.value)} 
            placeholder="Your class name" 
            maxLength={50}
            disabled={roles.includes("student")}
            readOnly={roles.includes("student")}
          />
          {roles.includes("student") && (
            <p className="text-xs text-muted-foreground mt-1">Class name cannot be changed by students</p>
          )}
        </div>
                <button onClick={handleSave} disabled={saving} className="w-full py-3 rounded-xl font-semibold text-sm btn-premium flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </motion.div>
  );
}
