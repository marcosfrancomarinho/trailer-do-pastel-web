export class ValidationError extends Error {
  public field: string;

  public constructor(field: string, message: string) {
    super(message);
    this.field = field;
    this.name = 'ValidationError';
  }
}
