import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// Mapa para implementar rate limiting
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

// Función de rate limiting
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxAttempts = 5;

  const record = rateLimitMap.get(ip);
  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
};

// Función para sanitizar el email
const sanitizeEmail = (email: string): string => {
  // Eliminar espacios y convertir a minúsculas
  let sanitized = email.trim().toLowerCase();
  
  // Eliminar caracteres no válidos o peligrosos
  sanitized = sanitized
    .replace(/[\x00-\x1F\x7F]/g, '') // Eliminar caracteres de control
    .replace(/[<>()[\]\\,;:/\s]/g, ''); // Eliminar caracteres especiales no permitidos
    
  return sanitized;
};

// Función para validar el email con una expresión regular más estricta y validaciones adicionales
const isValidEmail = (email: string): boolean => {
  // Verificar longitud razonable
  if (email.length > 254 || email.length < 3) return false;

  // Verificar caracteres no permitidos
  if (/[\x00-\x1F\x7F<>()[\]\\,;:/\s]/.test(email)) return false;

  // Verificar formato básico de email
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(email)) return false;

  // Verificar que el dominio tiene al menos un punto y una extensión válida
  const [localPart, domain] = email.split('@');
  if (!domain || !domain.includes('.')) return false;
  if (domain.split('.').some(part => part.length === 0)) return false;

  // Verificar longitud de las partes
  if (localPart.length > 64) return false;
  if (domain.length > 255) return false;

  return true;
};

// Headers de seguridad comunes
const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'",
  'Access-Control-Allow-Origin': process.env.PUBLIC_SITE_URL || '*'
};

// Función para logging de seguridad
const logSecurityEvent = (request: Request, email: string, event: string) => {
  const url = new URL(request.url);
  const clientAddress = url.hostname === 'localhost' ? '127.0.0.1' : url.hostname;
  
  console.log('Security event:', {
    timestamp: new Date().toISOString(),
    event,
    email,
    ip: clientAddress,
    userAgent: request.headers.get('user-agent')
  });
};

// En Astro 3.x necesitamos usar export const POST en mayúsculas
export const POST: APIRoute = async ({ request }) => {
  try {
    // Obtener IP del cliente
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Aplicar rate limiting
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({
          message: 'Too many attempts. Please try again later.'
        }),
        { 
          status: 429,
          headers: {
            ...securityHeaders,
            'Retry-After': '900' // 15 minutos en segundos
          }
        }
      );
    }

    const data = await request.json();
    const sanitizedEmail = sanitizeEmail(data.email);

    // Validación mejorada del email
    if (!sanitizedEmail || !isValidEmail(sanitizedEmail)) {
      logSecurityEvent(request, sanitizedEmail, 'invalid_email_attempt');
      return new Response(
        JSON.stringify({
          message: 'Invalid email address'
        }),
        { 
          status: 400,
          headers: securityHeaders
        }
      );
    }

    // Verificar duplicados
    const { data: existing } = await supabase
      .from('subscribers')
      .select('email')
      .eq('email', sanitizedEmail)
      .single();

    if (existing) {
      // Log del intento duplicado (solo visible en el servidor)
      logSecurityEvent(request, sanitizedEmail, 'duplicate_subscription_attempt');
      // Devolver mensaje de éxito aunque sea duplicado
      return new Response(
        JSON.stringify({
          message: 'Successfully subscribed!'
        }),
        { 
          status: 200,
          headers: securityHeaders
        }
      );
    }

    // Verificar intentos previos desde la misma IP
    let ip_address;
    
    try {
        // Intentar obtener la IP del URL de la solicitud
        const url = new URL(request.url);
        const clientAddress = url.hostname === 'localhost' ? '127.0.0.1' : url.hostname;
        ip_address = clientAddress;
        
        // Log de debug
        console.log('Request Details:', {
            url: request.url,
            method: request.method,
            hostname: url.hostname,
            detected_ip: ip_address,
            headers: Object.fromEntries(request.headers.entries())
        });
    } catch (error) {
        console.error('Error getting IP:', error);
        ip_address = 'unknown';
    }

    const user_agent = request.headers.get('user-agent') || 'unknown';
    
    // Verificar límite de intentos desde la misma IP
    const { data: recentAttempts } = await supabase
      .from('subscribers')
      .select('created_at')
      .eq('ip_address', ip_address)
      .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    if (recentAttempts && recentAttempts.length >= 5) {
      return new Response(
        JSON.stringify({
          message: 'Too many attempts from this IP. Please try again later.'
        }),
        { 
          status: 429,
          headers: {
            ...securityHeaders,
            'Retry-After': '900' // 15 minutos en segundos
          }
        }
      );
    }

    // Insertar en Supabase con sanitización
    const { error } = await supabase
      .from('subscribers')
      .insert([{ 
        email: sanitizedEmail, 
        subscribed_at: new Date(),
        ip_address,
        user_agent
      }]);

    if (error) throw error;

    logSecurityEvent(request, sanitizedEmail, 'successful_subscription');
    return new Response(
      JSON.stringify({
        message: 'Successfully subscribed!'
      }),
      { 
        status: 200,
        headers: securityHeaders
      }
    );
  } catch (error) {
    const errorData = error as Error;
    logSecurityEvent(request, 'unknown', `subscription_error: ${errorData.message}`);
    return new Response(
      JSON.stringify({
        message: 'Error subscribing. Please try again.'
      }),
      { 
        status: 500,
        headers: securityHeaders
      }
    );
  }
}
