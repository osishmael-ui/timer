export interface AccountProfile {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  identityProvider: 'qithym-local-password';
  syncIdentity: {
    issuer: 'qithym-local';
    subject: string;
    syncPartition: string;
    supportedClients: Array<'web' | 'desktop' | 'mobile' | 'extension'>;
  };
}

export interface AuthSession {
  accountId: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthUser {
  profile: AccountProfile;
  session: AuthSession;
}

export interface AuthResult {
  user: AuthUser | null;
  error?: string;
}

export interface PasswordResetRequestResult {
  ok: boolean;
  message: string;
  resetUrl?: string;
  expiresAt?: string;
}

interface PasswordRecord {
  salt: string;
  hash: string;
  iterations: number;
  algorithm: 'PBKDF2-SHA-256';
}

interface ResetTokenRecord {
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

interface StoredAccount {
  profile: AccountProfile;
  password: PasswordRecord;
  resetTokens: ResetTokenRecord[];
}

const ACCOUNTS_KEY = 'qithym-accounts-v1';
const SESSION_KEY = 'qithym-auth-session-v1';
const PASSWORD_ITERATIONS = 210_000;
const SESSION_DAYS = 30;
const RESET_TOKEN_MINUTES = 30;
const encoder = new TextEncoder();

const readAccounts = (): StoredAccount[] => {
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const writeAccounts = (accounts: StoredAccount[]): void => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const validateEmail = (email: string): string | null => {
  const normalized = normalizeEmail(email);
  if (!normalized) return 'Enter an email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return 'Enter a valid email address.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 10) return 'Use at least 10 characters.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Use letters and numbers.';
  return null;
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const bufferToBase64 = (buffer: ArrayBuffer): string => bytesToBase64(new Uint8Array(buffer));

const randomToken = (bytes = 32): string => {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return bytesToBase64(values).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bufferToBase64(digest);
};

const hashPassword = async (password: string, salt?: string): Promise<PasswordRecord> => {
  const passwordSalt = salt ?? randomToken(18);
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: encoder.encode(passwordSalt),
      iterations: PASSWORD_ITERATIONS,
    },
    key,
    256,
  );

