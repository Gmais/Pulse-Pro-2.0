import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    "https://ndzbfvxnallshfiouszk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kemJmdnhuYWxsc2hmaW91c3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2Mjg5NjMsImV4cCI6MjA1NjIwODk2M30.7Yt7Qo0T7mS"
);

async function check() {
    // Check current values in DB
    // Check tenants
    const { data: tenants, error: tErr } = await supabase
        .from("tenants")
        .select("*");

    if (tErr) {
        console.log("ERRO leitura tenants:", JSON.stringify(tErr));
    } else {
        console.log("\n=== Academias (Tenants) no Supabase ===");
        (tenants || []).forEach((t: any) => {
            console.log(`ID: ${t.id} | Nome: ${t.name} | Email: ${t.login_email}`);
        });
        if (!tenants || tenants.length === 0) console.log("Nenhuma academia encontrada na tabela 'tenants'.");
    }

    // Check student count and their tenantIds
    const { data: students, error: sErr } = await supabase
        .from("students")
        .select("id, name, tenant_id");

    if (sErr) {
        console.log("ERRO leitura students:", JSON.stringify(sErr));
    } else {
        console.log("\n=== Vínculos de Alunos ===");
        const tenantIds = [...new Set((students || []).map((s: any) => s.tenant_id))];
        console.log(`Total de alunos: ${students?.length || 0}`);
        console.log(`Tenant IDs únicos nos alunos: ${tenantIds.join(", ")}`);
    }
}

check().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
