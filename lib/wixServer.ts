import { createClient, OAuthStrategy } from "@wix/sdk"
import { posts, categories } from "@wix/blog"
import { proGallery } from "@wix/pro-gallery"
import { items } from "@wix/data"
import { submissions } from "@wix/forms"

// Prefer a server-only env var if available; fall back to NEXT_PUBLIC_* to match your current setup.
const clientId = process.env.WIX_CLIENT_ID || process.env.NEXT_PUBLIC_WIX_CLIENT_ID

if (!clientId) {
  console.warn("[wix-server] Missing WIX_CLIENT_ID or NEXT_PUBLIC_WIX_CLIENT_ID. Blog fetch will fail.")
}

export const wixServerClient = createClient({
  auth: OAuthStrategy({
    clientId: clientId!,
  }),
  modules: {
    posts,
    categories,
    proGallery,
    items,
    submissions,
  },
})
