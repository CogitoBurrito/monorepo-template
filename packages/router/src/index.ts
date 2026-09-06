import type { AppRouter } from './create-router'

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter
  }
}

export { createAppRouterFactory } from './create-router'
export type { AppRouteComponentMap, AppRouter } from './create-router'
export {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  getRouteApi,
  useRouter,
} from '@tanstack/react-router'
