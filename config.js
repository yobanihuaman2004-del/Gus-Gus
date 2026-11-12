/*
 * Configuración pública del frontend.
 * La publishable/anon key está diseñada para usarse en el navegador.
 * NUNCA coloques aquí service_role, claves privadas ni secretos de Izipay.
 */
window.GUSGUS_CONFIG = {
  supabaseUrl: "https://zbeidmuunsmgzeuovcko.supabase.co",
  supabaseAnonKey: "sb_publishable_T54DQZRoqNG44DhoEjpDCw_ox7m7LgG",
  // Agrega aquí los correos administradores autorizados, en minúsculas.
  // La autorización real debe reforzarse también con RLS en Supabase.
  adminEmails: []
};
