import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useStore } from "@/store/useStore";
import StudentCard from "@/components/StudentCard";
import { isBleSupported, connectToHrSensor, startHeartRateNotifications, disconnectDevice, readBatteryLevel, BleConnection } from "@/lib/ble";
import { Heart as HeartIcon, Activity } from "lucide-react";
import { AntBridgeClient } from "@/lib/ant";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import MonitorHeader from "@/components/monitor/MonitorHeader";
import IncludeStudentDialog from "@/components/monitor/IncludeStudentDialog";
import MissingParamsDialog from "@/components/monitor/MissingParamsDialog";
import ZoneConfigDialog from "@/components/ZoneConfigDialog";

// Monitor page component
export default function MonitorPage() {
  const {
    students, activeStudents, classRunning, classElapsed, soundAlert, displayMetric, zones,
    turmas, classTurmaId, professors,
    addActiveStudent, startClass, stopClass, toggleSound, setDisplayMetric,
    updateActiveStudent, removeActiveStudent, finishClass, setClassTurmaId,
    cacheSessionParticipant, clearSessionCache,
    updateStudent,
    currentTenant, antBridgeConnected, setAntBridgeConnected,
    connectionMethod, classHistory
  } = useStore();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [missingParamsStudentId, setMissingParamsStudentId] = useState<string | null>(null);
  const [missingParamsProfessorId, setMissingParamsProfessorId] = useState<string | undefined>(undefined);
  const [missingParams, setMissingParams] = useState({ age: 0, weight: 0, sex: "M" as "M" | "F" });

  const [studentSearch, setStudentSearch] = useState("");
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bleConnections = useRef<Map<string, BleConnection>>(new Map());

  // Cache for removed students' accumulated data (restore on reconnect same day)
  const removedStudentsCache = useRef<Map<string, { calories: number; points: number; connectedSeconds: number; zoneTimeSeconds: Record<string, number>; removedAt: number }>>(new Map());

  // Keep BLE device refs for auto-reconnect (persist beyond removal)
  const bleDevices = useRef<Map<string, { device: any; pairedAt: number }>>(new Map());
  const autoReconnectRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const batteryPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Track students manually removed in the current session to prevent ANT+ auto-re-add
  const recentlyRemovedSet = useRef<Set<string>>(new Set());

  // Poll battery level every 30s for connected BLE devices
  useEffect(() => {
    batteryPollRef.current = setInterval(async () => {
      for (const [studentId, conn] of bleConnections.current.entries()) {
        const battery = await readBatteryLevel(conn);
        if (battery !== null) {
          useStore.getState().updateActiveStudent(studentId, { batteryLevel: battery });
        }
      }
    }, 30000);
    return () => {
      if (batteryPollRef.current) clearInterval(batteryPollRef.current);
    };
  }, []);

  // Sound alert ref
  const lastAlertTime = useRef<Map<string, number>>(new Map());
  const playAlertSound = useCallback(() => {
    const state = useStore.getState();
    if (!state.soundAlert) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "square";
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { }
  }, []);

  // Simulate BLE data (fallback when real BLE not available)
  const simulateData = useCallback(() => {
    const state = useStore.getState();
    state.activeStudents.forEach((a) => {
      if (!a.connected) return;
      if (bleConnections.current.has(a.studentId)) return;

      const student = state.students.find((s) => s.id === a.studentId);
      if (!student) return;

      const baseBpm = Math.round(student.fcm * 0.65);
      const currentBpm = a.bpm || baseBpm;
      const delta = Math.floor(Math.random() * 3) - 1;
      const newBpm = Math.max(60, Math.min(student.fcm + 5, currentBpm + delta));
      const fcmPercent = Math.round((newBpm / student.fcm) * 100);

      state.updateActiveStudent(a.studentId, {
        bpm: newBpm,
        fcmPercent: fcmPercent,
        connected: true,
        connectionType: "simulated",
        lastHeartbeat: Date.now(),
      });

      if (fcmPercent >= 99) {
        const now = Date.now();
        const last = lastAlertTime.current.get(a.studentId) || 0;
        if (now - last > 10000) {
          lastAlertTime.current.set(a.studentId, now);
          playAlertSound();
        }
      }
    });
  }, [playAlertSound]);

  useEffect(() => {
    if (classRunning) {
      simRef.current = setInterval(simulateData, 5000);
    } else if (simRef.current) {
      clearInterval(simRef.current);
    }
    return () => {
      if (simRef.current) clearInterval(simRef.current);
    };
  }, [classRunning, simulateData]);


  const setupBleNotifications = useCallback((studentId: string, connection: BleConnection) => {
    startHeartRateNotifications(connection.characteristic, (bpm) => {
      const state = useStore.getState();
      const student = state.students.find((s) => s.id === studentId);
      const fcmPercent = student ? Math.round((bpm / student.fcm) * 100) : 0;

      state.updateActiveStudent(studentId, {
        bpm,
        fcmPercent,
        connected: true,
        connectionType: "ble",
        lastHeartbeat: Date.now(),
      });
    });
  }, []);

  const handleConnectBle = useCallback(async (studentId: string) => {
    try {
      // If student was just added manually, we don't automatically connect/simulate anymore.
      // This prevents "ghost points" on browsers without BLE.
      // The user must either connect a real sensor (ANT+) or manually start a simulation if intended.
      
      const connection = await connectToHrSensor(() => {
        bleConnections.current.delete(studentId);
        const state = useStore.getState();
        const a = state.activeStudents.find((x) => x.studentId === studentId);
        if (a) {
          state.updateActiveStudent(studentId, { connected: false, bpm: 0, fcmPercent: 0 });
        }
        const student = state.students.find((s) => s.id === studentId);
        toast.warning(`Sensor desconectado: ${student?.name}. Tentando reconectar automaticamente...`);
      });
      bleConnections.current.set(studentId, connection);
      bleDevices.current.set(studentId, { device: connection.device, pairedAt: Date.now() });

      setupBleNotifications(studentId, connection);

      const battery = await readBatteryLevel(connection);
      updateActiveStudent(studentId, { connected: true, batteryLevel: battery, connectionType: "ble", lastHeartbeat: Date.now() });
      const student = students.find((s) => s.id === studentId);
      toast.success(`Sensor BLE conectado: ${student?.name}`);
    } catch (err: any) {
      toast.error(`Erro BLE: ${err.message || "Falha na conexão"}`);
    }
  }, [students, updateActiveStudent, setupBleNotifications]);

  const handleDisconnectBle = useCallback((studentId: string) => {
    const conn = bleConnections.current.get(studentId);
    if (conn) {
      disconnectDevice(conn);
      bleConnections.current.delete(studentId);
    }
    updateActiveStudent(studentId, { connected: false, bpm: 0, fcmPercent: 0 });
    toast.info("Sensor BLE desconectado");
  }, [updateActiveStudent]);

  useEffect(() => {
    if (!isBleSupported()) return;

    autoReconnectRef.current = setInterval(async () => {
      // Don't auto-reconnect BLE if method is ant-only
      if (useStore.getState().connectionMethod === "ant") return;

      const now = Date.now();
      const thirtyMin = 30 * 60 * 1000;

      for (const [studentId, { device, pairedAt }] of bleDevices.current.entries()) {
        if (now - pairedAt > thirtyMin) {
          bleDevices.current.delete(studentId);
          continue;
        }
        if (bleConnections.current.has(studentId)) continue;

        const state = useStore.getState();
        const isActive = state.activeStudents.find((a) => a.studentId === studentId);
        const isRemoved = removedStudentsCache.current.has(studentId);
        if (!isActive && !isRemoved) continue;

        try {
          if (!device.gatt.connected) {
            const server = await device.gatt.connect();
            const service = await server.getPrimaryService(0x180d);
            const characteristic = await service.getCharacteristic(0x2a37);
            let batteryCharacteristic: any = null;
            try {
              const batteryService = await server.getPrimaryService(0x180f);
              batteryCharacteristic = await batteryService.getCharacteristic(0x2a19);
            } catch { }
            const connection: BleConnection = { device, server, characteristic, batteryCharacteristic };

            if (!isActive && isRemoved) {
              state.addActiveStudent(studentId);
              const cached = removedStudentsCache.current.get(studentId);
              if (cached) {
                state.updateActiveStudent(studentId, {
                  calories: cached.calories,
                  points: cached.points,
                  connectedSeconds: cached.connectedSeconds,
                  zoneTimeSeconds: cached.zoneTimeSeconds,
                  connected: true,
                  connectionType: "ble",
                });
                removedStudentsCache.current.delete(studentId);
              }
              toast.success("Aluno reconectado automaticamente com dados restaurados!");
            } else {
              state.updateActiveStudent(studentId, { connected: true, connectionType: "ble" });
              toast.success("Sensor BLE reconectado automaticamente!");
            }

            bleConnections.current.set(studentId, connection);

            device.addEventListener("gattserverdisconnected", () => {
              bleConnections.current.delete(studentId);
              const s = useStore.getState();
              const a = s.activeStudents.find((x) => x.studentId === studentId);
              if (a) {
                s.updateActiveStudent(studentId, { connected: false, bpm: 0, fcmPercent: 0 });
              }
            });

            setupBleNotifications(studentId, connection);
          }
        } catch { }
      }
    }, 10000);

    return () => {
      if (autoReconnectRef.current) clearInterval(autoReconnectRef.current);
    };
  }, [setupBleNotifications]);

  useEffect(() => {
    const client = new AntBridgeClient(
      (msg) => {
        // Ignore ANT+ messages if method is ble-only
        if (useStore.getState().connectionMethod === "ble") return;

        if (msg.type === "info" && msg.hostname) {
          useStore.getState().setMachineId(msg.hostname);
          console.log("[ANT] Machine ID identified:", msg.hostname);
        }

        if (msg.type === "hr") {
          const state = useStore.getState();
          const student = state.students.find((s) => s.antId === msg.deviceId);
          if (!student) return;

          // Prevent auto-re-add if student was manually removed recently
          if (recentlyRemovedSet.current.has(student.id)) return;

          let a = state.activeStudents.find((as) => as.studentId === student.id);

          if (!a && student.active) {
            // Threshold for auto-activation: only add if actually exercising (FCM >= 50% or bpm > 60)
            const fcmPercent = Math.round((msg.bpm / student.fcm) * 100);
            if (fcmPercent < 50 && msg.bpm < 60) {
              // Ignore low-intensity signals for auto-add to prevent adding people walking nearby
              return;
            }

            state.addActiveStudent(student.id);
            if (!state.classRunning) {
              state.startClass();
            }
            a = useStore.getState().activeStudents.find((as) => as.studentId === student.id);
          }

          if (a) {
            const bpm = msg.bpm;
            const fcmPercent = Math.round((bpm / student.fcm) * 100);

            state.updateActiveStudent(student.id, {
              bpm,
              fcmPercent,
              connected: true,
              connectionType: "ant",
              rssi: msg.rssi !== undefined ? msg.rssi : null,
              batteryLevel: msg.batteryLevel !== undefined ? msg.batteryLevel : null,
              lastHeartbeat: Date.now(),
            });
          }
        }
      },
      (connected) => setAntBridgeConnected(connected)
    );

    client.connect();
    return () => client.disconnect();
  }, []);



  const isToday = (dateStr: string) => {
    const today = new Date().toDateString();
    return new Date(dateStr).toDateString() === today;
  };
  const { totalPts, totalCal, totalAlunos } = useMemo(() => {
    // 1. Get today's historical sessions for all turmas (global daily aggregated)
    const todaySessions = classHistory.filter(s => isToday(s.date));

    // 2. Sum historical totals
    let pts = todaySessions.reduce((acc, s) => acc + s.totalPoints, 0);
    let cal = todaySessions.reduce((acc, s) => acc + s.totalCalories, 0);

    // 3. Track unique student IDs for the day
    const uniqueStudents = new Set<string>();
    todaySessions.forEach(s => s.participants.forEach(p => uniqueStudents.add(p.studentId)));

    // 4. Add current active session data
    activeStudents.forEach(a => {
      pts += a.points;
      cal += a.calories;
      uniqueStudents.add(a.studentId);
    });

    // 5. Subtract what's ALREADY in history from active students (if any) to avoid double counting 
    const currentSessionId = useStore.getState().currentSessionId;
    if (currentSessionId) {
      const currentSessionInHistory = todaySessions.find(s => s.id === currentSessionId);
      if (currentSessionInHistory) {
        pts -= currentSessionInHistory.totalPoints;
        cal -= currentSessionInHistory.totalCalories;
      }
    }

    return {
      totalPts: Math.round(pts),
      totalCal: Math.round(cal),
      totalAlunos: uniqueStudents.size
    };
  }, [activeStudents, classTurmaId, classHistory]);

  const studentRankings = useMemo(() => {
    // Calculate total points for today for all ACTIVE students to show crowns
    const today = new Date().toDateString();
    
    // Map of studentId -> totalPoints today
    const pointsMap = new Map<string, number>();

    // 1. Historical points from today
    classHistory.forEach(session => {
      if (new Date(session.date).toDateString() === today) {
        session.participants.forEach(p => {
          pointsMap.set(p.studentId, (pointsMap.get(p.studentId) || 0) + p.points);
        });
      }
    });

    // 2. Active session points
    activeStudents.forEach(a => {
      pointsMap.set(a.studentId, (pointsMap.get(a.studentId) || 0) + a.points);
    });

    // Sort all students with points today
    const sorted = Array.from(pointsMap.entries())
      .sort((a, b) => b[1] - a[1]);

    // return map of studentId -> rank (1, 2, 3)
    const ranks = new Map<string, number>();
    sorted.slice(0, 3).forEach(([id], index) => {
      ranks.set(id, index + 1);
    });
    
    return ranks;
  }, [activeStudents, classHistory]);

  const availableStudents = useMemo(() => students.filter(
    (s) => s.active && !activeStudents.find((a) => a.studentId === s.id)
  ), [students, activeStudents]);

  const gridCols = useMemo(() => {
    const count = activeStudents.length;
    if (count <= 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 12) return "grid-cols-4";
    if (count <= 16) return "grid-cols-4";
    if (count <= 20) return "grid-cols-5";
    if (count <= 24) return "grid-cols-5";
    return "grid-cols-6";
  }, [activeStudents.length]);

  const handleAddStudent = (studentId: string, professorId?: string) => {
    if (activeStudents.find((a) => a.studentId === studentId)) {
      toast.error("Este aluno já está na aula.");
      return;
    }

    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    if (!student.age || !student.weight || !student.sex) {
      setMissingParams({
        age: student.age || 0,
        weight: student.weight || 0,
        sex: student.sex || "M"
      });
      setMissingParamsStudentId(studentId);
      setMissingParamsProfessorId(professorId);
      return;
    }

    const cached = removedStudentsCache.current.get(studentId);
    let restoreData = null;

    // If re-added manually, remove from the "protection" set
    recentlyRemovedSet.current.delete(studentId);

    if (cached) {
      const now = new Date();
      if (now.toDateString() === new Date(cached.removedAt).toDateString()) {
        restoreData = { ...cached };
      }
      removedStudentsCache.current.delete(studentId);
    } else {
      // Try restore from store cache (persisted across refreshes)
      const state = useStore.getState();
      const storeCached = state.sessionParticipantsCache[studentId];
      if (storeCached) {
        restoreData = { ...storeCached };
      }
    }

    addActiveStudent(studentId, professorId);
    toast.success("Aluno incluído com sucesso!");

    if (restoreData) {
      updateActiveStudent(studentId, {
        calories: restoreData.calories,
        points: restoreData.points,
        connectedSeconds: restoreData.connectedSeconds,
        zoneTimeSeconds: restoreData.zoneTimeSeconds,
      });
      toast.success("Dados restaurados!");
    }

    if (!classRunning) {
      startClass();
    }

    setAddDialogOpen(false);
  };

  const handleSaveMissingParams = () => {
    if (missingParamsStudentId) {
      if (missingParams.age <= 0 || missingParams.weight <= 0) {
        toast.error("Informe valores válidos.");
        return;
      }
      updateStudent(missingParamsStudentId, { ...missingParams });
      const id = missingParamsStudentId;
      const profId = missingParamsProfessorId;
      setMissingParamsStudentId(null);
      setMissingParamsProfessorId(undefined);
      handleAddStudent(id, profId);
    }
  };

  const handleRemoveStudent = useCallback((studentId: string) => {
    const state = useStore.getState();
    const a = state.activeStudents.find((x) => x.studentId === studentId);
    if (a) {
      removedStudentsCache.current.set(studentId, {
        calories: a.calories,
        points: a.points,
        connectedSeconds: a.connectedSeconds,
        zoneTimeSeconds: { ...a.zoneTimeSeconds },
        removedAt: Date.now(),
      });
      cacheSessionParticipant(studentId, {
        points: a.points,
        calories: a.calories,
        zoneTimeSeconds: { ...a.zoneTimeSeconds },
        connectedSeconds: a.connectedSeconds,
        professorId: a.professorId,
      });
    }
    const conn = bleConnections.current.get(studentId);
    if (conn) {
      disconnectDevice(conn);
      bleConnections.current.delete(studentId);
    }
    removeActiveStudent(studentId);
    
    // Protect against ANT+ auto-re-add for the duration of this session
    recentlyRemovedSet.current.add(studentId);
  }, [removeActiveStudent, cacheSessionParticipant, finishClass, stopClass]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = useStore.getState();
      if (state.classRunning && state.activeStudents.length > 0) {
        state.finishClass();
        state.stopClass();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const isFullscreen = !!document.fullscreenElement;

  return (
    <div className={`flex flex-col ${isFullscreen ? 'h-screen' : 'h-[calc(100vh-56px)]'}`}>
      <MonitorHeader
        isFullscreen={isFullscreen}
        logoUrl={currentTenant?.logoUrl}
        tenantName={currentTenant?.name}
        classRunning={classRunning}
        classElapsed={classElapsed}
        classTurmaId={classTurmaId}
        turmas={turmas}
        professors={professors}
        soundAlert={soundAlert}
        displayMetric={displayMetric}
        onStartClass={() => {
          recentlyRemovedSet.current.clear();
          startClass();
        }}
        onStopClass={() => {
          recentlyRemovedSet.current.clear();
          stopClass();
        }}
        onFinishClass={() => { 
          recentlyRemovedSet.current.clear();
          finishClass(); 
          stopClass(); 
        }}
        onSetClassTurmaId={(turmaId) => {
          setClassTurmaId(turmaId);
        }}
        onToggleSound={toggleSound}
        onSetDisplayMetric={setDisplayMetric}
        onHandleFullscreen={handleFullscreen}
        antBridgeConnected={antBridgeConnected}
        isMonitorMode={useStore.getState().isMonitorMode}
        onSetMonitorMode={(val) => useStore.getState().setIsMonitorMode(val)}
        machineId={useStore.getState().machineId}
        currentMasterId={useStore.getState().currentMasterId}
      >
        <div className="flex items-center gap-2">
          <IncludeStudentDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            availableStudents={availableStudents}
            onAddStudent={handleAddStudent}
          />
          <div className="mx-1">
            <ZoneConfigDialog />
          </div>
        </div>
        <div className="flex items-center gap-4 ml-2">
          <div className="text-center">
            <div className="text-lg font-display font-bold text-primary tabular-nums">{totalPts}</div>
            <div className="text-[10px] text-muted-foreground uppercase">PTS Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-display font-bold text-orange-500 tabular-nums">{totalCal}</div>
            <div className="text-[10px] text-muted-foreground uppercase">CAL Total</div>
          </div>
          <div className="text-center mr-4">
            <div className="text-lg font-display font-bold text-foreground tabular-nums">{totalAlunos}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Alunos</div>
          </div>
        </div>
      </MonitorHeader>

      <MissingParamsDialog
        studentId={missingParamsStudentId}
        onClose={() => setMissingParamsStudentId(null)}
        params={missingParams}
        onParamsChange={setMissingParams}
        onSave={handleSaveMissingParams}
      />

      <div className="flex-1 overflow-auto p-4">
        {activeStudents.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <HeartIcon className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <h2 className="text-xl font-display font-semibold text-muted-foreground">Nenhum aluno na aula</h2>
              <p className="text-sm text-muted-foreground">Adicione alunos para monitorar</p>
            </div>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-3 h-full`} style={{ gridAutoRows: '1fr' }}>
            <AnimatePresence>
              {activeStudents.map((a) => (
                <StudentCard
                  key={a.studentId}
                  studentId={a.studentId}
                  onConnectBle={handleConnectBle}
                  onDisconnectBle={handleDisconnectBle}
                  onRemove={handleRemoveStudent}
                  rank={studentRankings.get(a.studentId)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div >
  );
}
