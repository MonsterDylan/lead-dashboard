import { cookies } from "next/headers";

const TOKEN_NAME = "dash_token";
const EXPECTED = process.env.DASHBOARD_PASSWORD ?? "leadpurchasing2026";

function hash(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(31, h) + value.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

const VALID_HASH = hash(EXPECTED);

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(TOKEN_NAME)?.value === VALID_HASH;
}

export function verifyPassword(password: string): boolean {
  return password === EXPECTED;
}

export { TOKEN_NAME, VALID_HASH };
