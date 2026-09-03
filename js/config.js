/**
 * config.js - Configuración de credenciales Supabase
 * 
 * Este archivo contiene las credenciales por defecto para conectarse a Supabase.
 * La Anon Key es pública por diseño (seguridad controlada por RLS en Supabase).
 * 
 * Si querés excluir este archivo del repositorio, agregalo a .gitignore
 */

window.CONFIG_SUPABASE = {
  url: 'https://hwpifwujympkjyavxzfa.supabase.co',   // ← Pegá acá tu Project URL de Supabase (ej: https://xyzcompany.supabase.co)
  key: 'sb_publishable_yFDW1xZh8K9idCqicJ_ehQ_pbrMQV12'    // ← Pegá acá tu Anon Key pública de Supabase
};
