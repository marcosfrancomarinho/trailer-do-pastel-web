export class RestaurantDate {
  private static timeZone = 'America/Fortaleza';

  /** Agrupa pedidos pelo dia de criação no fuso horário da pastelaria. */
  public static key(value: string | Date): string {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: RestaurantDate.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const day = parts.find((part) => part.type === 'day')?.value ?? '';
    return `${year}-${month}-${day}`;
  }

  public static today(): string {
    return RestaurantDate.key(new Date());
  }
}
