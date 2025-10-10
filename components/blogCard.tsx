import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/wixapi"

interface BlogCardProps {
  title: string
  slug: string
  publishedDate: string
  imageUrl?: string
  imageAlt?: string
  excerpt?: string
}

export function BlogCard({ title, slug, publishedDate, imageUrl, imageAlt, excerpt }: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="block h-full">
      <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-lg">
        {imageUrl && (
          <div className="relative w-full h-48">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={imageAlt || title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority // Prioritize loading for better LCP on blog listing
            />
          </div>
        )}
        <CardHeader className="flex-grow">
          <CardTitle className="text-xl font-bold leading-tight">{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">{formatDate(publishedDate)}</CardDescription>
        </CardHeader>
        {excerpt && (
          <CardContent>
            <p className="text-sm text-[#241d1f] dark:text-gray-400 line-clamp-3">{excerpt}</p>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}
