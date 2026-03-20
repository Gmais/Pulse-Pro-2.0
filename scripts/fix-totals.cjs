const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    "https://weeybrbfngobxutyywts.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZXlicmJmbmdvYnh1dHl5d3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTAwNzMsImV4cCI6MjA4NzQ2NjA3M30.Tya4rSSQHTLvxcOD_OAiaE4uT9dlvU2DjeEVIDhhjEU"
);

async function fixClassCounts() {
    console.log("=== Corrigindo contagem de aulas ===\n");
    console.log("REGRA: Nao altera pontos/calorias/minutos.");
    console.log("       Apenas corrige total_classes.\n");

    // 1. Fetch all students
    const { data: students, error: studErr } = await supabase
        .from("students")
        .select("id, name, total_points, total_calories, total_classes, total_minutes");
    if (studErr) { console.log("ERRO:", studErr); return; }

    // 2. Fetch all participants to count classes per student
    const { data: participants, error: partErr } = await supabase
        .from("class_participants")
        .select("student_id");
    if (partErr) { console.log("ERRO:", partErr); return; }

    // 3. Count classes per student from class_participants
    const classCount = {};
    (participants || []).forEach((p) => {
        classCount[p.student_id] = (classCount[p.student_id] || 0) + 1;
    });

    console.log("Alunos: " + (students || []).length);
    console.log("Participacoes no historico: " + (participants || []).length + "\n");

    let updated = 0;
    for (const s of (students || [])) {
        const fromHistory = classCount[s.id] || 0;
        const hasData = (s.total_points || 0) > 0 || (s.total_calories || 0) > 0 || (s.total_minutes || 0) > 0;

        // If student has accumulated data but 0 records in class_participants,
        // they participated in at least 1 class (data came from real-time sessions)
        let correctClasses = fromHistory;
        if (hasData && fromHistory === 0) {
            correctClasses = 1;
        }

        const currentClasses = s.total_classes || 0;

        if (currentClasses !== correctClasses) {
            console.log(s.name + ": aulas " + currentClasses + " -> " + correctClasses +
                (hasData && fromHistory === 0 ? " (tem dados, sem historico formal)" : ""));

            const { error, data: upData } = await supabase
                .from("students")
                .update({ total_classes: correctClasses })
                .eq("id", s.id)
                .select("id");

            if (error) {
                console.log("  ERRO: " + JSON.stringify(error));
            } else if (!upData || upData.length === 0) {
                console.log("  BLOQUEADO por RLS");
            } else {
                console.log("  OK");
                updated++;
            }
        }
    }

    console.log("\nAtualizados: " + updated);
    console.log("Pronto!");
}

fixClassCounts().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
