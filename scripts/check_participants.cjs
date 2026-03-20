const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL = "https://ndzbfvxnallshfiouszk.supabase.co";
const SUPABASE_KEY = "sb_publishable_cEA3C8OvJgZfeZmbnfVYJg_3wuW1YAt";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data: students } = await supabase.from("students").select("id, name").ilike("name", "%Ana B%");
    if (!students || students.length === 0) return;
    
    const studentId = students[0].id;
    console.log("Student ID:", studentId);

    const { data: participants, error } = await supabase.from("class_participants").select("session_id, points, calories, zone_time_seconds").eq("student_id", studentId);
    if (error) {
        console.error("ERRO:", error);
    } else {
        console.log("PARTICIPAÇÕES:", JSON.stringify(participants));
    }
}
check();
