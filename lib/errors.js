/**
 * Classe de Erro Personalizada para o Automation Hub.
 * Permite-nos lançar erros da nossa lógica de negócio (client.js)
 * especificando um statusCode HTTP, para que o controlador (action.js)
 * possa retornar a resposta HTTP correta.
 */
export class ModuleError extends Error {
  /**
   * @param {string} message A mensagem de erro.
   * @param {number} [statusCode] O código de status HTTP (ex: 400, 401, 500). O padrão é 500.
   */
  constructor(message, statusCode = 500) {
    super(message); // Passa a mensagem para a classe Error base
    this.name = 'ModuleError';
    this.statusCode = statusCode;
  }
}