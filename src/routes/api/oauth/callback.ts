import { redirect } from "@solidjs/router"
import type { APIEvent } from "@solidjs/start/server"
import { oauthCallback } from "~/lib/oauth"

export async function GET(event: APIEvent) {
  await oauthCallback()
  return redirect("/")
}
