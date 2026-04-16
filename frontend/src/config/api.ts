/**
 * Configuração centralizada da API
 * 
 * Usa a variável de ambiente VITE_API_URL
 * - Desenvolvimento: http://localhost:4000 (via .env.local)
 * - Produção: https://finora-finance-h6z4.onrender.com (via .env)
 */

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:4000";

// Validação em desenvolvimento
if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  console.warn(
    "[API Config] VITE_API_URL não definido, usando fallback: http://localhost:4000\n" +
    "Para especificar uma URL customizada, adicione à .env.local:\nVITE_API_URL=http://seu-backend.com"
  );
}
