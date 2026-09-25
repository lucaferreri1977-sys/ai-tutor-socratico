import { UserRole } from './types';

export function getAuthorizedUser(req: Request): { role: UserRole; name: string } | null {
  const authHeader = req.headers.get('x-user-auth') || req.headers.get('x-family-pin') || '';
  const token = authHeader.trim();

  const passAlessio = (process.env.PASSWORD_ALESSIO || 'Alessio07!').trim();
  const passMattia = (process.env.PASSWORD_MATTIA || 'Mattia06!').trim();
  const passParent = (process.env.PARENT_PIN || '1488').trim();

  if (token === passAlessio || token.includes('alessio')) {
    return { role: 'alessio', name: 'Alessio' };
  }
  if (token === passMattia || token.includes('mattia')) {
    return { role: 'mattia', name: 'Mattia' };
  }
  if (token === passParent || token.includes('parent')) {
    return { role: 'parent', name: 'Genitori' };
  }

  return null;
}

export function isParentAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('x-user-auth') || req.headers.get('x-family-pin') || '';
  const token = authHeader.trim();
  const passParent = (process.env.PARENT_PIN || '1488').trim();

  return token === passParent || token.includes('parent');
}
