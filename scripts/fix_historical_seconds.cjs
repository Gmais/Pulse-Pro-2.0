const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL = "https://ndzbfvxnallshfiouszk.supabase.co";
const SUPABASE_KEY = "sb_publishable_cEA3C8OvJgZfeZmbnfVYJg_3wuW1YAt";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixHistory() {
    console.log("=== Corrigindo connected_seconds no histórico ===\n");

    const { data: participants, error: partErr } = await supabase.from("class_participants").select("session_id, student_id, zone_time_seconds, connected_seconds");
    if (partErr) { console.error("Erro:", partErr); return; }

    console.log(`Verificando ${participants.length} registros...`);

    let fixedCount = 0;
    for (const p of participants) {
        if (p.zone_time_seconds) {
            let totalSecs = 0;
            Object.values(p.zone_time_seconds).forEach(s => totalSecs += Number(s || 0));
            
            // If connected_seconds is 0 but we have zone time, update it
            if (totalSecs > 0 && (p.connected_seconds === 0 || p.connected_seconds === null)) {
                const { error } = await supabase
                    .from("class_participants")
                    .update({ connected_seconds: totalSecs })
                    .match({ session_id: p.session_id, student_id: p.student_id });
                
                if (error) {
                    console.error(`Erro no registro ${p.session_id}/${p.student_id}:`, error);
                } else {
                    fixedCount++;
                }
            }
        }
    }

    console.log(`\nFim! ${fixedCount} registros corrigidos.`);
}

fixHistory().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
});
