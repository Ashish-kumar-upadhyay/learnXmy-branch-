import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Sparkles, Loader2, ImagePlus, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api, getAccessToken } from "@/lib/backendApi";

interface Message {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string | null;
}

const suggestions = [
  "Explain backpropagation simply",
  "How do binary trees work?",
  "Summarize system design patterns",
  "Help me with SQL joins",
];

export default function AiTutor() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your **AI study assistant**. Ask me anything about your courses — I can explain concepts, solve doubts, summarize lectures, and recommend resources. 🎓" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !imagePreview) || isLoading) return;

    const userMsg: Message = { role: "user", content: text || "Please solve this doubt from attached image.", imageUrl: imagePreview };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setImagePreview(null);
    setIsLoading(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("Login required");
      const resp = await api<{ reply: string }>("/api/ai/tutor/chat", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          message: userMsg.content,
          image_data_url: userMsg.imageUrl || undefined,
          session_id: "default",
          stream: false,
        }),
      });
      if (resp.status !== 200 || !resp.data?.reply) {
        if (resp.status === 413) throw new Error("Image is too large. Please upload a smaller image.");
        const errText =
          typeof resp.error === "string"
            ? resp.error
            : typeof (resp.error as any)?.message === "string"
              ? (resp.error as any).message
              : "AI request failed";
        throw new Error(errText);
      }
      setMessages(prev => [...prev, { role: "assistant", content: resp.data!.reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${e.message}. Please try again.` }]);
    }

    setIsLoading(false);
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const fr = new FileReader();
      fr.onload = () => {
        img.src = String(fr.result || "");
      };
      fr.onerror = () => reject(new Error("Failed to read image"));
      img.onload = () => {
        const maxW = 1280;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Image processing not supported"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => reject(new Error("Invalid image file"));
      fr.readAsDataURL(file);
    });

  const handleImageFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    try {
      const out = await compressImage(file);
      setImagePreview(out);
    } catch (e: any) {
      setImagePreview(null);
      setMessages(prev => [...prev, { role: "assistant", content: `Image error: ${e?.message || "Failed to process image"}` }]);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">AI Tutor</h1>
        <p className="text-muted-foreground mt-1">Your personal learning assistant — powered by AI</p>
      </div>

      {/* Chat area */}
      <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--gradient-primary)" }}>
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className={`max-w-[70%] p-3 rounded-xl text-sm ${
              msg.role === "user"
                ? "bg-primary/15 text-foreground"
                : "bg-muted/50 text-foreground"
            }`}>
              {msg.role === "user" && msg.imageUrl && (
                <img src={msg.imageUrl} alt="student doubt" className="mb-2 max-h-44 rounded-lg border border-border/40" />
              )}
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--gradient-primary)" }}>
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-muted/50 p-3 rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 transition-colors"
            >
              <Sparkles className="w-3 h-3" /> {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="glass-card p-2 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageFile(e.target.files?.[0])}
        />
        <button
          onClick={handlePickImage}
          disabled={isLoading}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors bg-muted/50 text-muted-foreground hover:bg-muted"
          title="Attach doubt image"
        >
          <ImagePlus className="w-4 h-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Ask your AI tutor..."
          disabled={isLoading}
          className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground px-3 py-2"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || (!input.trim() && !imagePreview)}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors bg-primary/15 text-primary hover:bg-primary/25 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      {imagePreview && (
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 p-2 w-fit">
          <img src={imagePreview} alt="preview" className="h-12 w-12 rounded object-cover" />
          <span className="text-xs text-muted-foreground">Image attached</span>
          <button onClick={() => setImagePreview(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
