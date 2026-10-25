import { UpdateCategory } from '../../validation/catalog/update-category.ts';
import { AdminSessionNotFoundError } from '../../errors/admin-session-not-found-error.ts';
import type { CatalogGateway } from '../../gateways/catalog-gateway';
import type { UpdateCatalogItemInput, CategoryData } from '../../dtos/catalog';
import type { SessionGateway } from '../../gateways/session-gateway';

export class UpdateCategoryUseCase {
  private catalog: CatalogGateway;
  private session: SessionGateway;

  public constructor(catalog: CatalogGateway, session: SessionGateway) {
    this.catalog = catalog;
    this.session = session;
  }

  public execute(input: UpdateCatalogItemInput<CategoryData>) {
    const validatedInput = UpdateCategory.validate(input);
    const currentSession = this.session.get();
    if (!currentSession) {
      throw new AdminSessionNotFoundError();
    }
    const token = currentSession.token;
    const id = validatedInput.id;
    const data = validatedInput.data;
    return this.catalog.updateCategory(id, token, data);
  }
}
