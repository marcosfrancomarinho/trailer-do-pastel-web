import type { ReactNode } from 'react';
import type { ApplicationServices } from '../../di/container';
import { ApplicationContext } from '../hooks/global/useApplicationServices';

export function ApplicationProvider({ services, children }: { services: ApplicationServices; children: ReactNode }) {
  return <ApplicationContext.Provider value={services}>{children}</ApplicationContext.Provider>;
}
