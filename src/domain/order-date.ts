/** Agrupa pedidos pelo dia de criação no fuso horário da pastelaria. */
const RESTAURANT_TIME_ZONE = 'America/Fortaleza'

export function restaurantDateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const part = (name: string) => parts.find(item => item.type === name)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function todayRestaurantDate(): string {
  return restaurantDateKey(new Date())
}
