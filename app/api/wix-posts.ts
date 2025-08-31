import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, OAuthStrategy } from "@wix/sdk";
import { posts } from "@wix/blog";

// This creates a Wix client instance on the server side
const wixClient = createClient({
 auth: OAuthStrategy({
  clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
 }),
 modules: {
  posts,
 },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 // Set CORS headers to allow requests from your frontend domain
 res.setHeader('Access-Control-Allow-Origin', '*'); 
 res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
 res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

 // Handle preflight OPTIONS requests
 if (req.method === 'OPTIONS') {
  return res.status(200).end();
 }

 if (req.method !== 'GET') {
  return res.status(405).json({ message: 'Method Not Allowed' });
 }

 const { offset = '0', limit = '9' } = req.query;
 const offsetNum = parseInt(offset as string, 10);
 const limitNum = parseInt(limit as string, 10);

 try {
  // Use listPosts() for pagination with a paging object
  const response = await wixClient.posts.listPosts({
   paging: {
    limit: limitNum,
    offset: offsetNum
   }
  });

  const posts = response.posts || [];
  const metaData = {
   total: response.metaData?.total || 0,
  };

  return res.status(200).json({ posts, metaData });
 } catch (error) {
  console.error('Error fetching Wix posts:', error);
  return res.status(500).json({ error: 'Failed to fetch blog posts.' });
 }
}