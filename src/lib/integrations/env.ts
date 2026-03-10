export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function getOptionalEnv(name: string): string | null {
  return process.env[name] || null;
}

