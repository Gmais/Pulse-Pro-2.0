import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    "https://ndzbfvxnallshfiouszk.supabase.co",
    "sb_publishable_cEA3C8OvJgZfeZmbnfVYJg_3wuW1YAt"
);

async function test() {
    console.log("Testando conexao com ndzbfvxnallshfiouszk...");
    const { data, error } = await supabase.from("tenants").select("id, name");
    if (error) {
        console.error("ERRO:", error.message);
    } else {
        console.log("SUCESSO! Academias encontradas:", data);
    }
}

test().then(() => process.exit(0));
