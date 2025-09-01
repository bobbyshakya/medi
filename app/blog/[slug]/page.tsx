// app/blog/[slug]/page.tsx
import BlogPostClientPage from "@/components/BlogPostClientPage"

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return <BlogPostClientPage slug={params.slug} />
}
