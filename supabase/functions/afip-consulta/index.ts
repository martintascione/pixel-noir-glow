import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { cuit } = await req.json()

    if (!cuit) {
      return new Response(
        JSON.stringify({ error: 'CUIT es requerido' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Formato del CUIT: remover guiones y espacios
    const cleanCuit = cuit.replace(/[-\s]/g, '')

    // API de AFIP para consultar datos por CUIT
    // Usando la API pública de AFIP Constancia de Inscripción
    const afipUrl = `https://soa.afip.gob.ar/sr-padron/v2/persona/${cleanCuit}`
    
    const response = await fetch(afipUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; AFIP-Consulta/1.0)'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'CUIT no encontrado en AFIP' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }
      throw new Error(`Error en AFIP: ${response.status}`)
    }

    const afipData = await response.json()

    // Mapear los datos de AFIP a nuestro formato
    const result = {
      cuit: cleanCuit,
      razonSocial: afipData.persona?.razonSocial || afipData.persona?.nombre || '',
      tipoPersona: afipData.persona?.tipoPersona || '',
      estado: afipData.persona?.estadoClave || '',
      // Agregar más campos según la respuesta de AFIP
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error consultando AFIP:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Error al consultar AFIP. Ingrese los datos manualmente.',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})