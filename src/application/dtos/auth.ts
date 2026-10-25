export type SignInInput = { name: string; password: string };
export type SignInOutput = { token: string; name: string; role: 'ADMIN' | 'EMPLOYEE' };
export type AdminSession = SignInOutput;
