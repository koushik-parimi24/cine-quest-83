import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();

    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing endpoint parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) {
      return new Response(
        JSON.stringify({ error: "TMDB_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the URL
    const baseUrl = "https://api.themoviedb.org/3";
    const queryParams = new URLSearchParams({
      api_key: tmdbApiKey,
      ...(params && { [new URLSearchParams(params).keys().next().value || "query"]: params.split("=")[1] || "" }),
    });

    // Parse params properly
    let finalParams = `api_key=${tmdbApiKey}`;
    if (params) {
      finalParams += `&${params}`;
    }

    const url = `${baseUrl}${endpoint}?${finalParams}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`TMDB API Error: ${response.status}`, errorData);
      return new Response(
        JSON.stringify({ 
          error: `TMDB API returned ${response.status}`, 
          details: errorData 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in tmdb-proxy:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
