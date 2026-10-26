import type { CustomerInfo } from '../dtos/customer'

export interface CustomerInfoGateway {
  get(): CustomerInfo
  save(info: CustomerInfo): void
}