  return {
    salt: passwordSalt,
    hash: bufferToBase64(bits),
    iterations: PASSWORD_ITERATIONS,
    algorithm: 'PBKDF2-SHA-256',
  };
};

const verifyPassword = async (password: string, record: PasswordRecord): Promise<boolean> => {
  const candidate = await hashPassword(password, record.salt);
  return candidate.hash === record.hash;
};

const publicUser = (account: StoredAccount, session: AuthSession): AuthUser => ({
  profile: account.profile,
  session,
});

const createSession = (accountId: string): AuthSession => {
  const createdAt = new Date();
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return {
    accountId,
    sessionId: crypto.randomUUID(),
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
};

export const getCurrentUser = (): AuthUser | null => {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (!storedSession) return null;

    const session = JSON.parse(storedSession) as AuthSession;
    if (!session.accountId || Date.parse(session.expiresAt) <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const account = readAccounts().find((entry) => entry.profile.id === session.accountId);
    if (!account) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return publicUser(account, session);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const signUp = async (email: string, password: string, displayName: string): Promise<AuthResult> => {
  const emailError = validateEmail(email);
  if (emailError) return { user: null, error: emailError };

  const passwordError = validatePassword(password);
  if (passwordError) return { user: null, error: passwordError };

  const normalizedEmail = normalizeEmail(email);
  const accounts = readAccounts();
  if (accounts.some((account) => account.profile.email === normalizedEmail)) {
    return { user: null, error: 'An account already exists for that email.' };
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const profile: AccountProfile = {
    id,
    email: normalizedEmail,
    displayName: displayName.trim() || normalizedEmail.split('@')[0],
    createdAt: now,
    updatedAt: now,
    emailVerified: false,
    identityProvider: 'qithym-local-password',
    syncIdentity: {
      issuer: 'qithym-local',
      subject: id,
      syncPartition: `usr_${id}`,
      supportedClients: ['web', 'desktop', 'mobile', 'extension'],
    },
  };
  const account: StoredAccount = {
    profile,
    password: await hashPassword(password),
    resetTokens: [],
  };
  const session = createSession(id);

  writeAccounts([...accounts, account]);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: publicUser(account, session) };
};

export const signIn = async (email: string, password: string): Promise<AuthResult> => {
  const normalizedEmail = normalizeEmail(email);
  const account = readAccounts().find((entry) => entry.profile.email === normalizedEmail);
  if (!account || !(await verifyPassword(password, account.password))) {
    return { user: null, error: 'Email or password was not recognized.' };
  }

  const session = createSession(account.profile.id);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: publicUser(account, session) };
};

export const requestPasswordReset = async (email: string): Promise<PasswordResetRequestResult> => {
  const normalizedEmail = normalizeEmail(email);
  const accounts = readAccounts();
  const accountIndex = accounts.findIndex((entry) => entry.profile.email === normalizedEmail);

  if (accountIndex === -1) {
    return {
      ok: true,
      message: 'No local account was found for that email in this browser. This build cannot send email, so use the same browser profile where the account was created or create a new local account.',
    };
  }

  const token = randomToken(32);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + RESET_TOKEN_MINUTES * 60 * 1000);
  accounts[accountIndex] = {
    ...accounts[accountIndex],
    resetTokens: [
      ...accounts[accountIndex].resetTokens.filter((entry) => Date.parse(entry.expiresAt) > Date.now() && !entry.usedAt),
      {
        tokenHash: await sha256(token),
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        usedAt: null,
      },
    ],
  };
  writeAccounts(accounts);

  const resetUrl = `${window.location.origin}${window.location.pathname}#reset?token=${encodeURIComponent(token)}`;
  return {
    ok: true,
    message: 'Local reset link generated below. This build cannot send email, so use this verification link to reset your password.',
    resetUrl,
    expiresAt: expiresAt.toISOString(),
  };
};

export const resetPassword = async (token: string, password: string): Promise<AuthResult> => {
  const passwordError = validatePassword(password);
  if (passwordError) return { user: null, error: passwordError };

  const tokenHash = await sha256(token);
  const accounts = readAccounts();
  const accountIndex = accounts.findIndex((account) => (
    account.resetTokens.some((entry) => entry.tokenHash === tokenHash && !entry.usedAt && Date.parse(entry.expiresAt) > Date.now())
  ));

  if (accountIndex === -1) {
    return { user: null, error: 'This reset link is invalid or expired. Request a new one.' };
  }

  const now = new Date().toISOString();
  const account = accounts[accountIndex];
  const updatedAccount: StoredAccount = {
    ...account,
    profile: {
      ...account.profile,
      updatedAt: now,
    },
    password: await hashPassword(password),
    resetTokens: account.resetTokens.map((entry) => (
      entry.tokenHash === tokenHash ? { ...entry, usedAt: now } : entry
    )),
  };
  const session = createSession(account.profile.id);

  accounts[accountIndex] = updatedAccount;
  writeAccounts(accounts);
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { user: publicUser(updatedAccount, session) };
};

export const updateProfile = (accountId: string, displayName: string): AuthUser | null => {
  const accounts = readAccounts();
  const accountIndex = accounts.findIndex((account) => account.profile.id === accountId);
  const sessionUser = getCurrentUser();
  if (accountIndex === -1 || sessionUser?.profile.id !== accountId) return null;

  const updatedAccount: StoredAccount = {
    ...accounts[accountIndex],
    profile: {
      ...accounts[accountIndex].profile,
      displayName: displayName.trim() || accounts[accountIndex].profile.email.split('@')[0],
      updatedAt: new Date().toISOString(),
    },
  };
  accounts[accountIndex] = updatedAccount;
  writeAccounts(accounts);
  return publicUser(updatedAccount, sessionUser.session);
};

export const signOut = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const deleteAccount = (accountId: string): boolean => {
  const user = getCurrentUser();
  if (user?.profile.id !== accountId) return false;

  writeAccounts(readAccounts().filter((account) => account.profile.id !== accountId));
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(`qithym-state-v2:${accountId}`);
  localStorage.removeItem(`qithym-plan-v1:${accountId}`);
  return true;
};
