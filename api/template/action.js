import { executeAction } from '../../lib/template/client.js';
// Importa a nossa classe de erro personalizada
import { ModuleError } from '../../lib/errors.js';

/**
 * Handler de API da Vercel (Serverless Function)
 * Este é o "Controlador" inteligente.
 */
export default async function handler(req, res) {
  
  // --- 1. Validação do Método ---
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  try {
    // --- 2. Validação do Corpo (Payload) ---
    if (!req.body) {
      return res.status(400).json({ error: 'Corpo da requisição (body) está vazio ou não é JSON válido' });
    }

    // --- 3. Execução da Lógica de Negócio ---
    const result = await executeAction(req.body);

    // --- 4. Resposta de Sucesso ---
    return res.status(200).json(result);

  } catch (error) {
    // --- 5. Tratamento de Erros Inteligente ---
    
    // Verifica se é um erro conhecido (ModuleError)
    if (error instanceof ModuleError) {
      console.warn(`[template-action] Erro de Módulo (HTTP ${error.statusCode}): ${error.message}`);
      return res.status(error.statusCode).json({ 
        error: error.message 
      });
    }

    // Se for um erro inesperado e desconhecido
    console.error('[template-action] Erro interno inesperado:', error.message, error.stack);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}