export class TableHasUnfinishedOrdersError extends Error {
  public count: number;

  public constructor(count: number) {
    super('A mesa possui pedidos pendentes ou em preparo.');
    this.count = count;
    this.name = 'TableHasUnfinishedOrdersError';
  }
}
