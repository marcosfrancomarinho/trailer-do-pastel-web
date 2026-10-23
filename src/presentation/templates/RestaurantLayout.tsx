import type { ReactNode } from 'react'
type Props = { children: ReactNode; header: ReactNode; footer: ReactNode }
export default function RestaurantLayout({ children, header, footer }: Props) {
  return <div className="restaurant-app min-h-screen overflow-x-hidden">{header}{children}{footer}</div>
}
