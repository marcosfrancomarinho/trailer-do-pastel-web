import type { AdminSession } from '../../application/dtos/auth';
import type { SessionGateway } from '../../application/gateways/session-gateway';

export class SessionStorageAdapter implements SessionGateway {
  private tokenKey = 'trailer-pastel-admin-session';
  private roleKey = 'trailer-admin-role';
  private nameKey = 'trailer-admin-name';

  public get(): AdminSession | null {
    try {
      const token = window.sessionStorage.getItem(this.tokenKey) ?? '';
      if (!token) return null;
      const payload = token.split('.')[1];
      if (payload) {
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const parsed = JSON.parse(window.atob(normalized)) as { exp?: number };
        if (typeof parsed.exp === 'number' && parsed.exp * 1000 <= Date.now()) {
          this.clear();
          return null;
        }
      }
      return {
        token,
        role: window.sessionStorage.getItem(this.roleKey) === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
        name: window.sessionStorage.getItem(this.nameKey) ?? '',
      };
    } catch {
      return null;
    }
  }

  public save(session: AdminSession): void {
    try {
      window.sessionStorage.setItem(this.tokenKey, session.token);
      window.sessionStorage.setItem(this.roleKey, session.role);
      window.sessionStorage.setItem(this.nameKey, session.name);
    } catch {
      // A sessão continua em memória quando o armazenamento está bloqueado.
    }
  }

  public clear(): void {
    try {
      window.sessionStorage.removeItem(this.tokenKey);
      window.sessionStorage.removeItem(this.roleKey);
      window.sessionStorage.removeItem(this.nameKey);
    } catch {
      // A sessão continua em memória quando o armazenamento está bloqueado.
    }
  }
}
