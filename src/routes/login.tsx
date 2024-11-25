import { action, redirect } from "@solidjs/router"
import { getAuthUrl } from "~/lib/oauth"

const getAuthUrlAction = action(async () => {
  const authUrl = await getAuthUrl()
  throw redirect(authUrl.toString())
}, "getAuthUrl")

export default function login() {
  return (
    <>
      <h2>Login</h2>
      <form action={getAuthUrlAction} method="post">
        <button type="submit">Login</button>
      </form>
    </>
  )
}
