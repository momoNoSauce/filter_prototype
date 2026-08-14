import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * HTTP Basic Auth over the whole deployment, so the prototype can be handed to
 * stakeholders by link without being open to the web.
 *
 * `proxy.ts`, not `middleware.ts` — the middleware convention is deprecated in
 * Next 16 and renamed to proxy. Same behaviour, different file and export name.
 *
 * **Why this and not Vercel's own password protection:** that is Pro-only. The
 * API refuses it on this team with `Advanced Deployment Protection is not
 * enabled`. Vercel SSO already covers the raw `*-hash.vercel.app` deployment
 * URLs, but not the production alias — which is exactly the link that gets
 * shared, so that alias was the open door this closes.
 *
 * **Localhost is never challenged.** The gate keys off `VERCEL`, which the
 * platform sets to `"1"` on its builds and runtime and which simply does not
 * exist on your machine. Deliberately not `NODE_ENV`: a local `next build &&
 * next start` is production too, and prompting there would be exactly the
 * interruption this is meant to avoid.
 *
 * **No `matcher`, so this runs on every request** — pages, `_next` chunks and
 * everything in `public/`. That is the intent: a gate that lets the assets
 * through is not a gate. It costs nothing in practice, because a browser
 * re-sends Basic credentials on same-origin subrequests once it has them.
 *
 * **The username is ignored, and empty is the intended input.** Only the
 * password is compared. One secret is one thing to pass along, and a username
 * nobody verifies is just a field people get wrong. A blank username sends
 * `:password`, which is the ordinary case here rather than an edge one; a
 * header carrying no colon at all is read as password-only too, so a
 * hand-rolled client can't trip on it.
 *
 * What this cannot do is remove the username *box*. Basic Auth's browser dialog
 * always draws both fields — only a custom HTML form plus a cookie would show
 * one. Tell people to leave it blank and press enter.
 */

const REALM = "SOLV filter prototype";

/** Compares without an early exit, so timing can't be used to guess the secret. */
function matches(candidate: string, expected: string) {
  if (candidate.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

function challenge() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"` },
  });
}

export function proxy(request: NextRequest) {
  if (process.env.VERCEL !== "1") return NextResponse.next();

  const expected = process.env.SITE_PASSWORD;

  // Fails closed, and loudly. Letting requests through when the secret is
  // missing would leave the site quietly public with nothing on screen to say
  // so — the one failure mode worth being noisy about.
  if (!expected) {
    return new NextResponse(
      "This deployment has no SITE_PASSWORD configured, so it is refusing all traffic.",
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return challenge();

  let decoded: string;
  try {
    // Via bytes rather than `atob` alone: `atob` yields latin1, so a password
    // with any non-ASCII character would never compare equal.
    const binary = atob(header.slice("Basic ".length).trim());
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    decoded = new TextDecoder().decode(bytes);
  } catch {
    return challenge();
  }

  // Everything after the first colon. A blank username gives ":password", the
  // expected shape here; no colon at all is taken as the password alone.
  const separator = decoded.indexOf(":");
  const password = separator < 0 ? decoded : decoded.slice(separator + 1);

  return matches(password, expected) ? NextResponse.next() : challenge();
}
