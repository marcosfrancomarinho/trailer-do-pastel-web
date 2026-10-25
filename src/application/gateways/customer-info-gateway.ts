export type CustomerInfo = { name: string; phone: string }

export interface CustomerInfoGateway {
  get(): CustomerInfo
  save(info: CustomerInfo): void
}
