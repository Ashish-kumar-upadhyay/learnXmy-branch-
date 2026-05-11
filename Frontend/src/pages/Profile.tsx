import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Camera, Save, User, Mail, BookOpen, Loader2, GraduationCap } from "lucide-react";
import { api, API_BASE, getAccessToken } from "@/lib/backendApi";
import ProfileImage from "@/components/ui/ProfileImage";

export default function Profile() {
  const { user, profile, roles, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setClassName(profile.class_name || "");
    setEmail(profile.email || "");
    // Prepend API base URL to profile image URL if it's a relative path
    const fullProfileImageUrl = profile.avatar_url ? 
      (profile.avatar_url.startsWith('http') ? profile.avatar_url : `${API_BASE}${profile.avatar_url}`) 
      : null;
    setProfileImage(fullProfileImageUrl);
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      toast.error("Please login again");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "avatar");

      const response = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Upload failed");
      }

      // Update profile image URL immediately
      const newProfileImageUrl = result.data?.url;
      const fullProfileImageUrl = newProfileImageUrl ? 
        (newProfileImageUrl.startsWith('http') ? newProfileImageUrl : `${API_BASE}${newProfileImageUrl}`) 
        : null;
      setProfileImage(fullProfileImageUrl);
      
      toast.success("Profile picture updated!");
      await refreshProfile?.();
      
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
        email: email.trim() || null,
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
          <ProfileImage 
            src={profileImage} 
            alt="Profile" 
            name={fullName || user?.email || "User"}
            size="lg"
            className="mx-auto"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground transition-transform hover:scale-110 disabled:opacity-50"
            style={{ background: "var(--gradient-primary)" }}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            onChange={handleAvatarUpload} 
            className="hidden" 
            disabled={uploading}
          />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground text-lg">{fullName || "Your Name"}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{roles[0] || "student"}</p>
          {user?.email && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
          )}
          {/* Display codes */}
          {profile?.student_id && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <GraduationCap className="w-3 h-3" />
              Student Code: {profile.student_id}
            </p>
          )}
          {profile?.teacher_code && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <GraduationCap className="w-3 h-3" />
              Teacher Code: {profile.teacher_code}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-7 space-y-5">
        <div>
          <label className={labelClass}><User className="w-3 h-3 inline mr-1" />Full Name</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" maxLength={100} />
        </div>
        {/* Email field - only editable by students */}
        {roles.includes("student") ? (
          <div>
            <label className={labelClass}><Mail className="w-3 h-3 inline mr-1" />Email Address</label>
            <input 
              className={inputClass} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="your.email@example.com" 
              type="email"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">You can update your email address</p>
          </div>
        ) : (
          user?.email && (
            <div>
              <label className={labelClass}><Mail className="w-3 h-3 inline mr-1" />Email Address</label>
              <input 
                className={inputClass} 
                value={user.email} 
                readOnly
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed by {roles[0] || "user"}</p>
            </div>
          )
        )}
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
