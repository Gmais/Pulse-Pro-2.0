import { motion } from "framer-motion";
// Modern avatar implementation

interface PodiumEntry {
  name: string;
  value: number;
  valueLabel?: string;
  sex: "M" | "F";
  avatarColor?: string;
  avatarUrl?: string;
}

interface PodiumProps {
  /** Up to 3 entries: [1st, 2nd, 3rd] */
  entries: PodiumEntry[];
  /** For individual mode: show single student with rank below */
  mode?: "top3" | "individual";
  /** Rank position (only used in individual mode) */
  rank?: number;
}

const BOY_IMG = "/avatar-boy.png";
const GIRL_IMG = "/avatar-girl.png";

function PodiumAvatar({ entry, size = "lg" }: { entry: PodiumEntry; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  return (
    <div
      className={`${dim} rounded-full overflow-hidden flex items-center justify-center border-2 border-primary/30 shadow-lg`}
      style={{ backgroundColor: entry.avatarUrl ? 'transparent' : (entry.avatarColor || "hsl(var(--muted))") }}
    >
      <img
        src={entry.avatarUrl || (entry.sex === "F" ? GIRL_IMG : BOY_IMG)}
        alt={entry.name}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function Podium({ entries, mode = "top3", rank }: PodiumProps) {
  if (mode === "individual" && entries.length >= 1) {
    const entry = entries[0];
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        {/* Value above avatar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <span className="text-lg font-display font-bold text-primary tabular-nums">
            {Math.round(entry.value)}
          </span>
          {entry.valueLabel && (
            <span className="text-xs text-muted-foreground ml-1">{entry.valueLabel}</span>
          )}
        </motion.div>

        {/* Avatar */}
        <PodiumAvatar entry={entry} size="lg" />

        {/* Name */}
        <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">
          {entry.name}
        </span>

        {/* Podium block */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="w-20 h-16 rounded-t-lg bg-gradient-to-t from-amber-500 to-yellow-400 flex items-center justify-center origin-bottom shadow-md"
        >
          <span className="text-white font-display font-bold text-xl">🏆</span>
        </motion.div>

        {/* Rank below */}
        {rank !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-primary text-primary-foreground rounded-full px-4 py-1 text-sm font-bold"
          >
            {rank}º lugar
          </motion.div>
        )}
      </div>
    );
  }

  // Top 3 mode - render podium with 2nd | 1st | 3rd layout
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  const podiumHeights = [
    { height: "h-28", bg: "from-amber-500 to-yellow-400", label: "1º", delay: 0.1 },
    { height: "h-20", bg: "from-slate-400 to-slate-300", label: "2º", delay: 0.2 },
    { height: "h-14", bg: "from-amber-700 to-amber-600", label: "3º", delay: 0.3 },
  ];

  // Display order: [2nd, 1st, 3rd]
  const displayOrder = [
    { entry: second, podium: podiumHeights[1], index: 1 },
    { entry: first, podium: podiumHeights[0], index: 0 },
    { entry: third, podium: podiumHeights[2], index: 2 },
  ];

  return (
    <div className="flex items-end justify-center gap-3 py-4 px-2">
      {displayOrder.map(({ entry, podium, index }) => {
        if (!entry) return <div key={index} className="w-24" />;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: podium.delay }}
            className="flex flex-col items-center gap-1.5"
          >
            {/* Avatar */}
            <PodiumAvatar entry={entry} size={index === 0 ? "lg" : "sm"} />

            {/* Name */}
            <span className="text-xs font-semibold text-foreground truncate max-w-[90px] text-center leading-tight">
              {entry.name}
            </span>

            {/* Points */}
            <span className="text-xs font-bold text-primary tabular-nums">
              {Math.round(entry.value)} {entry.valueLabel || "pts"}
            </span>

            {/* Podium block */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: podium.delay + 0.1, type: "spring", stiffness: 200 }}
              className={`w-24 ${podium.height} rounded-t-lg bg-gradient-to-t ${podium.bg} flex items-center justify-center origin-bottom shadow-md`}
            >
              <span className="text-white font-display font-bold text-lg drop-shadow">{podium.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
