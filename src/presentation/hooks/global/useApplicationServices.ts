import { createContext, useContext } from 'react';
import type { ApplicationServices } from '../../../di/container';

export const ApplicationContext = createContext<ApplicationServices | null>(null);

export function useApplicationServices(): ApplicationServices {
  const services = useContext(ApplicationContext);
  if (!services) {
    throw new Error('useApplicationServices precisa estar dentro de ApplicationProvider.');
  }
  return services;
}
