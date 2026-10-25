export class AdminSessionNotFoundError extends Error {
  public constructor() {
    super('Sessão administrativa não encontrada.');
    this.name = 'AdminSessionNotFoundError';
  }
}
