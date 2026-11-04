import "server-only";
import { cookies } from "next/headers";
import { isHttpsRequest } from "./http";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, signSession, verifySession } from "./session";

export async function isAdmin() {
  const store = await cookies();
  return verifySession(store.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Chưa đăng nhập quản trị");
}

export async function startAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, signSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttpsRequest(),
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
}

export async function endAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
