import { assertRateLimit, getClientIpAddress } from "@boat/db";
import { headers } from "next/headers";

export async function assertPublicBookingSubmissionAccess() {
  const requestHeaders = new Headers(await headers());
  const clientIp = getClientIpAddress(requestHeaders);

  await assertRateLimit({
    scope: "public_booking_submission",
    identifier: clientIp
  });
}
