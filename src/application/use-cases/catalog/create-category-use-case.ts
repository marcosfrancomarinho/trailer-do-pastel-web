import { CreateCategory } from '../../validation/catalog/create-category.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { CreateCatalogItemInput, CategoryData } from '../../dtos/catalog';
import type { SessionGateway } from '../../gateways/session-gateway';

export class CreateCategoryUseCase {
  private catalog: CatalogGateway;
  private session: SessionGateway;

  public constructor(catalog: CatalogGateway, session: SessionGateway) {
    this.catalog = catalog;
    this.session = session;
  }

  public execute(input: CreateCatalogItemInput<CategoryData>): Promise<void> {
    const validatedInput = CreateCategory.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const data = validatedInput.data;
    const createCategoryRequest = this.catalog.createCategory(token, data);
    return createCategoryRequest;
  }
}
