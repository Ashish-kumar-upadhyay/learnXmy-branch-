import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  MapPin, Camera, CheckCircle2, AlertTriangle, Loader2,
  Navigation, XCircle, RefreshCw, Send
} from "lucide-react";
import { format } from "date-fns";
import { api, getAccessToken, API_BASE } from "@/lib/backendApi";

const MAX_DISTANCE_METERS = 200;

type ClassInfo = {
  id: string;
  title: string;
  subject: string | null;
  location: string | null;
  scheduled_at: string;
  batch: string | null;
};

function haversineDistance(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AttendanceCheckIn({ onCheckInSuccess }: { onCheckInSuccess?: () => void }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState("");

  // Camera state
  const [cameraStatus, setCameraStatus] = useState<"idle" | "active" | "captured">("idle");
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Already checked in
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState<string[]>([]);

  useEffect(() => {
    if (user) loadClasses();
    return () => stopCamera();
  }, [user]);

  async function loadClasses() {
    setLoading(true);
    if (!user) {
      setLoading(false);
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Backend: `/api/classes` returns all classes; we filter for today in frontend.
    const classesRes = await api<any[]>("/api/classes", { method: "GET", accessToken });
    const all = (classesRes.status === 200 && classesRes.data ? classesRes.data : []) as any[];

    const today = new Date();
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    const todayClasses = all
      .map((c: any) => {
        const id = c.id ?? c._id ?? "";
        const scheduledAtRaw = c.scheduled_at ?? c.schedule ?? c.scheduledAt ?? null;
        const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
        return {
          id: String(id),
          title: c.title ?? c.name ?? "Class",
          subject: c.subject ?? null,
          location: c.location ?? null,
          scheduled_at: scheduledAt ? scheduledAt.toISOString() : new Date(0).toISOString(),
          batch: c.batch ?? null,
        } as ClassInfo;
      })
      .filter((c) => {
        if (!c.scheduled_at) return false;
        const d = new Date(c.scheduled_at);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    setClasses(todayClasses);

    // Already checked in (backend history gives student records)
    const historyRes = await api<any[]>(`/api/attendance/history/${user.id}`, { method: "GET", accessToken });
    if (historyRes.status === 200 && historyRes.data) {
      const ids = historyRes.data
        .filter((r) => r.class_id)
        .map((r) => String(r.class_id));
      setAlreadyCheckedIn(ids);
    } else {
      setAlreadyCheckedIn([]);
    }

    setLoading(false);
  }

  // GPS
  function requestGPS() {
    setGpsStatus("loading");
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("Geolocation not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus("success");
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(err.message || "Failed to get location");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // Camera
  async function startCamera() {
    try {
      // CRITICAL: getUserMedia must be called directly in click handler
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      // Stop any previous stream after getting new one
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      streamRef.current = stream;
      setCameraStatus("active");
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Camera access denied. Please allow camera access in your browser settings.");
    }
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror for selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        setSelfieBlob(blob);
        setSelfiePreview(URL.createObjectURL(blob));
        setCameraStatus("captured");
        stopCamera();
      }
    }, "image/jpeg", 0.8);
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }

  function retakePhoto() {
    setSelfieBlob(null);
    setSelfiePreview(null);
    setCameraStatus("idle");
    startCamera();
  }

  async function submitCheckIn() {
    if (!user || !selectedClass || !coords || !selfieBlob) return;
    setSubmitting(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("Please login again");

      // Upload selfie (backend file upload)
      const form = new FormData();
      form.append("file", selfieBlob, `selfie_${Date.now()}.jpg`);
      form.append("kind", "selfie");

      const uploadRes = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const uploadJson = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok || !uploadJson?.success || !uploadJson?.data?.url) {
        throw new Error(uploadJson?.message || "Selfie upload failed");
      }
      const rawSelfieUrl: string = uploadJson.data.url;
      const selfieUrl = rawSelfieUrl.startsWith("/") ? `${API_BASE}${rawSelfieUrl}` : rawSelfieUrl;

      // Insert attendance record
      const checkinRes = await api("/api/attendance/checkin", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          class_id: selectedClass.id,
          selfie_url: selfieUrl,
          latitude: coords.lat,
          longitude: coords.lng,
        }),
      });
      if (checkinRes.status !== 200) {
        const msg =
          typeof checkinRes.error === "string"
            ? checkinRes.error
            : (checkinRes.error as any)?.message ||
              (Array.isArray((checkinRes.error as any)?.errors) ? (checkinRes.error as any).errors[0] : null) ||
              "Check-in failed";
        throw new Error(msg);
      }

      toast.success("Check-in successful! 🎉");
      setAlreadyCheckedIn(prev => [...prev, selectedClass.id]);
      resetForm();
      onCheckInSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "Check-in failed");
    }
    setSubmitting(false);
  }

  function resetForm() {
    setSelectedClass(null);
    setCoords(null);
    setGpsStatus("idle");
    setSelfieBlob(null);
    setSelfiePreview(null);
    setCameraStatus("idle");
    stopCamera();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Class selection view
  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Attendance Check-In</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Verify your presence with GPS location and selfie
          </p>
        </div>

        {classes.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No classes scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map(c => {
              const checkedIn = alreadyCheckedIn.includes(c.id);
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => !checkedIn && setSelectedClass(c)}
                  disabled={checkedIn}
                  className={`w-full text-left glass-card-hover p-4 transition-all ${
                    checkedIn ? "opacity-60" : "hover:ring-1 hover:ring-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">{c.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {c.subject} · {format(new Date(c.scheduled_at), "h:mm a")}
                        {c.location && ` · ${c.location}`}
                      </p>
                    </div>
                    {checkedIn ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Checked In
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                        <Navigation className="w-3.5 h-3.5" /> Check In
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Check-in flow
  const canSubmit = gpsStatus === "success" && cameraStatus === "captured";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Check In</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedClass.title} · {format(new Date(selectedClass.scheduled_at), "h:mm a")}
          </p>
        </div>
        <button onClick={resetForm} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ✕ Cancel
        </button>
      </div>

      {/* Step 1: GPS */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            gpsStatus === "success" ? "bg-success/15" : gpsStatus === "error" ? "bg-destructive/15" : "bg-primary/10"
          }`}>
            {gpsStatus === "loading" ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : gpsStatus === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : gpsStatus === "error" ? (
              <XCircle className="w-5 h-5 text-destructive" />
            ) : (
              <MapPin className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Step 1: Verify Location</h3>
            <p className="text-xs text-muted-foreground">
              {gpsStatus === "success" && coords
                ? `Location captured (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
                : gpsStatus === "error"
                ? gpsError
                : "Allow location access to verify you're on campus"}
            </p>
          </div>
          {gpsStatus !== "success" && (
            <button
              onClick={requestGPS}
              disabled={gpsStatus === "loading"}
              className="px-4 py-2 rounded-lg text-xs font-medium text-primary-foreground disabled:opacity-50"
              style={{ background: "var(--gradient-primary)" }}
            >
              {gpsStatus === "loading" ? "Locating..." : gpsStatus === "error" ? "Retry" : "Get Location"}
            </button>
          )}
        </div>
      </div>

      {/* Step 2: Camera */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            cameraStatus === "captured" ? "bg-success/15" : "bg-primary/10"
          }`}>
            {cameraStatus === "captured" ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Camera className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Step 2: Take Selfie</h3>
            <p className="text-xs text-muted-foreground">
              {cameraStatus === "captured"
                ? "Selfie captured successfully"
                : "Take a selfie to verify your identity"}
            </p>
          </div>
          {cameraStatus === "idle" && (
            <button
              onClick={startCamera}
              className="px-4 py-2 rounded-lg text-xs font-medium text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              Open Camera
            </button>
          )}
        </div>

        {/* Camera preview */}
        {cameraStatus === "active" && (
          <div className="relative rounded-xl overflow-hidden bg-black max-w-[280px] mx-auto">
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full aspect-square object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <button
                onClick={capturePhoto}
                className="w-12 h-12 rounded-full bg-white/90 border-[3px] border-primary flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg"
              >
                <Camera className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
        )}

        {/* Selfie preview */}
        {cameraStatus === "captured" && selfiePreview && (
          <div className="relative rounded-xl overflow-hidden max-w-[280px] mx-auto">
            <img src={selfiePreview} alt="Selfie" className="w-full aspect-square object-cover rounded-xl" />
            <button
              onClick={retakePhoto}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/80 backdrop-blur text-xs font-medium text-foreground hover:bg-background transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retake
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Submit */}
      <button
        onClick={submitCheckIn}
        disabled={!canSubmit || submitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-primary-foreground disabled:opacity-40 transition-all"
        style={{ background: "var(--gradient-primary)" }}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {submitting ? "Submitting..." : "Submit Check-In"}
      </button>

      {!canSubmit && (
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Complete both steps above to check in
        </p>
      )}
    </motion.div>
  );
}
