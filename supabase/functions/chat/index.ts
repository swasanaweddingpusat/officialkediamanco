import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function buildSystemPrompt(locations: any[], programs: any[], settings: any) {
  const locationInfo = locations.map(l => {
    const parts = [`- **${l.name}**`];
    if (l.address) parts.push(`  Alamat: ${l.address}`);
    if (l.phone) parts.push(`  Telepon: ${l.phone}`);
    if (l.email) parts.push(`  Email: ${l.email}`);
    if (l.category) parts.push(`  Area: ${l.category}`);
    if (l.facilities?.length) parts.push(`  Fasilitas: ${l.facilities.join(', ')}`);
    if (l.ballroom_layout_capacity) parts.push(`  Kapasitas Ballroom: ${l.ballroom_layout_capacity}`);
    if (l.ballroom_layout_dimensions) parts.push(`  Dimensi Ballroom: ${l.ballroom_layout_dimensions}`);
    if (l.loading_area_capacity) parts.push(`  Kapasitas Loading Area: ${l.loading_area_capacity}`);
    if (l.is_coming_soon) parts.push(`  Status: Coming Soon`);
    return parts.join('\n');
  }).join('\n\n');

  const programInfo = programs.map(p => {
    const parts = [`- **${p.name}**`];
    if (p.category) parts.push(` (${p.category})`);
    if (p.description) parts.push(`: ${p.description.substring(0, 150)}`);
    return parts.join('');
  }).join('\n');

  const siteName = settings?.site_name || 'Kediaman Corp';
  const sitePhone = settings?.phone || '';
  const siteEmail = settings?.email || '';
  const siteAddress = settings?.address || '';

  return `Kamu adalah asisten virtual ${siteName}, venue operator terbaik di Indonesia. Jawab pertanyaan pengunjung dengan ramah dan informatif dalam Bahasa Indonesia.

## Informasi Perusahaan
- Nama: ${siteName}
${settings?.tagline ? `- Tagline: ${settings.tagline}` : ''}
${sitePhone ? `- Telepon: ${sitePhone}` : ''}
${siteEmail ? `- Email: ${siteEmail}` : ''}
${siteAddress ? `- Alamat Pusat: ${siteAddress}` : ''}

## Lokasi Venue Kami
${locationInfo || 'Belum ada data lokasi.'}

## Program & Layanan
${programInfo || 'Belum ada data program.'}

## Panduan Menjawab
- Jawab singkat, ramah, dan to the point (maks 3-4 kalimat)
- Gunakan data lokasi dan program di atas untuk menjawab pertanyaan spesifik
- Jika ditanya harga, katakan bahwa harga bervariasi tergantung tanggal dan kebutuhan, sarankan hubungi WhatsApp untuk penawaran
- Jika pertanyaan di luar topik venue/event, arahkan kembali ke layanan ${siteName}
- Jika user ingin booking, konsultasi detail, atau butuh bantuan manusia, sarankan untuk menghubungi via WhatsApp
- Gunakan emoji secukupnya untuk kesan ramah
- Jangan menyebut bahwa kamu adalah AI/bot kecuali ditanya langsung`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch context data in parallel
    const [locationsRes, programsRes, settingsRes] = await Promise.all([
      supabase.from('locations').select('name, address, phone, email, category, facilities, ballroom_layout_capacity, ballroom_layout_dimensions, loading_area_capacity, is_coming_soon, is_active').eq('is_active', true).order('sort_order'),
      supabase.from('programs').select('name, description, category, is_active').eq('is_active', true).order('sort_order'),
      supabase.from('site_settings').select('site_name, tagline, phone, email, address').limit(1).single(),
    ]);

    const systemPrompt = buildSystemPrompt(
      locationsRes.data || [],
      programsRes.data || [],
      settingsRes.data
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Terlalu banyak permintaan, coba lagi nanti." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Layanan chat sedang tidak tersedia." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Gagal menghubungi AI" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
