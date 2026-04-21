import { motion } from "framer-motion";

interface WalkingCharacterProps {
  role: "student" | "teacher" | "admin";
}

function StudentCharacter() {
  return (
    <svg viewBox="0 0 120 200" className="w-full h-full">
      {/* Backpack */}
      <rect x="62" y="65" width="22" height="30" rx="5" fill="hsl(190 95% 45%)" opacity="0.9" />
      <rect x="65" y="70" width="10" height="6" rx="2" fill="hsl(190 95% 65%)" />
      {/* Body */}
      <rect x="38" y="68" width="30" height="40" rx="6" fill="hsl(260 60% 55%)" />
      {/* Head */}
      <circle cx="53" cy="50" r="22" fill="hsl(30 60% 70%)" />
      {/* Hair */}
      <ellipse cx="53" cy="35" rx="22" ry="12" fill="hsl(30 30% 25%)" />
      {/* Eyes */}
      <circle cx="46" cy="48" r="2.5" fill="hsl(222 47% 10%)" />
      <circle cx="60" cy="48" r="2.5" fill="hsl(222 47% 10%)" />
      {/* Smile */}
      <path d="M46 56 Q53 62 60 56" stroke="hsl(222 47% 10%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Arms */}
      <motion.rect
        x="28" y="72" width="12" height="6" rx="3" fill="hsl(30 60% 70%)"
        animate={{ rotate: [0, 15, 0, -15, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "38px", originY: "75px" }}
      />
      {/* Legs */}
      <motion.rect
        x="40" y="106" width="10" height="28" rx="5" fill="hsl(220 30% 35%)"
        animate={{ rotate: [10, -10, 10] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "45px", originY: "106px" }}
      />
      <motion.rect
        x="56" y="106" width="10" height="28" rx="5" fill="hsl(220 30% 35%)"
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "61px", originY: "106px" }}
      />
      {/* Shoes */}
      <motion.ellipse
        cx="45" cy="136" rx="8" ry="4" fill="hsl(0 0% 20%)"
        animate={{ cy: [136, 132, 136] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx="61" cy="136" rx="8" ry="4" fill="hsl(0 0% 20%)"
        animate={{ cy: [132, 136, 132] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Cap */}
      <ellipse cx="53" cy="30" rx="24" ry="5" fill="hsl(190 95% 45%)" />
      <rect x="35" y="25" width="36" height="8" rx="3" fill="hsl(190 95% 45%)" />
      <rect x="68" y="27" width="14" height="3" rx="1.5" fill="hsl(190 95% 45%)" />
    </svg>
  );
}

function TeacherCharacter() {
  return (
    <svg viewBox="0 0 120 200" className="w-full h-full">
      {/* Body - formal shirt */}
      <rect x="38" y="68" width="30" height="42" rx="6" fill="hsl(222 47% 20%)" />
      {/* Tie */}
      <polygon points="53,70 49,90 53,95 57,90" fill="hsl(0 72% 45%)" />
      {/* Head */}
      <circle cx="53" cy="50" r="22" fill="hsl(25 50% 65%)" />
      {/* Hair */}
      <ellipse cx="53" cy="34" rx="22" ry="10" fill="hsl(30 20% 20%)" />
      {/* Glasses */}
      <circle cx="45" cy="48" r="6" stroke="hsl(40 40% 50%)" strokeWidth="1.5" fill="none" />
      <circle cx="61" cy="48" r="6" stroke="hsl(40 40% 50%)" strokeWidth="1.5" fill="none" />
      <line x1="51" y1="48" x2="55" y2="48" stroke="hsl(40 40% 50%)" strokeWidth="1.5" />
      {/* Eyes */}
      <circle cx="45" cy="48" r="2" fill="hsl(222 47% 10%)" />
      <circle cx="61" cy="48" r="2" fill="hsl(222 47% 10%)" />
      {/* Smile */}
      <path d="M46 56 Q53 61 60 56" stroke="hsl(222 47% 10%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Book in hand */}
      <motion.g
        animate={{ rotate: [0, 5, 0, -5, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "25px", originY: "85px" }}
      >
        <rect x="15" y="78" width="18" height="14" rx="2" fill="hsl(260 60% 55%)" />
        <line x1="24" y1="80" x2="24" y2="90" stroke="hsl(260 60% 75%)" strokeWidth="1" />
      </motion.g>
      {/* Arms */}
      <rect x="66" y="72" width="12" height="6" rx="3" fill="hsl(25 50% 65%)" />
      {/* Legs */}
      <motion.rect
        x="40" y="108" width="10" height="28" rx="5" fill="hsl(222 35% 25%)"
        animate={{ rotate: [8, -8, 8] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "45px", originY: "108px" }}
      />
      <motion.rect
        x="56" y="108" width="10" height="28" rx="5" fill="hsl(222 35% 25%)"
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "61px", originY: "108px" }}
      />
      {/* Shoes */}
      <motion.ellipse
        cx="45" cy="138" rx="8" ry="4" fill="hsl(25 40% 25%)"
        animate={{ cy: [138, 134, 138] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx="61" cy="138" rx="8" ry="4" fill="hsl(25 40% 25%)"
        animate={{ cy: [134, 138, 134] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

function AdminCharacter() {
  return (
    <svg viewBox="0 0 120 200" className="w-full h-full">
      {/* Body - suit */}
      <rect x="36" y="68" width="34" height="44" rx="6" fill="hsl(222 47% 15%)" />
      {/* Lapels */}
      <polygon points="45,68 53,85 42,85" fill="hsl(222 47% 20%)" />
      <polygon points="61,68 53,85 64,85" fill="hsl(222 47% 20%)" />
      {/* Tie */}
      <polygon points="53,72 50,90 53,94 56,90" fill="hsl(38 92% 50%)" />
      {/* Head */}
      <circle cx="53" cy="50" r="22" fill="hsl(20 45% 60%)" />
      {/* Hair - slicked back */}
      <ellipse cx="53" cy="34" rx="23" ry="11" fill="hsl(0 0% 15%)" />
      {/* Eyes */}
      <circle cx="46" cy="48" r="2.5" fill="hsl(222 47% 10%)" />
      <circle cx="60" cy="48" r="2.5" fill="hsl(222 47% 10%)" />
      {/* Serious expression */}
      <line x1="46" y1="57" x2="60" y2="57" stroke="hsl(222 47% 10%)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Clipboard */}
      <motion.g
        animate={{ rotate: [0, 3, 0, -3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "20px", originY: "90px" }}
      >
        <rect x="10" y="78" width="16" height="22" rx="2" fill="hsl(30 20% 60%)" />
        <rect x="12" y="76" width="12" height="4" rx="1" fill="hsl(30 20% 45%)" />
        <line x1="14" y1="84" x2="22" y2="84" stroke="hsl(30 20% 40%)" strokeWidth="1" />
        <line x1="14" y1="88" x2="22" y2="88" stroke="hsl(30 20% 40%)" strokeWidth="1" />
        <line x1="14" y1="92" x2="20" y2="92" stroke="hsl(30 20% 40%)" strokeWidth="1" />
      </motion.g>
      {/* Arms */}
      <rect x="68" y="72" width="12" height="6" rx="3" fill="hsl(20 45% 60%)" />
      {/* Legs */}
      <motion.rect
        x="40" y="110" width="10" height="28" rx="5" fill="hsl(222 35% 18%)"
        animate={{ rotate: [6, -6, 6] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "45px", originY: "110px" }}
      />
      <motion.rect
        x="56" y="110" width="10" height="28" rx="5" fill="hsl(222 35% 18%)"
        animate={{ rotate: [-6, 6, -6] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ originX: "61px", originY: "110px" }}
      />
      {/* Shoes */}
      <motion.ellipse
        cx="45" cy="140" rx="8" ry="4" fill="hsl(0 0% 10%)"
        animate={{ cy: [140, 136, 140] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.ellipse
        cx="61" cy="140" rx="8" ry="4" fill="hsl(0 0% 10%)"
        animate={{ cy: [136, 140, 136] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Badge */}
      <rect x="58" y="72" width="8" height="8" rx="4" fill="hsl(38 92% 55%)" />
    </svg>
  );
}

export default function WalkingCharacter({ role }: WalkingCharacterProps) {
  return (
    <motion.div
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: "0%", opacity: 1 }}
      transition={{
        duration: 2,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="w-32 h-48 md:w-40 md:h-56"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {role === "student" && <StudentCharacter />}
        {role === "teacher" && <TeacherCharacter />}
        {role === "admin" && <AdminCharacter />}
      </motion.div>
    </motion.div>
  );
}
