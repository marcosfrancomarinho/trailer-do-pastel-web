export interface RestaurantUser { id: string; name: string; role: 'ADMIN' | 'EMPLOYEE'; createdAt: string }

export interface CreateUserInput { name: string; password: string }
export interface RemoveUserInput { userId: string }
export type ListUsersOutput = RestaurantUser[];
