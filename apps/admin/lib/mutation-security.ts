import {
  assertRateLimit,
  getClientIpAddress,
  type RateLimitScope
} from "@boat/db";
import { headers } from "next/headers";
import { requireAdminSession } from "./session";

type AdminMutationScope = Exclude<
  RateLimitScope,
  "public_booking_submission" | "admin_signin"
>;

export async function requireAdminMutationAccess(scope: AdminMutationScope) {
  const session = await requireAdminSession();
  const requestHeaders = new Headers(await headers());
  const clientIp = getClientIpAddress(requestHeaders);

  await assertRateLimit({
    scope,
    identifier: `${session.user.id}:${clientIp}`
  });

  return {
    session,
    clientIp
  };
}
