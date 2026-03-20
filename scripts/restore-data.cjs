const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    "https://weeybrbfngobxutyywts.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlZXlicmJmbmdvYnh1dHl5d3RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4OTAwNzMsImV4cCI6MjA4NzQ2NjA3M30.Tya4rSSQHTLvxcOD_OAiaE4uT9dlvU2DjeEVIDhhjEU"
);

// These are the original values from before the bad script ran
// Captured from the first script's output
const restoreData = {
    "DAVID": { total_points: 30, total_calories: 19, total_minutes: 9 },
    "MATHEUS": { total_points: 42, total_calories: 396, total_minutes: 29 },
    "ASD": { total_points: 7, total_calories: 4, total_minutes: 0 },
    "EGLY": { total_points: 108, total_calories: 597, total_minutes: 55 },
    "RENILDO": { total_points: 29, total_calories: 288, total_minutes: 22 },
    "CLEURI": { total_points: 2, total_calories: 168, total_minutes: 42 },
    "MARIA HELENA": { total_points: 8, total_calories: 194, total_minutes: 25 },
    "JOEL": { total_points: 0, total_calories: 138, total_minutes: 8 },
    "EDIVANDO": { total_points: 37, total_calories: 372, total_minutes: 26 },
    "PAULO": { total_points: 105, total_calories: 904, total_minutes: 66 },
    "POLLY": { total_points: 4, total_calories: 34, total_minutes: 6 },
};

async function restore() {
    console.log("=== Restaurando dados zerados pelo script anterior ===\n");

    const { data: students, error } = await supabase
        .from("students")
        .select("id, name, total_points, total_calories, total_minutes");
    if (error) { console.log("ERRO:", error); return; }

    let restored = 0;
    for (const s of (students || [])) {
        const original = restoreData[s.name];
        if (!original) continue;

        // Only restore if current value is 0 (was zeroed by the bad script)
        const needsRestore =
            (s.total_points === 0 && original.total_points > 0) ||
            (s.total_calories === 0 && original.total_calories > 0) ||
            (s.total_minutes === 0 && original.total_minutes > 0);

        if (needsRestore) {
            console.log("Restaurando " + s.name + ":");
            console.log("  pts: " + s.total_points + " -> " + original.total_points);
            console.log("  cal: " + s.total_calories + " -> " + original.total_calories);
            console.log("  min: " + s.total_minutes + " -> " + original.total_minutes);

            const { error: upErr, data: upData } = await supabase
                .from("students")
                .update(original)
                .eq("id", s.id)
                .select("id");

            if (upErr) console.log("  ERRO: " + JSON.stringify(upErr));
            else if (!upData || upData.length === 0) console.log("  BLOQUEADO por RLS");
            else { console.log("  OK"); restored++; }
        }
    }

    console.log("\nRestaurados: " + restored);
}

restore().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
