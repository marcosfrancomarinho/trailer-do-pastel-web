export type RestaurantUser = { id: string; name: string; role: 'ADMIN' | 'EMPLOYEE'; createdAt: string };

export type CreateUserInput = { name: string; password: string };
export type RemoveUserInput = { userId: string };
