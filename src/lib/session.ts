import { redirect } from "@solidjs/router"
import { SessionConfig, useSession } from "vinxi/http"

const { SESSION_SECRET = "areallylongsecretthatyoushouldreplace" } = process.env

export type SessionContent = {
  user?: any
  code_verifier?: string
}

export async function getSession() {
  const config: SessionConfig = { password: SESSION_SECRET }
  return useSession(config)
}
