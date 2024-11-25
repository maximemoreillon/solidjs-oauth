"use server"

import { randomBytes, createHash } from "crypto"
import { getRequestEvent } from "solid-js/web"
import { getSession } from "./session"

const { OAUTH_AUTHORITY = "", OAUTH_CLIENT_ID = "" } = process.env

async function getOpenIdConfig(authority: string) {
  const openIdConfig = `${authority}/.well-known/openid-configuration`
  const response = await fetch(openIdConfig)
  return await response.json()
}

const base64URLEncode = (buf: Buffer) =>
  buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")

const createVerifier = () => base64URLEncode(randomBytes(32))
const createChallenge = (verifier: string) =>
  base64URLEncode(createHash("sha256").update(verifier).digest())

const createCodVerifierAndChallenge = () => {
  const verifier = createVerifier()
  const challenge = createChallenge(verifier)
  return { verifier, challenge }
}

function getRequestUrl() {
  const event = getRequestEvent()
  if (!event) throw new Error("Event not available")
  return new URL(event.request.url)
}

function getRedirectUri(requestUrl: URL) {
  const { origin } = requestUrl
  return `${origin}/api/oauth/callback`
}

export async function getAuthUrl() {
  const requestUrl = getRequestUrl()
  const redirectUri = getRedirectUri(requestUrl)

  const { authorization_endpoint } = await getOpenIdConfig(OAUTH_AUTHORITY)
  const { challenge, verifier } = createCodVerifierAndChallenge()

  const authUrl = new URL(authorization_endpoint)
  authUrl.searchParams.append("response_type", "code")
  authUrl.searchParams.append("client_id", OAUTH_CLIENT_ID)
  authUrl.searchParams.append("scope", "openid profile")
  authUrl.searchParams.append("code_challenge_method", "S256")
  authUrl.searchParams.append("code_challenge", challenge)
  authUrl.searchParams.append("redirect_uri", redirectUri)

  // TODO: try getSession from vinxi module
  const session = await getSession()
  await session.update((d) => {
    d.code_verifier = verifier
  })

  return authUrl
}

async function getToken(token_endpoint: string) {
  const requestUrl = getRequestUrl()
  const redirect_uri = getRedirectUri(requestUrl)

  const code = requestUrl.searchParams.get("code")
  if (!code) throw new Error("Missing code")

  const session = await getSession()
  const { code_verifier } = session.data

  const tokenUrl = new URL(token_endpoint)
  const body = new URLSearchParams({
    code_verifier,
    redirect_uri,
    code,
    grant_type: "authorization_code",
    client_id: OAUTH_CLIENT_ID,
  })

  const options = {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  }

  const response = await fetch(tokenUrl, options)
  const data = await response.json()
  if (response.status !== 200) throw new Error(data)
  return data
}

async function getUserInfo(userinfo_endpoint: string, access_token: string) {
  const options = {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }

  const response = await fetch(userinfo_endpoint, options)
  return await response.json()
}

export async function oauthCallback() {
  const { token_endpoint, userinfo_endpoint } = await getOpenIdConfig(
    OAUTH_AUTHORITY
  )

  const { access_token } = await getToken(token_endpoint)
  // TODO: figure out if storing access_token in session data or not
  // TODO: figure out if getting user info here
  const userInfo = await getUserInfo(userinfo_endpoint, access_token)
}
