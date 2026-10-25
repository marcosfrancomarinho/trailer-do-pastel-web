import { AuthHttpAdapter } from '../infrastructure/http/auth-http-adapter';
import { ApiClient } from '../infrastructure/http/api-client';
import { CatalogHttpAdapter } from '../infrastructure/http/catalog-http-adapter';
import { OrderHttpAdapter } from '../infrastructure/http/order-http-adapter';
import { StoreHttpAdapter } from '../infrastructure/http/store-http-adapter';
import { TableHttpAdapter } from '../infrastructure/http/table-http-adapter';
import { UserHttpAdapter } from '../infrastructure/http/user-http-adapter';
import { OrderHistoryStorageAdapter } from '../infrastructure/storage/order-history-adapter';
import { SessionStorageAdapter } from '../infrastructure/storage/admin-session-storage';
import { CartStorageAdapter } from '../infrastructure/storage/cart-storage';
import { CustomerInfoStorageAdapter } from '../infrastructure/storage/customer-info-storage';
import { NotificationPreferenceStorageAdapter } from '../infrastructure/storage/notification-preference-storage';
import type { AuthGateway } from '../application/gateways/auth-gateway';
import type { SessionGateway } from '../application/gateways/session-gateway';
import type { CartGateway } from '../application/gateways/cart-gateway';
import type { CustomerInfoGateway } from '../application/gateways/customer-info-gateway';
import type { NotificationPreferenceGateway } from '../application/gateways/notification-preference-gateway';
import type { CatalogGateway } from '../application/gateways/catalog-gateway';
import type { OrderGateway } from '../application/gateways/order-gateway';
import type { OrderHistoryGateway } from '../application/gateways/order-history-gateway';
import type { StoreGateway } from '../application/gateways/store-gateway';
import type { TableGateway } from '../application/gateways/table-gateway';
import type { UserGateway } from '../application/gateways/user-gateway';
import { SignInUseCase } from '../application/use-cases/auth/sign-in-use-case';
import { GetSessionUseCase } from '../application/use-cases/auth/get-session-use-case';
import { SignOutUseCase } from '../application/use-cases/auth/sign-out-use-case';
import { GetCartUseCase } from '../application/use-cases/cart/get-cart-use-case';
import { SaveCartUseCase } from '../application/use-cases/cart/save-cart-use-case';
import { AddCartItemUseCase } from '../application/use-cases/cart/add-cart-item-use-case';
import { GetCustomerInfoUseCase } from '../application/use-cases/customer/get-customer-info-use-case';
import { GetSoundPreferenceUseCase } from '../application/use-cases/notifications/get-sound-preference-use-case';
import { SetSoundPreferenceUseCase } from '../application/use-cases/notifications/set-sound-preference-use-case';
import { ListProductsUseCase } from '../application/use-cases/catalog/list-products-use-case';
import { ListCategoriesUseCase } from '../application/use-cases/catalog/list-categories-use-case';
import { ListAdditionsUseCase } from '../application/use-cases/catalog/list-additions-use-case';
import { ListProductAdditionsUseCase } from '../application/use-cases/catalog/list-product-additions-use-case';
import { ListCatalogUseCase } from '../application/use-cases/catalog/list-catalog-use-case';
import { CreateProductUseCase } from '../application/use-cases/catalog/create-product-use-case';
import { UpdateProductUseCase } from '../application/use-cases/catalog/update-product-use-case';
import { RemoveProductUseCase } from '../application/use-cases/catalog/remove-product-use-case';
import { CreateAdditionUseCase } from '../application/use-cases/catalog/create-addition-use-case';
import { UpdateAdditionUseCase } from '../application/use-cases/catalog/update-addition-use-case';
import { RemoveAdditionUseCase } from '../application/use-cases/catalog/remove-addition-use-case';
import { CreateCategoryUseCase } from '../application/use-cases/catalog/create-category-use-case';
import { UpdateCategoryUseCase } from '../application/use-cases/catalog/update-category-use-case';
import { RemoveCategoryUseCase } from '../application/use-cases/catalog/remove-category-use-case';
import { CreateOrderUseCase } from '../application/use-cases/orders/create-order-use-case';
import { CreateTableOrderUseCase } from '../application/use-cases/orders/create-table-order-use-case';
import { ListSavedOrdersUseCase } from '../application/use-cases/orders/list-saved-orders-use-case';
import { RemoveSavedOrderUseCase } from '../application/use-cases/orders/remove-saved-order-use-case';
import { ListPendingOrdersUseCase } from '../application/use-cases/orders/list-pending-orders-use-case';
import { ListPreparingOrdersUseCase } from '../application/use-cases/orders/list-preparing-orders-use-case';
import { ListOrderHistoryUseCase } from '../application/use-cases/orders/list-order-history-use-case';
import { TrackOrderUseCase } from '../application/use-cases/orders/track-order-use-case';
import { UpdateOrderStatusUseCase } from '../application/use-cases/orders/update-order-status-use-case';
import { FindCanceledTableOrdersUseCase } from '../application/use-cases/orders/find-canceled-table-orders-use-case';
import { ListTablesUseCase } from '../application/use-cases/tables/list-tables-use-case';
import { ListTableOverviewUseCase } from '../application/use-cases/tables/list-table-overview-use-case';
import { CreateTableUseCase } from '../application/use-cases/tables/create-table-use-case';
import { ArchiveTableUseCase } from '../application/use-cases/tables/archive-table-use-case';
import { ListTableOrdersUseCase } from '../application/use-cases/tables/list-table-orders-use-case';
import { ListTableSessionsUseCase } from '../application/use-cases/tables/list-table-sessions-use-case';
import { FindOrderSessionUseCase } from '../application/use-cases/tables/find-order-session-use-case';
import { ListClosedComandasUseCase } from '../application/use-cases/tables/list-closed-comandas-use-case';
import { GetTableReleaseStatusUseCase } from '../application/use-cases/tables/get-table-release-status-use-case';
import { ReleaseTableUseCase } from '../application/use-cases/tables/release-table-use-case';
import { RemoveTableOrderUseCase } from '../application/use-cases/tables/remove-table-order-use-case';
import { GetStoreStatusUseCase } from '../application/use-cases/store/get-store-status-use-case';
import { ChangeStoreStatusUseCase } from '../application/use-cases/store/change-store-status-use-case';
import { ListUsersUseCase } from '../application/use-cases/users/list-users-use-case';
import { CreateUserUseCase } from '../application/use-cases/users/create-user-use-case';
import { RemoveUserUseCase } from '../application/use-cases/users/remove-user-use-case';

