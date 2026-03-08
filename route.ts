import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const resendApiKey = process.env.RESEND_API_KEY!;

    if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
      return NextResponse.json({ error: 'Faltan variables de entorno' }, { status: 500 });
    }

    // 1. Inicializar clientes (Usamos SERVICE_ROLE para poder ver emails de usuarios)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const resend = new Resend(resendApiKey);

    // 2. Calcular la fecha objetivo (Hoy + 3 días)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const targetDay = targetDate.getDate();

    console.log(`🔍 Buscando créditos con fecha de pago el día: ${targetDay}`);

    // 3. Buscar créditos que se vencen ese día
    const { data: credits, error: creditsError } = await supabaseAdmin
      .from('credits')
      .select('*')
      .eq('payment_day', targetDay);

    if (creditsError) throw creditsError;
    
    if (!credits || credits.length === 0) {
      return NextResponse.json({ message: `No hay pagos programados para el día ${targetDay}.` });
    }

    // 4. Enviar correos
    const results = [];
    for (const credit of credits) {
      // Obtener email del usuario dueño del crédito
      const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(credit.user_id);
      
      if (user && user.email) {
        const { data, error } = await resend.emails.send({
          from: 'Finanzas <onboarding@resend.dev>', // Usa este remitente para pruebas si no tienes dominio propio
          to: [user.email],
          subject: `🔔 Recordatorio: Pago de ${credit.description} en 3 días`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h1>Recordatorio de Pago</h1>
              <p>Hola,</p>
              <p>Te recordamos que tu crédito <strong>${credit.description}</strong> (${credit.bank}) tiene una fecha de pago próxima.</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Monto a pagar:</strong> $${credit.monthly_amount}</p>
                <p style="margin: 5px 0;"><strong>Día de pago:</strong> ${credit.payment_day}</p>
              </div>
              <p>¡Evita intereses por mora pagando a tiempo!</p>
            </div>
          `
        });
        results.push({ credit: credit.description, email: user.email, status: error ? 'error' : 'sent', id: data?.id });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (error: any) {
    console.error('Error en cron job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}