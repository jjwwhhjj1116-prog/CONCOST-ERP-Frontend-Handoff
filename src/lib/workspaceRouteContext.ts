export function isSalesWorkspacePath(pathname: string): boolean {
  return pathname === '/sales'
    || pathname.startsWith('/sales/')
    || pathname === '/mobile/business-cards'
    || pathname.startsWith('/mobile/business-cards/');
}
