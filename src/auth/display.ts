import type { AuthUser } from './authStorage';

export const getUserInitials = (user: AuthUser): string => (
  (user.profile.displayName || user.profile.email)
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'Q'
);
