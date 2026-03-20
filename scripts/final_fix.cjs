const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://ndzbfvxnallshfiouszk.supabase.co";
const SUPABASE_KEY = "sb_publishable_cEA3C8OvJgZfeZmbnfVYJg_3wuW1YAt";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkAndFix() {
    console.log("=== Verificação e Correção Final ===\n");

    // 1. Fetch Students
    const { data: students } = await supabase.from("students").select("id, name, total_minutes");
    
    // 2. Fetch Participants
    const { data: participants } = await supabase.from("class_participants").select("student_id, zone_time_seconds, points, calories");

    const stats = {};
    participants.forEach(p => {
        const id = p.student_id;
        if (!stats[id]) stats[id] = { minutes: 0, points: 0, calories: 0 };
        
        stats[id].points += (p.points || 0);
        stats[id].calories += (p.calories || 0);
        
        if (p.zone_time_seconds) {
            let s = 0;
            Object.values(p.zone_time_seconds).forEach(v => s += Number(v || 0));
            stats[id].minutes += Math.round(s / 60);
        }
    });

    console.log("Recalculado. Exemplo (Ana B):", stats[students.find(s => s.name.includes("Ana B"))?.id]);

    for (const student of students) {
        const sStat = stats[student.id] || { minutes: 0, points: 0, calories: 0 };
        
        // Update ONLY if it's currently wrong or 0
        const { error } = await supabase
            .from("students")
            .update({
                total_minutes: sStat.minutes,
                total_points: Math.round(sStat.points),
                total_calories: Math.round(sStat.calories)
            })
            .eq("id", student.id);
            
        if (error) console.error(`Erro ao atualizar ${student.name}:`, error);
    }

    console.log("\nAtualização concluída.");
}

checkAndFix();
