import { toNextJsHandler } from "better-auth/next-js";
import {
  assertRateLimit,
  getAuth,
  getClientIpAddress,
  RateLimitExceededError
} from "@boat/db";

function getHandlers() {
  return toNextJsHandler(getAuth());
}

function withNoStore(response: Response) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function isSignInRequest(request: Request): boolean {
  const pathname = new URL(request.url).pathname;

  return pathname.includes("/sign-in");
}

async function handleAuthRequest(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  request: Request
) {
  try {
    if (method === "POST" && isSignInRequest(request)) {
      await assertRateLimit({
        scope: "admin_signin",
        identifier: getClientIpAddress(request.headers)
      });
    }

    return withNoStore(await getHandlers()[method](request));
  } catch (error) {
    if (error instanceof RateLimitExceededError) {
      return Response.json(
        {
          message:
            "Too many sign-in attempts. Please wait a few minutes and try again."
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store"
          }
        }
      );
    }

    console.error("Unexpected admin auth route failure", error);

    return Response.json(
      {
        message: "Admin authentication is temporarily unavailable."
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}

export async function GET(request: Request) {
  return handleAuthRequest("GET", request);
}

export async function POST(request: Request) {
  return handleAuthRequest("POST", request);
}

export async function PATCH(request: Request) {
  return handleAuthRequest("PATCH", request);
}

export async function PUT(request: Request) {
  return handleAuthRequest("PUT", request);
}

export async function DELETE(request: Request) {
  return handleAuthRequest("DELETE", request);
}
