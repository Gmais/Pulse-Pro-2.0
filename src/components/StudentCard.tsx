import { useStore } from "@/store/useStore";
import { getZoneForPercent, getZoneCssColor } from "@/types/pulse";
import { Heart, X, Bluetooth, BluetoothOff, Flame, Trophy, Signal, SignalLow, SignalMedium, SignalZero, BatteryFull, BatteryMedium, BatteryLow, BatteryWarning, Battery, Radio, Check, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, memo, useMemo } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  studentId: string;
  onConnectBle?: (studentId: string) => void;
  onDisconnectBle?: (studentId: string) => void;
  onRemove?: (studentId: string) => void;
  rank?: number;
}

const StudentCard = memo(function StudentCard({ studentId, onConnectBle, onDisconnectBle, onRemove, rank }: Props) {
  // Use granular selectors to minimize re-renders
  const student = useStore((s) => s.students.find((st) => st.id === studentId));
  const active = useStore((s) => s.activeStudents.find((a) => a.studentId === studentId));
  const activeCount = useStore((s) => s.activeStudents.length);
  const zones = useStore((s) => s.zones);
  const displayMetric = useStore((s) => s.displayMetric);
  const removeActiveStudent = useStore((s) => s.removeActiveStudent);
  const updateStudent = useStore((s) => s.updateStudent);
  const sensors = useStore((s) => s.sensors);
  const connectionMethod = useStore((s) => s.connectionMethod);
  const professors = useStore((s) => s.professors);
  const updateActiveStudent = useStore((s) => s.updateActiveStudent);

  const [isEditingAnt, setIsEditingAnt] = useState(false);
  const [antInput, setAntInput] = useState("");

  const currentSensor = sensors.find(s => s.antId === student?.antId);
  const displayAntId = currentSensor ? currentSensor.friendlyId : student?.antId;

  // Memoize segments to avoid recalculating on every render
  const activeSegments = useMemo(() => {
    if (!active) return [{ color: "rgba(255,255,255,0.2)", percent: 100 }];

    const totalSeconds = Object.values(active.zoneTimeSeconds).reduce((a, b) => a + b, 0);
    const sortedZones = [...zones].sort((a, b) => a.minPercent - b.minPercent);

    const segments = sortedZones
      .map(z => ({
        color: getZoneCssColor(z.color),
        percent: totalSeconds > 0 ? (active.zoneTimeSeconds[z.id] || 0) / totalSeconds * 100 : 0
      }))
      .filter(seg => seg.percent > 0.1);

    if (segments.length === 0) {
      return [{ color: "rgba(255,255,255,0.2)", percent: 100 }];
    }
    return segments;
  }, [active?.zoneTimeSeconds, zones]);

  // Memoize gradient string
  const conicGradient = useMemo(() => {
    let current = 0;
    const stops = activeSegments.map(s => {
      const start = current;
      current += s.percent;
      return `${s.color} ${Math.max(0, start - 0.2)}% ${Math.min(100, current + 0.2)}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [activeSegments]);

  if (!student || !active) return null;

  const handleSaveAntId = () => {
    const matchingSensor = sensors.find(s => s.friendlyId.toLowerCase() === antInput.trim().toLowerCase());
    const finalAntId = matchingSensor ? matchingSensor.antId : antInput.trim();

    updateStudent(studentId, { antId: finalAntId });
    setIsEditingAnt(false);
    setAntInput("");

    if (matchingSensor) {
      toast.success(`Vinculado ao sensor ${matchingSensor.friendlyId} (${finalAntId})`);
    }
  };

  const zone = getZoneForPercent(active.fcmPercent, zones);
  const zoneColor = getZoneCssColor(zone.color);

  const mainValue =
    displayMetric === "fcm"
      ? active.fcmPercent
      : displayMetric === "bpm"
        ? active.bpm
        : Math.round(active.calories);

  const mainSuffix = displayMetric === "fcm" ? "%FCM" : displayMetric === "bpm" ? "BPM" : "CAL";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="rounded-[2.5rem] overflow-hidden relative flex flex-col h-full border-t border-l border-white/30 border-r border-b border-black/30 group"
      style={{
        backgroundColor: zoneColor,
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 45%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.3) 100%)`,
        boxShadow: `
          0 25px 50px -12px ${zoneColor}88, 
          inset 0 2px 4px rgba(255,255,255,0.4),
          inset 0 -2px 4px rgba(0,0,0,0.3),
          0 0 0 1px ${zoneColor}aa
        `,
        transition: "background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.8s ease",
      }}
    >
      {/* Metallic Shine Mask */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none z-0" />
      
      {/* Glossy Overlay */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0" />

      {/* Header row */}
      <div className={`flex items-center justify-between px-8 bg-black/10 backdrop-blur-md border-b border-white/10 relative z-10 ${activeCount >= 3 ? 'pt-4 pb-3' : 'pt-8 pb-4'}`}>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center">
            
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-white/50 overflow-hidden relative z-0 shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500"
              style={{ 
                backgroundColor: student.avatarUrl ? 'transparent' : student.avatarColor,
                boxShadow: `0 8px 16px -4px rgba(0,0,0,0.3)`
              }}
            >
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                student.name.charAt(0)
              )}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-white text-4xl tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              {student.name}
            </span>
            {student.antId && (
              <span className={`text-xs font-mono font-bold tracking-widest uppercase ${active.connectionType === "ant" ? "text-white" : "opacity-50 text-white"}`}>
                Sensor #{displayAntId}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
          <div className="flex items-center gap-1">
            {isEditingAnt ? (
              <div className="flex items-center gap-1 bg-black/40 rounded-lg pl-2 pr-1 py-0.5 border border-white/20">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      type="text"
                      className="bg-transparent text-white text-xs font-bold w-20 outline-none placeholder:text-white/40"
                      value={antInput}
                      onChange={(e) => setAntInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveAntId();
                        if (e.key === "Escape") setIsEditingAnt(false);
                      }}
                    />
                    <button onClick={handleSaveAntId} className="p-1 hover:bg-white/20 rounded">
                      <Check className="h-4 w-4 text-green-400" />
                    </button>
                    <button onClick={() => setIsEditingAnt(false)} className="p-1 hover:bg-white/20 rounded">
                      <X className="h-4 w-4 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-2">
                {(connectionMethod === "ant" || connectionMethod === "both") && (
                  <button
                    onClick={() => {
                      setAntInput(displayAntId || "");
                      setIsEditingAnt(true);
                    }}
                    className={`p-1.5 rounded-lg border-2 transition-all flex items-center gap-1 ${student.antId ? "bg-white/20 border-white/30" : "bg-amber-500/30 border-amber-500/50 animate-pulse"}`}
                  >
                    <Radio className={`h-5 w-5 ${student.antId ? (active.connectionType === "ant" ? 'text-green-400' : 'text-white/60') : 'text-amber-400'}`} />
                  </button>
                )}
                {(connectionMethod === "ble" || connectionMethod === "both") && active.connectionType !== "ant" && (
                  <button onClick={() => active.connected ? onDisconnectBle?.(studentId) : onConnectBle?.(studentId)} className="p-1.5 rounded hover:bg-black/20 shrink-0">
                    {active.connected ? <Bluetooth className="h-6 w-6 text-white" /> : <BluetoothOff className="h-6 w-6 text-white/50" />}
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => onRemove ? onRemove(studentId) : removeActiveStudent(studentId)}
              className="p-1.5 rounded hover:bg-black/20 transition-colors opacity-60 hover:opacity-100"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className={`flex-1 relative flex z-10 ${activeCount >= 3 ? 'items-start justify-center px-6 py-2' : 'items-center justify-center px-6 py-6'}`}>
        <div className="relative group/ring">
          {/* Outer Glow */}
          <div
            className="absolute inset-[-20px] rounded-full blur-3xl opacity-40 transition-all duration-1000 group-hover/ring:opacity-70 group-hover/ring:inset-[-30px]"
            style={{ backgroundColor: zoneColor }}
          />

          <div className={`relative ${activeCount <= 2 ? 'w-96 h-96' : 'w-56 h-56'} rounded-full flex items-center justify-center`}>
            {/* SVG Ring */}
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-[0_0_40px_rgba(0,0,0,0.5)] rotate-180 transition-transform duration-1000 group-hover/ring:scale-105">
              <defs>
                <filter id="ringInsetTitle" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                  <feOffset dy="3" dx="0" />
                  <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadow" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.6 0" />
                </filter>
              </defs>

              <foreignObject x="0" y="0" width="100" height="100" mask={`url(#mask-${studentId})`}>
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: conicGradient,
                    clipPath: 'circle(50%)',
                  }}
                />
              </foreignObject>

              <mask id={`mask-${studentId}`}>
                <circle cx="50" cy="50" r="50" fill="white" />
                <circle cx="50" cy="50" r="30" fill="black" />
              </mask>

              {/* Glass Rim Highlights */}
              <circle cx="50" cy="50" r="49.5" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.4" />
              <circle cx="50" cy="50" r="30.5" fill="none" stroke="black" strokeWidth="0.5" strokeOpacity="0.3" />
            </svg>

            {/* Inner Content Area - The "Jewel" */}
            <div
              className={`relative z-10 ${activeCount <= 2 ? 'w-[220px] h-[220px]' : 'w-[125px] h-[125px]'} rounded-full flex flex-col items-center justify-center overflow-hidden transition-all duration-700`}
              style={{
                backgroundColor: zoneColor,
                backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%), linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%)`,
                boxShadow: 'inset 0 15px 45px rgba(0,0,0,0.6), inset 0 -10px 25px rgba(255,255,255,0.2), 0 10px 30px rgba(0,0,0,0.4)',
              }}
            >
              {/* Internal Glass Reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center justify-center">
                {active.connected && active.bpm > 0 && (
                  <Heart
                    className={`${activeCount <= 2 ? 'h-12 w-12 mb-1' : 'h-7 w-7'} animate-heartbeat text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]`}
                    fill="white"
                  />
                )}
                <span className={`${activeCount <= 2 ? 'text-9xl' : 'text-6xl'} font-display font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] leading-none tracking-tighter`}>
                  {mainValue}
                </span>
                <span className={`${activeCount <= 2 ? 'text-2xl mt-1' : 'text-[10px] mt-0.5'} font-display font-black text-white/90 uppercase tracking-[0.3em] drop-shadow-md`}>
                  {mainSuffix}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Side stats - Modern Metallic Badges */}
        <div className="absolute top-4 right-8 flex flex-col gap-3 z-20">
          {[
            { icon: Heart, value: active.bpm, color: 'text-red-400', fill: true },
            { icon: Flame, value: Math.round(active.calories), color: 'text-orange-400', fill: false },
            { icon: Trophy, value: Math.round(active.points), color: 'text-yellow-400', fill: false },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4 bg-black/30 px-5 py-3 rounded-2xl backdrop-blur-xl border border-white/10 shadow-xl group/stat hover:bg-black/40 transition-all">
              <stat.icon 
                className={`h-7 w-7 ${stat.color} transition-transform group-hover/stat:scale-110`} 
                fill={stat.fill ? "currentColor" : "none"} 
              />
              <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Zone label */}
      <div className="px-4 py-6 bg-black/25 backdrop-blur-xl text-center border-t border-white/10 shadow-inner">
        <span className="text-2xl font-black text-white uppercase tracking-[0.2em] drop-shadow-md">{zone.name}</span>
      </div>
    </motion.div>
  );
});

export default StudentCard;