export class ApplicationServices {
  private readonly apiClient = new ApiClient();
  private readonly catalogGateway: CatalogGateway = new CatalogHttpAdapter(this.apiClient);
  private readonly orderGateway: OrderGateway = new OrderHttpAdapter(this.apiClient);
  private readonly historyGateway: OrderHistoryGateway = new OrderHistoryStorageAdapter();
  private readonly tableGateway: TableGateway = new TableHttpAdapter(this.apiClient);
  private readonly storeGateway: StoreGateway = new StoreHttpAdapter(this.apiClient);
  private readonly userGateway: UserGateway = new UserHttpAdapter(this.apiClient);
  private readonly authGateway: AuthGateway = new AuthHttpAdapter(this.apiClient);
  private readonly sessionGateway: SessionGateway = new SessionStorageAdapter();
  private readonly cartGateway: CartGateway = new CartStorageAdapter();
  private readonly customerInfoGateway: CustomerInfoGateway = new CustomerInfoStorageAdapter();
  private readonly notificationGateway: NotificationPreferenceGateway = new NotificationPreferenceStorageAdapter();

  private readonly listCategories = new ListCategoriesUseCase(this.catalogGateway);
  private readonly listProducts = new ListProductsUseCase(this.catalogGateway);
  private readonly getTableReleaseStatus = new GetTableReleaseStatusUseCase(this.tableGateway, this.sessionGateway);
  private readonly listTables = new ListTablesUseCase(this.tableGateway, this.sessionGateway);
  private readonly listTableOrders = new ListTableOrdersUseCase(this.tableGateway, this.sessionGateway);
  private readonly getStoreStatus = new GetStoreStatusUseCase(this.storeGateway);

  public readonly auth = {
    signIn: new SignInUseCase(this.authGateway, this.sessionGateway),
    getSession: new GetSessionUseCase(this.sessionGateway),
    signOut: new SignOutUseCase(this.sessionGateway),
  } as const;

