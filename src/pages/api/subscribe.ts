import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// En Astro 3.x necesitamos usar export const POST en mayúsculas
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { email } = data;

    // Validación básica del email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({
          message: 'Invalid email address'
        }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Insertar en Supabase
    const { error } = await supabase
      .from('subscribers')
      .insert([{ email, subscribed_at: new Date() }]);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        message: 'Successfully subscribed!'
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: 'Error subscribing. Please try again.'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
