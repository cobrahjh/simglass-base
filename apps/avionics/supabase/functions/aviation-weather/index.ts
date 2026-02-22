const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AWC_BASE = 'https://aviationweather.gov/api/data'; // FAA Aviation Weather Center

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, stations } = await req.json();

    if (!stations || !Array.isArray(stations) || stations.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'stations array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stationStr = stations.join(',');
    const results: Record<string, unknown> = {};

    // Fetch METARs
    if (type === 'metar' || type === 'all') {
      const metarRes = await fetch(
        `${AWC_BASE}/metar?ids=${stationStr}&format=json&hours=2`
      );
      if (metarRes.ok) {
        results.metars = await metarRes.json();
      } else {
        console.error('METAR fetch failed:', metarRes.status, await metarRes.text());
        results.metars = [];
      }
    }

    // Fetch TAFs
    if (type === 'taf' || type === 'all') {
      const tafRes = await fetch(
        `${AWC_BASE}/taf?ids=${stationStr}&format=json`
      );
      if (tafRes.ok) {
        results.tafs = await tafRes.json();
      } else {
        console.error('TAF fetch failed:', tafRes.status, await tafRes.text());
        results.tafs = [];
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Aviation weather error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
