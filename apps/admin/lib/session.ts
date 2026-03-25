import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@boat/db";

const getSessionState = cache(async () => {
  const session = await getAuth().api.getSession({
    headers: new Headers(await headers())
  });

  if (!session?.user || session.user.role !== "admin") {
    return null;
  }

  return session;
});

export async function getAdminSession() {
  return getSessionState();
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/signin?error=admin_required");
  }

  return session;
}

export async function redirectIfAuthenticated() {
  const session = await getAdminSession();

  if (session) {
    redirect("/");
  }
}
