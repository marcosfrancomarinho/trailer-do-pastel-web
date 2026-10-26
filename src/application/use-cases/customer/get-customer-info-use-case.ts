import type { CustomerInfoGateway } from '../../gateways/customer-info-gateway'
import type { GetCustomerInfoOutput } from '../../dtos/customer'

export class GetCustomerInfoUseCase {
  private customerInfo: CustomerInfoGateway

  public constructor(customerInfo: CustomerInfoGateway) {
    this.customerInfo = customerInfo
  }

  public execute(): GetCustomerInfoOutput {
    const customerInfo = this.customerInfo.get()
    return customerInfo
  }
}
