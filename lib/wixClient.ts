// lib/wixClient.ts
import { createClient, OAuthStrategy } from "@wix/sdk";
import { posts, categories } from "@wix/blog";
import { proGallery } from "@wix/pro-gallery";
import { items } from "@wix/data";
import { submissions  } from "@wix/forms";

export const wixClient = createClient({
  auth: OAuthStrategy({
    clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!, // ⚠️ must be set in .env
  }),
  
  modules: {
    posts,
    categories,
    proGallery,
    items,
    submissions ,
  },
});
