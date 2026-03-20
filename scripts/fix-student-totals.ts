/**
 * Script para recalcular os totais dos alunos a partir do histórico real.
 * Executa via: npx tsx scripts/fix-student-totals.ts
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://weeybrbfngobxutyywts.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZXlicmJmbmdvYnh1dHl5d3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTAwNzMsImV4cCI6MjA4NzQ2NjA3M30.Tya4rSSQHTLvxcOD_OAiaE4uT9dlvU2DjeEVIDhhjEU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixStudentTotals() {
    console.log("=== Recalculando totais dos alunos ===\n");

    // 1. Fetch all students
    const { data: students, error: studErr } = await supabase
        .from("students")
        .select("id, name, total_points, total_calories, total_classes, total_minutes");
    if (studErr) throw studErr;
    console.log(`Alunos encontrados: ${(students || []).length}`);

    // 2. Fetch all class sessions
    const { data: sessions, error: sessErr } = await supabase
        .from("class_sessions")
        .select("id, duration_seconds, date");
    if (sessErr) throw sessErr;
    console.log(`Aulas encontradas: ${(sessions || []).length}`);

    // 3. Fetch all participants
    const { data: participants, error: partErr } = await supabase
        .from("class_participants")
        .select("session_id, student_id, points, calories");
    if (partErr) throw partErr;
    console.log(`Participacoes encontradas: ${(participants || []).length}\n`);

    // 4. Build session duration map
    const sessionDuration = new Map<string, number>();
    (sessions || []).forEach((s: any) => {
        sessionDuration.set(s.id, Math.round((s.duration_seconds || 0) / 60));
    });

    // 5. Aggregate per student
    const studentTotals = new Map<string, { points: number; calories: number; classes: number; minutes: number }>();

    (participants || []).forEach((p: any) => {
        const existing = studentTotals.get(p.student_id) || { points: 0, calories: 0, classes: 0, minutes: 0 };
        existing.points += Number(p.points) || 0;
        existing.calories += Number(p.calories) || 0;
        existing.classes += 1;
        existing.minutes += sessionDuration.get(p.session_id) || 0;
        studentTotals.set(p.student_id, existing);
    });

    // 6. Update each student
    let updated = 0;
    let skipped = 0;

    for (const student of (students || [])) {
        const s = student as any;
        const totals = studentTotals.get(s.id) || { points: 0, calories: 0, classes: 0, minutes: 0 };

        const needsUpdate =
            Math.round(s.total_points || 0) !== Math.round(totals.points) ||
            Math.round(s.total_calories || 0) !== Math.round(totals.calories) ||
            (s.total_classes || 0) !== totals.classes ||
            Math.round(s.total_minutes || 0) !== Math.round(totals.minutes);

        if (needsUpdate) {
            console.log(`Atualizando: ${s.name}`);
            console.log(`  Pontos:   ${Math.round(s.total_points || 0)} -> ${Math.round(totals.points)}`);
            console.log(`  Calorias: ${Math.round(s.total_calories || 0)} -> ${Math.round(totals.calories)}`);
            console.log(`  Aulas:    ${s.total_classes || 0} -> ${totals.classes}`);
            console.log(`  Minutos:  ${Math.round(s.total_minutes || 0)} -> ${Math.round(totals.minutes)}`);

            const { error } = await supabase
                .from("students")
                .update({
                    total_points: Math.round(totals.points),
                    total_calories: Math.round(totals.calories),
                    total_classes: totals.classes,
                    total_minutes: Math.round(totals.minutes),
                })
                .eq("id", s.id);

            if (error) {
                console.log(`  ERRO: ${error.message}`);
            } else {
                updated++;
            }
        } else {
            skipped++;
        }
    }

    console.log(`\n=== Resultado ===`);
    console.log(`Atualizados: ${updated}`);
    console.log(`Sem alteracao: ${skipped}`);
    console.log(`Total: ${(students || []).length}`);
}

fixStudentTotals().catch(console.error);