  public readonly cart = {
    get: new GetCartUseCase(this.cartGateway),
    save: new SaveCartUseCase(this.cartGateway),
    addItem: new AddCartItemUseCase(),
  } as const;

  public readonly customer = {
    getInfo: new GetCustomerInfoUseCase(this.customerInfoGateway),
  } as const;

  public readonly notifications = {
    getSoundPreference: new GetSoundPreferenceUseCase(this.notificationGateway),
    setSoundPreference: new SetSoundPreferenceUseCase(this.notificationGateway),
  } as const;

  public readonly catalog = {
    listCatalog: new ListCatalogUseCase(this.listCategories, this.listProducts),
    listCategories: this.listCategories,
    listProducts: this.listProducts,
    listAdditions: new ListAdditionsUseCase(this.catalogGateway),
    listProductAdditions: new ListProductAdditionsUseCase(this.catalogGateway),
    createProduct: new CreateProductUseCase(this.catalogGateway, this.sessionGateway),
    updateProduct: new UpdateProductUseCase(this.catalogGateway, this.sessionGateway),
    removeProduct: new RemoveProductUseCase(this.catalogGateway, this.sessionGateway),
    createAddition: new CreateAdditionUseCase(this.catalogGateway, this.sessionGateway),
    updateAddition: new UpdateAdditionUseCase(this.catalogGateway, this.sessionGateway),
    removeAddition: new RemoveAdditionUseCase(this.catalogGateway, this.sessionGateway),
    createCategory: new CreateCategoryUseCase(this.catalogGateway, this.sessionGateway),
    updateCategory: new UpdateCategoryUseCase(this.catalogGateway, this.sessionGateway),
    removeCategory: new RemoveCategoryUseCase(this.catalogGateway, this.sessionGateway),
  } as const;

  public readonly orders = {
    create: new CreateOrderUseCase(this.orderGateway, this.historyGateway, this.customerInfoGateway, this.getStoreStatus),
    createForTable: new CreateTableOrderUseCase(this.orderGateway, this.sessionGateway),
    listSaved: new ListSavedOrdersUseCase(this.historyGateway),
    removeSaved: new RemoveSavedOrderUseCase(this.historyGateway),
    listPending: new ListPendingOrdersUseCase(this.orderGateway, this.sessionGateway),
    listPreparing: new ListPreparingOrdersUseCase(this.orderGateway, this.sessionGateway),
    listHistory: new ListOrderHistoryUseCase(this.orderGateway, this.sessionGateway),
    track: new TrackOrderUseCase(this.orderGateway),
    updateStatus: new UpdateOrderStatusUseCase(this.orderGateway, this.sessionGateway),
    findCanceledTableOrders: new FindCanceledTableOrdersUseCase(),
  } as const;

  public readonly tables = {
    list: this.listTables,
    listOverview: new ListTableOverviewUseCase(this.listTables, this.listTableOrders),
    create: new CreateTableUseCase(this.tableGateway, this.sessionGateway),
    archive: new ArchiveTableUseCase(this.tableGateway, this.sessionGateway),
    listOrders: this.listTableOrders,
    listSessions: new ListTableSessionsUseCase(this.tableGateway, this.sessionGateway),
    findOrderSession: new FindOrderSessionUseCase(this.tableGateway, this.sessionGateway),
    listClosedComandas: new ListClosedComandasUseCase(this.tableGateway, this.sessionGateway),
    getReleaseStatus: this.getTableReleaseStatus,
    release: new ReleaseTableUseCase(this.tableGateway, this.getTableReleaseStatus, this.sessionGateway),
    removeOrder: new RemoveTableOrderUseCase(this.tableGateway, this.sessionGateway),
  } as const;

  public readonly store = {
    getStatus: this.getStoreStatus,
    changeStatus: new ChangeStoreStatusUseCase(this.storeGateway, this.sessionGateway),
  } as const;

  public readonly users = {
    list: new ListUsersUseCase(this.userGateway, this.sessionGateway),
    create: new CreateUserUseCase(this.userGateway, this.sessionGateway),
    remove: new RemoveUserUseCase(this.userGateway, this.sessionGateway),
  } as const;
}
