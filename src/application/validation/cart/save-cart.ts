import { ValidationError } from '../../errors/validation-error.ts'
import type { CartItem } from '../../dtos/cart'

export class SaveCart {
  public static validate(items: CartItem[]): CartItem[] {
    if (!Array.isArray(items)) {
      throw new ValidationError('items', 'Carrinho deve ser uma lista.')
    }
    for (const [index, item] of items.entries()) {
      if (!item) {
        throw new ValidationError(`items[${index}]`, `Item ${index + 1}: dados não informados.`)
      }
      if (typeof item.key !== 'string') {
        throw new ValidationError(`items[${index}].key`, `Item ${index + 1}: chave deve ser um texto.`)
      }
      if (!item.key.trim()) {
        throw new ValidationError(`items[${index}].key`, `Item ${index + 1}: chave é obrigatória.`)
      }
      if (!item.product) {
        throw new ValidationError(`items[${index}].product`, `Item ${index + 1}: produto não informado.`)
      }
      if (typeof item.product.id !== 'string') {
        throw new ValidationError(`items[${index}].product.id`, `Item ${index + 1}: ID do produto deve ser um texto.`)
      }
      if (!item.product.id.trim()) {
        throw new ValidationError(`items[${index}].product.id`, `Item ${index + 1}: ID do produto é obrigatório.`)
      }
      if (typeof item.product.name !== 'string') {
        throw new ValidationError(`items[${index}].product.name`, `Item ${index + 1}: nome do produto deve ser um texto.`)
      }
      if (!item.product.name.trim()) {
        throw new ValidationError(`items[${index}].product.name`, `Item ${index + 1}: nome do produto é obrigatório.`)
      }
      if (typeof item.product.price !== 'string') {
        throw new ValidationError(`items[${index}].product.price`, `Item ${index + 1}: preço do produto deve ser um texto.`)
      }
      if (!item.product.price.trim()) {
        throw new ValidationError(`items[${index}].product.price`, `Item ${index + 1}: preço do produto é obrigatório.`)
      }
      const productPrice = Number(item.product.price)
      if (!Number.isFinite(productPrice)) {
        throw new ValidationError(`items[${index}].product.price`, `Item ${index + 1}: preço do produto deve ser numérico.`)
      }
      if (productPrice < 0) {
        throw new ValidationError(`items[${index}].product.price`, `Item ${index + 1}: preço do produto não pode ser negativo.`)
      }
      if (!Number.isSafeInteger(item.quantity)) {
        throw new ValidationError(`items[${index}].quantity`, `Item ${index + 1}: quantidade deve ser inteira.`)
      }
      if (item.quantity < 1) {
        throw new ValidationError(`items[${index}].quantity`, `Item ${index + 1}: quantidade deve ser maior que zero.`)
      }
      if (!Array.isArray(item.additions)) {
        throw new ValidationError(`items[${index}].additions`, `Item ${index + 1}: lista de adicionais inválida.`)
      }
      for (const [additionIndex, extra] of item.additions.entries()) {
        if (!extra) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}]`, `Item ${index + 1}, adicional ${additionIndex + 1}: dados não informados.`)
        }
        if (!extra.addition) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition`, `Item ${index + 1}, adicional ${additionIndex + 1}: adicional não informado.`)
        }
        if (typeof extra.addition.id !== 'string') {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition.id`, `Item ${index + 1}, adicional ${additionIndex + 1}: ID deve ser um texto.`)
        }
        if (!extra.addition.id.trim()) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition.id`, `Item ${index + 1}, adicional ${additionIndex + 1}: ID é obrigatório.`)
        }
        if (typeof extra.addition.name !== 'string') {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition.name`, `Item ${index + 1}, adicional ${additionIndex + 1}: nome deve ser um texto.`)
        }
        if (!extra.addition.name.trim()) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition.name`, `Item ${index + 1}, adicional ${additionIndex + 1}: nome é obrigatório.`)
        }
        if (typeof extra.addition.price !== 'string') {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition.price`, `Item ${index + 1}, adicional ${additionIndex + 1}: preço deve ser um texto.`)
        }
        if (!extra.addition.price.trim()) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition.price`, `Item ${index + 1}, adicional ${additionIndex + 1}: preço é obrigatório.`)
        }
        const additionPrice = Number(extra.addition.price)
        if (!Number.isFinite(additionPrice)) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition.price`, `Item ${index + 1}, adicional ${additionIndex + 1}: preço deve ser numérico.`)
        }
        if (additionPrice < 0) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].addition.price`, `Item ${index + 1}, adicional ${additionIndex + 1}: preço não pode ser negativo.`)
        }
        if (!Number.isSafeInteger(extra.quantity)) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].quantity`, `Item ${index + 1}, adicional ${additionIndex + 1}: quantidade deve ser inteira.`)
        }
        if (extra.quantity < 1) {
          throw new ValidationError(`items[${index}].additions[${additionIndex}].quantity`, `Item ${index + 1}, adicional ${additionIndex + 1}: quantidade deve ser maior que zero.`)
        }
      }
    }
    const validatedCart = items.map((item) => ({
      ...item,
      key: item.key.trim(),
      product: { ...item.product, id: item.product.id.trim(), name: item.product.name.trim(), price: item.product.price.trim() },
      additions: item.additions.map((extra) => ({
        ...extra,
        addition: { ...extra.addition, id: extra.addition.id.trim(), name: extra.addition.name.trim(), price: extra.addition.price.trim() },
      })),
    }))
    return validatedCart
  }
}
