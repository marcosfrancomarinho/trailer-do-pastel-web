export class BrazilianDate {
  public static format(isoDate: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
  }

  public static mask(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
  }

  public static parse(value: string, maxDate: string): string | null {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    if (year < 1000 || month < 1 || month > 12 || day < 1 || day > daysInMonth) return null;

    const isoDate = `${match[3]}-${match[2]}-${match[1]}`;
    return isoDate <= maxDate ? isoDate : null;
  }
}
