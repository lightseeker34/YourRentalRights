import { lazy, ComponentType } from 'react';

type LazyComponentWithPreload<T extends ComponentType<any>> = React.LazyExoticComponent<T> & {
  preload: () => Promise<{ default: T }>;
};

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyComponentWithPreload<T> {
  const LazyComponent = lazy(factory) as LazyComponentWithPreload<T>;
  LazyComponent.preload = factory;
  return LazyComponent;
}
