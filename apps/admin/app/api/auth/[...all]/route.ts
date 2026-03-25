import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@boat/db";

function getHandlers() {
  return toNextJsHandler(getAuth());
}

export async function GET(request: Request) {
  return getHandlers().GET(request);
}

export async function POST(request: Request) {
  return getHandlers().POST(request);
}

export async function PATCH(request: Request) {
  return getHandlers().PATCH(request);
}

export async function PUT(request: Request) {
  return getHandlers().PUT(request);
}

export async function DELETE(request: Request) {
  return getHandlers().DELETE(request);
}
