import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests first
  if (req.method === "OPTIONS") {
    const reqHeaders = req.headers.get('Access-Control-Request-Headers') ?? corsHeaders["Access-Control-Allow-Headers"];
    return new Response(null, { 
      status: 200,
      headers: { 
        ...corsHeaders,
        "Access-Control-Allow-Headers": reqHeaders,
      }
    });
  }

  try {
    const { accountId } = await req.json();
    
    if (!accountId) {
      throw new Error("Account ID is required");
    }

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get account details
    const { data: account, error: accountError } = await supabaseClient
      .from("accounts")
      .select(`
        *,
        account_participants (*)
      `)
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      throw new Error("Account not found");
    }

    // Get owner details
    const { data: owner, error: ownerError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", account.owner_id)
      .single();

    if (ownerError || !owner) {
      throw new Error("Account owner not found");
    }

    // Send reminder emails to all participants
    const emailPromises = account.account_participants.map(async (participant: any) => {
      try {
        const emailResponse = await resend.emails.send({
          from: "PagaTu <recordatorios@pagatu.app>",
          to: [participant.email],
          subject: `Recordatorio: Pendiente de pago en "${account.name}"`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Recordatorio de Pago</h2>
              
              <p>Hola ${participant.name || participant.email},</p>
              
              <p>Este es un recordatorio amigable de que tienes un pago pendiente en la cuenta <strong>"${account.name}"</strong>.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Detalles de la cuenta:</h3>
                <p style="margin: 5px 0;"><strong>Nombre:</strong> ${account.name}</p>
                ${account.description ? `<p style="margin: 5px 0;"><strong>Descripción:</strong> ${account.description}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Total de la cuenta:</strong> $${account.total.toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Tu parte:</strong> $${participant.total_amount?.toLocaleString() || 'Calculando...'}</p>
                <p style="margin: 5px 0;"><strong>Pagado por:</strong> ${owner.name || owner.email}</p>
              </div>
              
              <p>Por favor, coordina el pago con ${owner.name || owner.email} a la brevedad posible.</p>
              
              <p style="color: #666; font-size: 14px;">
                Este recordatorio fue enviado por PagaTu - La forma más fácil de dividir gastos.
              </p>
            </div>
          `,
        });

        console.log(`Reminder sent to ${participant.email}:`, emailResponse);
        return { success: true, email: participant.email };
      } catch (error) {
        console.error(`Error sending reminder to ${participant.email}:`, error);
        return { success: false, email: participant.email, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return new Response(JSON.stringify({
      success: true,
      message: `Recordatorios enviados a ${successful.length} de ${results.length} participantes`,
      details: {
        successful: successful.length,
        failed: failed.length,
        results
      }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-reminder function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);