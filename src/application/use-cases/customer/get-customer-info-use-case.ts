import type { CustomerInfoGateway } from '../../gateways/customer-info-gateway'

export class GetCustomerInfoUseCase {
  private customerInfo: CustomerInfoGateway

  public constructor(customerInfo: CustomerInfoGateway) {
    this.customerInfo = customerInfo
  }

  public execute() {
    return this.customerInfo.get()
  }
}
