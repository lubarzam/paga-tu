import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://vcnaixizvhafgwoajvrx.supabase.co",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// HTML escape function to prevent injection
const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Function called with method:', req.method);
  
  // Handle CORS preflight requests first
  if (req.method === "OPTIONS") {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  console.log('Processing request...');

  try {
    // Get JWT token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error("Missing RESEND_API_KEY");
      return new Response(JSON.stringify({ success: false, error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const resend = new Resend(apiKey);

    const { accountId } = await req.json();
    
    if (!accountId) {
      throw new Error("Account ID is required");
    }

    // Create Supabase client with the user's JWT token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        auth: { 
          persistSession: false 
        },
        global: {
          headers: {
            Authorization: authHeader,
          }
        }
      }
    );

    // Get account details with RLS protection
    const { data: account, error: accountError } = await supabaseClient
      .from("accounts")
      .select(`
        *,
        account_participants (*)
      `)
      .eq("id", accountId)
      .single();

    if (accountError || !account) {
      console.error("Account access denied or not found:", accountError);
      throw new Error("Account not found or access denied");
    }

    // Use the secure RPC function to get owner payment info
    const { data: ownerInfo, error: ownerError } = await supabaseClient
      .rpc("get_owner_payment_info", { p_account_id: accountId });

    if (ownerError || !ownerInfo || ownerInfo.error) {
      console.error("Failed to get owner payment info:", ownerError || ownerInfo?.error);
      throw new Error("Failed to retrieve payment information");
    }

    const owner = ownerInfo;

    // Send reminder emails to all participants (sequentially to avoid rate limits)
    const results = [];
    for (const participant of account.account_participants) {
      try {
        console.log(`Sending reminder to ${participant.email}`);
        const emailResponse = await resend.emails.send({
          from: "PagaTu <onboarding@resend.dev>",
          to: [participant.email],
          subject: `Recordatorio: Pendiente de pago en "${account.name}"`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Recordatorio de Pago</h2>
              
              <p>Hola ${escapeHtml(participant.name || participant.email)},</p>
              
              <p>Este es un recordatorio amigable de que tienes un pago pendiente en la cuenta <strong>"${escapeHtml(account.name)}"</strong>.</p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #333;">Detalles de la cuenta:</h3>
                <p style="margin: 5px 0;"><strong>Nombre:</strong> ${escapeHtml(account.name)}</p>
                ${account.description ? `<p style="margin: 5px 0;"><strong>Descripción:</strong> ${escapeHtml(account.description)}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Total de la cuenta:</strong> $${account.total.toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Tu parte:</strong> $${participant.total_amount?.toLocaleString() || 'Calculando...'}</p>
                <p style="margin: 5px 0;"><strong>Pagado por:</strong> ${escapeHtml(owner.name || owner.email)}</p>
              </div>
              
              <p>Por favor, coordina el pago con ${escapeHtml(owner.name || owner.email)} a la brevedad posible.</p>
              
              ${owner.bank_name ? `
                <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
                  <h3 style="margin: 0 0 10px 0; color: #2e7d32;">💳 Datos para transferencia:</h3>
                  <p style="margin: 5px 0;"><strong>Banco:</strong> ${escapeHtml(owner.bank_name?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</p>
                  ${owner.account_type ? `<p style="margin: 5px 0;"><strong>Tipo de cuenta:</strong> ${escapeHtml(owner.account_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</p>` : ''}
                  ${owner.account_number ? `<p style="margin: 5px 0;"><strong>Número de cuenta:</strong> ${escapeHtml(owner.account_number)}</p>` : ''}
                  <p style="margin: 5px 0;"><strong>Titular:</strong> ${escapeHtml(owner.name || owner.email)}</p>
                  ${owner.bank_email ? `<p style="margin: 5px 0;"><strong>Email del banco:</strong> ${escapeHtml(owner.bank_email)}</p>` : ''}
                </div>
              ` : `
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <p style="margin: 0; color: #856404;">💡 <strong>Tip:</strong> ${escapeHtml(owner.name || owner.email)} puede configurar sus datos bancarios en su perfil para facilitar los pagos.</p>
                </div>
              `}
              
              <p style="color: #666; font-size: 14px;">
                Este recordatorio fue enviado por PagaTu - La forma más fácil de dividir gastos.
              </p>
            </div>
          `,
        });

        console.log(`Reminder sent to ${participant.email}:`, emailResponse);
        results.push({ success: true, email: participant.email });
        
        // Add delay between emails to respect rate limits (500ms = 2 requests per second)
        if (account.account_participants.indexOf(participant) < account.account_participants.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error sending reminder to ${participant.email}:`, error);
        results.push({ success: false, email: participant.email, error: error.message });
      }
    }
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