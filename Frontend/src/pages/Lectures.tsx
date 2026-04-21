import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Radio, Clock, BookOpen, Maximize2, X, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, getAccessToken } from "@/lib/backendApi";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function Lectures() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);
  const [videoTimes, setVideoTimes] = useState<Record<string, number>>({});
  const { user } = useAuth();

  useEffect(() => {
    async function load() {
      if (!user) return;
      const accessToken = getAccessToken();
      if (!accessToken) return;
      setLoading(true);
      const res = await api<any[]>("/api/lectures", { method: "GET", accessToken });
      if (res.status === 200 && res.data) setLectures(res.data);
      setLoading(false);
    }
    void load();
  }, [user]);

  // Save current video time before switching to fullscreen
  const handleFullscreen = (lectureId: string) => {
    const iframe = document.querySelector(`[data-lecture-id="${lectureId}"] iframe`) as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      // Post message to get current time from YouTube iframe
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'getCurrentTime',
        args: []
      }), '*');
      
      // Listen for the response
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'infoDelivery' && data.info?.currentTime) {
            setVideoTimes(prev => ({ ...prev, [lectureId]: data.info.currentTime }));
            setFullscreenId(lectureId);
            setPlayingId(null); // Stop small video
            window.removeEventListener('message', messageHandler);
          }
        } catch (e) {
          // If we can't get the time, just proceed to fullscreen
          setFullscreenId(lectureId);
          setPlayingId(null);
          window.removeEventListener('message', messageHandler);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Fallback timeout
      setTimeout(() => {
        setFullscreenId(lectureId);
        setPlayingId(null);
        window.removeEventListener('message', messageHandler);
      }, 1000);
    } else {
      // Fallback if iframe not found
      setFullscreenId(lectureId);
      setPlayingId(null);
    }
  };

  // Handle exiting fullscreen
  const handleExitFullscreen = (lectureId: string) => {
    setFullscreenId(null);
    setPlayingId(lectureId); // Resume small video
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold text-foreground">Lectures</h1>
        <p className="text-muted-foreground mt-1">Watch your video lectures</p>
      </motion.div>

      {lectures.length === 0 ? (
        <motion.div variants={item} className="glass-card p-8 text-center text-muted-foreground">
          <Video className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No lectures available yet</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lectures.map((lec) => {
            const videoId = extractYouTubeId(lec.youtube_url);
            const isPlaying = playingId === lec.id;
            const thumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;

            return (
              <motion.div key={lec.id} variants={item}>
                <div className="glass-card-hover overflow-hidden group">
                  <div className="relative aspect-video bg-black/90 cursor-pointer overflow-hidden" onClick={() => setPlayingId(lec.id)} data-lecture-id={lec.id}>
                    {isPlaying && videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&start=${Math.floor(videoTimes[lec.id] || 0)}`}
                        title={lec.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    ) : (
                      <>
                        {thumb ? (
                          <img src={thumb} alt={lec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Video className="w-10 h-10 text-muted-foreground" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </>
                    )}
                    {isPlaying && (
                      <button onClick={(e) => { e.stopPropagation(); handleFullscreen(lec.id); }} className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-primary-foreground hover:bg-black/70 backdrop-blur-sm transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{lec.title}</h3>
                    {lec.description && <p className="text-xs text-muted-foreground line-clamp-2">{lec.description}</p>}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(lec.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {fullscreenId === lec.id && videoId && (
                  <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
                    <button onClick={() => handleExitFullscreen(lec.id)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/20 text-primary-foreground hover:bg-muted/30 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&start=${Math.floor(videoTimes[lec.id] || 0)}`}
                      title={lec.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full max-w-[95vw] max-h-[90vh] aspect-video"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
