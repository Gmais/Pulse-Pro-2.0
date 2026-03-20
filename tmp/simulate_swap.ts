
interface Student {
    id: string;
    name: string;
    antId?: string;
}

interface ActiveStudent {
    studentId: string;
    bpm: number;
    points: number;
}

const students: Student[] = [
    { id: "1", name: "Aluno A", antId: "123" },
    { id: "2", name: "Aluno B", antId: "456" }
];

let activeStudents: ActiveStudent[] = [];

function handleAntMessage(deviceId: string, bpm: number) {
    console.log(`[ANT] Receptor captou sensor ${deviceId} com ${bpm} BPM`);
    
    // Simulação da lógica atual do MonitorPage.tsx
    const student = students.find(s => s.antId === deviceId);
    
    if (!student) {
        console.log(`[ANT] Nenhum aluno encontrado para o sensor ${deviceId}`);
        return;
    }

    let active = activeStudents.find(a => a.studentId === student.id);
    if (!active) {
        console.log(`[ANT] Adicionando ${student.name} à aula automaticamente...`);
        active = { studentId: student.id, bpm, points: 0 };
        activeStudents.push(active);
    } else {
        active.bpm = bpm;
    }
}

function tick() {
    activeStudents.forEach(a => {
        if (a.bpm > 0) {
            a.points += 0.1; // Simulação simples
            console.log(`[Tick] ${students.find(s => s.id === a.studentId)?.name} acumulou pontos: ${a.points.toFixed(2)}`);
        }
    });
}

console.log("--- CENÁRIO 1: Aluno A usando sensor 123 ---");
handleAntMessage("123", 120);
tick();

console.log("\n--- CENÁRIO 2: Troca de sensor (Aluno B pega o sensor 123) ---");
console.log("!!! Problema: Aluno A ainda tem o sensor 123 no perfil !!!");
// O Aluno B começa a usar o sensor, mas o sistema ainda acha que é o Aluno A
handleAntMessage("123", 130);
tick();

console.log("\n--- PROPOSTA DE CORREÇÃO: Unicidade no perfil ---");
function updateStudentAntId(studentId: string, newAntId: string) {
    console.log(`[Store] Vinculando sensor ${newAntId} ao aluno ${studentId}`);
    // Limpar o sensor de qualquer outro aluno
    students.forEach(s => {
        if (s.antId === newAntId && s.id !== studentId) {
            console.log(`[Store] Removendo sensor ${newAntId} do aluno anterior (${s.name})`);
            s.antId = undefined;
        }
    });
    const student = students.find(s => s.id === studentId);
    if (student) student.antId = newAntId;
}

console.log("\n--- CENÁRIO 3: Re-atribuição correta do sensor ---");
updateStudentAntId("2", "123"); // Aluno B pega o sensor 123
handleAntMessage("123", 140);
tick();

console.log("\nEstado final dos alunos:");
console.log(JSON.stringify(students, null, 2));
console.log("\nEstado final da aula ativa:");
console.log(JSON.stringify(activeStudents, null, 2));
