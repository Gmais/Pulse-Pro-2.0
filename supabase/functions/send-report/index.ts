const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ReportData {
  studentName: string;
  studentEmail: string;
  sessionsCount: number;
  totalCalories: number;
  totalPoints: number;
  totalDurationMin: number;
  zoneData: { name: string; color: string; minutes: number; percent: number }[];
  periodLabel: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const data: ReportData = await req.json();
    const { studentName, studentEmail, sessionsCount, totalCalories, totalPoints, totalDurationMin, zoneData, periodLabel } = data;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!studentEmail || !emailRegex.test(studentEmail.trim())) {
      return new Response(JSON.stringify({ error: 'Email do aluno inválido. Use o formato email@exemplo.com' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const zoneRows = zoneData
      .filter(z => z.minutes > 0 || z.percent > 0)
      .map(z => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;color:${z.color};font-weight:600">${z.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;text-align:center;color:#ccc">${z.minutes} min</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a3a;text-align:center;color:#ccc">${z.percent}%</td>
        </tr>
      `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
      <div style="max-width:560px;margin:0 auto;padding:32px 20px">
        <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:16px;overflow:hidden;border:1px solid #2a2a4a">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:28px;text-align:center">
            <h1 style="margin:0;color:white;font-size:22px">Relatório Individual</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">${periodLabel}</p>
          </div>

          <!-- Student -->
          <div style="padding:24px;border-bottom:1px solid #2a2a4a">
            <h2 style="margin:0 0 4px;color:#e2e8f0;font-size:18px">👤 ${studentName}</h2>
            <p style="margin:0;color:#94a3b8;font-size:13px">${sessionsCount} aula${sessionsCount !== 1 ? 's' : ''} no período</p>
          </div>

          <!-- KPIs -->
          <div style="display:flex;padding:0;border-bottom:1px solid #2a2a4a">
            <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #2a2a4a">
              <div style="font-size:13px;color:#94a3b8">🔥 Calorias</div>
              <div style="font-size:24px;font-weight:700;color:#fb923c;margin-top:4px">${totalCalories}<span style="font-size:12px;color:#94a3b8"> kcal</span></div>
            </div>
            <div style="flex:1;padding:20px;text-align:center;border-right:1px solid #2a2a4a">
              <div style="font-size:13px;color:#94a3b8">🏆 Pontos</div>
              <div style="font-size:24px;font-weight:700;color:#fbbf24;margin-top:4px">${totalPoints}</div>
            </div>
            <div style="flex:1;padding:20px;text-align:center">
              <div style="font-size:13px;color:#94a3b8">⏱ Duração</div>
              <div style="font-size:24px;font-weight:700;color:#60a5fa;margin-top:4px">${totalDurationMin}<span style="font-size:12px;color:#94a3b8"> min</span></div>
            </div>
          </div>

          <!-- Zones -->
          <div style="padding:24px">
            <h3 style="margin:0 0 12px;color:#e2e8f0;font-size:15px">Distribuição por Zona</h3>
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th style="padding:8px 12px;text-align:left;color:#94a3b8;font-size:12px;border-bottom:2px solid #2a2a4a">Zona</th>
                  <th style="padding:8px 12px;text-align:center;color:#94a3b8;font-size:12px;border-bottom:2px solid #2a2a4a">Tempo</th>
                  <th style="padding:8px 12px;text-align:center;color:#94a3b8;font-size:12px;border-bottom:2px solid #2a2a4a">%</th>
                </tr>
              </thead>
              <tbody>${zoneRows}</tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="padding:16px 24px;background:#0d0d1a;text-align:center">
            <p style="margin:0;color:#64748b;font-size:11px">Enviado por Pulse Tribe Pro</p>
          </div>
        </div>
      </div>
    </body>
    </html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pulse Tribe Pro <onboarding@resend.dev>',
        to: [studentEmail],
        subject: `Relatório Individual - ${studentName}`,
        html,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error('Resend error:', result);
      return new Response(JSON.stringify({ error: result.message || 'Falha ao enviar email' }), {
        status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Erro interno' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
