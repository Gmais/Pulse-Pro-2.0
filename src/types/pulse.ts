export interface Tenant {
  id: string;
  name: string;
  logoUrl?: string;
  planTier: string;
  ownerId?: string;
  trialExpiresAt?: string;
  adminNotes?: string;
  loginEmail?: string;
  loginPassword?: string;
  masterMachineId?: string;
}

export interface Sensor {
  id: string;
  tenantId: string;
  friendlyId: string;
  antId: string;
  name?: string;
  createdAt?: string;
  lastStudentIds?: string[];
}

export interface Turma {
  id: string;
  tenantId: string;
  name: string;
  color: string;
}

export interface Student {
  id: string;
  tenantId: string;
  matricula: string;
  name: string;
  email: string;
  age: number;
  sex: "M" | "F";
  weight: number;
  fcm: number;
  avatarColor: string;
  active: boolean;
  turmaId: string;
  antId?: string;
  avatarUrl?: string;
  totalPoints: number;
  totalCalories: number;
  totalClasses: number;
  totalMinutes: number;
}

export interface Professor {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  active: boolean;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  minPercent: number;
  maxPercent: number;
  pointsPerMinute: number;
}

export interface ClassParticipant {
  studentId: string;
  points: number;
  calories: number;
  avgFcmPercent: number;
  peakBpm: number;
  zoneTimeSeconds: Record<string, number>;
  professorId?: string;
  connectedSeconds?: number;
}

export interface ActiveStudent {
  studentId: string;
  bpm: number;
  fcmPercent: number;
  calories: number;
  points: number;
  currentZoneId: string;
  connected: boolean;
  connectionTimer: number | null;
  zoneTimeSeconds: Record<string, number>;
  rssi: number | null;
  batteryLevel: number | null;
  connectedSeconds: number;
  sessionStartPoints: number;
  sessionStartCalories: number;
  professorId?: string;
  connectionType?: "ble" | "ant" | "simulated";
  lastHeartbeat?: number;
}

export interface ClassSession {
  id: string;
  tenantId: string;
  date: string;
  durationSeconds: number;
  totalPoints: number;
  totalCalories: number;
  turmaId?: string;
  professorId?: string;
  masterId?: string;
  participants: ClassParticipant[];
}

export const DEFAULT_ZONES: Zone[] = [
  { id: "z1", name: "Repouso (Preto)", color: "zone-rest", minPercent: 0, maxPercent: 59, pointsPerMinute: 0 },
  { id: "z2", name: "Aquecimento (Verde)", color: "zone-warmup", minPercent: 60, maxPercent: 69, pointsPerMinute: 0 },
  { id: "z3", name: "Início da Queima (Azul)", color: "zone-burn-start", minPercent: 70, maxPercent: 79, pointsPerMinute: 1 },
  { id: "z4", name: "Queima Total (Laranja)", color: "zone-burn-full", minPercent: 80, maxPercent: 90, pointsPerMinute: 2 },
  { id: "z5", name: "Performance (Vermelho)", color: "zone-performance", minPercent: 91, maxPercent: 100, pointsPerMinute: 3 },
];

export interface Challenge {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: "points" | "calories";
  scope: "team" | "individual" | "collective";
  targetValue: number;
  turmaId?: string;
  studentIds?: string[];
  active: boolean;
  createdAt: string;
}

export const AVATAR_COLORS = [
  "hsl(14, 100%, 55%)",
  "hsl(210, 100%, 55%)",
  "hsl(45, 100%, 55%)",
  "hsl(150, 80%, 45%)",
  "hsl(280, 80%, 55%)",
];

export function getZoneForPercent(percent: number, zones: Zone[]): Zone {
  for (let i = zones.length - 1; i >= 0; i--) {
    if (percent >= zones[i].minPercent) return zones[i];
  }
  return zones[0];
}

export function getZoneCssColor(zoneColor: string): string {
  const map: Record<string, string> = {
    "zone-rest": "hsl(0, 0%, 15%)", // Black
    "zone-warmup": "hsl(142, 70%, 45%)", // Green
    "zone-burn-start": "hsl(210, 100%, 55%)", // Blue
    "zone-burn-full": "hsl(25, 100%, 55%)", // Orange
    "zone-performance": "hsl(0, 85%, 55%)", // Red
  };
  return map[zoneColor] || zoneColor;
}

/**
 * Calculates calorie expenditure using the Keytel (2005) formula.
 * Male: kcal = [(-55.0969 + (0.6309 * FC) + (0.1988 * Weight) + (0.2017 * Age)) * Time(min)] / 4.184
 * Female: kcal = [(-20.4022 + (0.4472 * FC) - (0.1263 * Weight) + (0.074 * Age)) * Time(min)] / 4.184
 */
export function calculateCalories(
  bpm: number,
  weight: number,
  sex: "M" | "F",
  age: number,
  durationSeconds: number
): number {
  if (bpm <= 0 || weight <= 0 || age <= 0 || durationSeconds <= 0) return 0;

  const durationMinutes = durationSeconds / 60;
  let result: number;

  if (sex === "M") {
    result = ((-55.0969 + (0.6309 * bpm) + (0.1988 * weight) + (0.2017 * age)) * durationMinutes) / 4.184;
  } else {
    result = ((-20.4022 + (0.4472 * bpm) - (0.1263 * weight) + (0.074 * age)) * durationMinutes) / 4.184;
  }

  // Ensure we don't return negative calories (lower intensity might result in negative values in the formula)
  return Math.max(0, result);
}
