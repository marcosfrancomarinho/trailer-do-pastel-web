import { CreateOrder } from '../../validation/orders/create-order.ts';
import { OrderPayloadMapper } from '../../mappers/order-payload.ts';
import type { CustomerOrderDetails, OrderPayload, CreateOrderInput, CreateOrderOutput } from '../../dtos/orders';
import type { OrderGateway } from '../../gateways/order-gateway';
import type { OrderHistoryGateway } from '../../gateways/order-history-gateway';
import type { CustomerInfoGateway } from '../../gateways/customer-info-gateway';
import type { GetStoreStatusUseCase } from '../store/get-store-status-use-case';

export class CreateOrderUseCase {
  private orders: OrderGateway;
  private history: OrderHistoryGateway;
  private customerInfo: CustomerInfoGateway;
  private getStoreStatus: GetStoreStatusUseCase;
  private now: () => Date;

  public constructor(
    orders: OrderGateway,
    history: OrderHistoryGateway,
    customerInfo: CustomerInfoGateway,
    getStoreStatus: GetStoreStatusUseCase,
    now: () => Date = () => new Date(),
  ) {
    this.orders = orders;
    this.history = history;
    this.customerInfo = customerInfo;
    this.getStoreStatus = getStoreStatus;
    this.now = now;
  }

  public async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const validatedInput = CreateOrder.validate(input);
    const storeState = await this.getStoreStatus.execute();
    if (storeState.status === 'CLOSED') throw new Error('A loja está fechada para novos pedidos.');
    const orderData = OrderPayloadMapper.map(validatedInput.customerName, validatedInput.customerPhone, validatedInput.cart);
    const payload: OrderPayload = {
      ...orderData,
      observation: validatedInput.observation || null,
    };
    const createdAt = this.now().toISOString();
    const items = validatedInput.cart.map((item) => {
      const additions = item.additions.map((extra) => ({
        additionName: extra.addition.name,
        quantity: extra.quantity,
        unitPrice: extra.addition.price,
      }));
      return {
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.price,
        additions,
      };
    });
    const details: CustomerOrderDetails = {
      customerName: validatedInput.customerName,
      customerPhone: validatedInput.customerPhone,
      observation: payload.observation,
      createdAt,
      items,
    };
    const order = await this.orders.create(payload);
    const savedOrder = { ...order, details };
    const customerInfo = { name: validatedInput.customerName, phone: validatedInput.customerPhone };
    this.history.save(savedOrder);
    this.customerInfo.save(customerInfo);
    return order;
  }
}
