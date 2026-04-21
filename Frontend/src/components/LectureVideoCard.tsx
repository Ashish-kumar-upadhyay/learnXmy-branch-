import { useState } from "react";
import { motion } from "framer-motion";
import {
  Play, Radio, Clock, BookOpen, Maximize2, X,
} from "lucide-react";

type Lecture = {
  id: number;
  title: string;
  subject: string;
  instructor: string;
  duration: string;
  progress: number;
  type: "recorded" | "live";
  date: string;
  videoId: string;
};

export default function LectureVideoCard({ lecture }: { lecture: Lecture }) {
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${lecture.videoId}/hqdefault.jpg`;

  return (
    <>
      <div className="glass-card-hover overflow-hidden group">
        {/* Video / Thumbnail area */}
        <div
          className="relative aspect-video bg-black/90 cursor-pointer overflow-hidden"
          onClick={() => setPlaying(true)}
        >
          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${lecture.videoId}?autoplay=1&rel=0&modestbranding=1`}
              title={lecture.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <>
              <img
                src={thumbnailUrl}
                alt={lecture.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                </div>
              </div>
              {/* Duration badge */}
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[11px] font-mono backdrop-blur-sm">
                {lecture.duration}
              </span>
            </>
          )}

          {/* Fullscreen button when playing */}
          {playing && (
            <button
              onClick={(e) => { e.stopPropagation(); setFullscreen(true); }}
              className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2">
            {lecture.type === "live" ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-destructive/90 text-white backdrop-blur-sm">
                <Radio className="w-3 h-3 animate-pulse" /> LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/90 text-primary-foreground backdrop-blur-sm">
                <Play className="w-3 h-3" /> Recorded
              </span>
            )}
          </div>
        </div>

        {/* Info section */}
        <div className="p-4 space-y-2">
          <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">{lecture.subject}</p>
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{lecture.title}</h3>
          <p className="text-xs text-muted-foreground">{lecture.instructor}</p>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {lecture.duration}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {lecture.date}</span>
          </div>

          {/* Progress */}
          <div className="pt-1">
            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ background: lecture.progress === 100 ? "hsl(var(--success))" : "hsl(var(--primary))" }}
                initial={{ width: 0 }}
                animate={{ width: `${lecture.progress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-[11px] text-muted-foreground">
                {lecture.progress === 100 ? "✅ Completed" : lecture.progress > 0 ? "In Progress" : "Not Started"}
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">{lecture.progress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <iframe
            src={`https://www.youtube.com/embed/${lecture.videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={lecture.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full max-w-[95vw] max-h-[90vh] aspect-video"
          />
        </div>
      )}
    </>
  );
}
