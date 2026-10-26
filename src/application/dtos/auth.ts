export interface SignInInput {
  name: string;
  password: string;
}
export interface SignInOutput {
  token: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
}
export type AdminSession = SignInOutput;
export type GetSessionOutput = AdminSession;
