const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL = "https://ndzbfvxnallshfiouszk.supabase.co";
const SUPABASE_KEY = "sb_publishable_cEA3C8OvJgZfeZmbnfVYJg_3wuW1YAt";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    const { data, error } = await supabase.from("students").select("name, total_minutes, total_points").ilike("name", "%Ana B%");
    if (error) {
        console.error("ERRO:", error);
    } else {
        console.log("RESULTADO:", JSON.stringify(data));
    }
}
check();
