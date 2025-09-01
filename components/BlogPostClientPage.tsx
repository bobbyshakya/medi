"use client"


import React, { useEffect, useState } from 'react'
import { wixClient } from '../lib/wixClient'
import { media } from '@wix/sdk'
import {
  ChevronLeft,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Clock,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
} from 'lucide-react'
import { RicosRenderer } from './RichContentViewer'
import { extractTextFromRicos, type RicosContent } from '../lib/ricos-parser'

interface Post {
  _id: string
  title: string
  slug: string
  firstPublishedDate?: string
  lastPublishedDate?: string
  url?: string
  media?: {
    wixMedia?: {
      image?: string
      video?: string
    }
    embedMedia?: {
      thumbnail?: {
        url: string
        width?: number
        height?: number
      }
      video?: {
        url: string
        width?: number
        height?: number
      }
    }
    displayed?: boolean
    custom?: boolean
  }
  coverMedia?: {
    image?: string
  }
  excerpt?: string
  content?: string
  contentText?: string
  richContent?: RicosContent
  tags?: string[]
  hashtags?: string[]
  categoryIds?: string[]
  featured?: boolean
  commentingEnabled?: boolean
  minutesToRead?: number
  language?: string
  viewCount?: number
  likeCount?: number
  commentCount?: number
}

// Function to get Wix Image URL
function getWixImageUrl(wixUrl: string | undefined): string | null {
  if (!wixUrl || !wixUrl.startsWith('wix:image://')) {
    return null
  }
  try {
    const { url } = media.getImageUrl(wixUrl)
    return url
  } catch (error) {
    console.error('Error getting Wix image URL:', error)
    return null
  }
}

// Function to get YouTube embed URL
function getYouTubeEmbedUrl(youtubeUrl: string | undefined): string | null {
  if (!youtubeUrl) return null

  const regExp =
    /^(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?$/
  const match = youtubeUrl.match(regExp)

  if (match && match[1] && match[1].length === 11) {
    return `https://www.youtube.com/embed/${match[1]}?autoplay=0&modestbranding=1&rel=0`
  }
  return null
}

// Function to calculate read time
function calculateReadTime(content: string | RicosContent | undefined, minutesToRead?: number): string {
  if (minutesToRead && minutesToRead > 0) {
    return `${minutesToRead} min read`
  }

  if (!content) return 'Less than 1 min read'

  let text = ''
  if (typeof content === 'string') {
    text = content.replace(/<[^>]*>/g, '')
  } else if (content.nodes) {
    text = extractTextFromRicos(content.nodes)
  }

  const wordsPerMinute = 200
  const wordCount = text.split(/\s+/).filter((word) => word.length > 0).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return minutes === 0 ? 'Less than 1 min read' : `${minutes} min read`
}

// Function to format date
function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

interface BlogPostProps {
  slug: string
}

export default function BlogPost({ slug }: BlogPostProps) {
  const [post, setPost] = useState<Post | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const fetchPostData = async () => {
      if (!slug) {
        setError('No slug provided')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('Fetching post with slug:', slug)

        if (!wixClient.posts) {
          console.error('Error: wixClient.posts module not available')
          setError('Blog service not available. Please check configuration.')
          return
        }

        let fetchedPost: Post | null = null

        // Try multiple methods to fetch the post
        try {
          if (typeof wixClient.posts.getPostBySlug === 'function') {
            console.log('Trying getPostBySlug...')
            const response = await wixClient.posts.getPostBySlug(slug, {
              fieldsets: ['CONTENT_TEXT', 'URL', 'RICH_CONTENT'], // Include rich content
            })

            if (response.post) {
              fetchedPost = response.post as Post
              console.log('Successfully fetched post using getPostBySlug')
              console.log('Rich content:', fetchedPost.richContent)
            }
          }
        } catch (getBySlugError) {
          console.log('getPostBySlug failed, trying queryPosts:', getBySlugError)
        }

        if (!fetchedPost) {
          try {
            if (typeof wixClient.posts.queryPosts === 'function') {
              console.log('Trying queryPosts...')
              const response = await wixClient.posts.queryPosts().eq('slug', slug).find()

              if (response.items && response.items.length > 0) {
                fetchedPost = response.items[0] as Post
                console.log('Successfully fetched post using queryPosts')
              }
            }
          } catch (queryError) {
            console.error('queryPosts also failed:', queryError)
          }
        }

        if (!fetchedPost) {
          try {
            if (typeof wixClient.posts.listPosts === 'function') {
              console.log('Trying listPosts as fallback...')
              const response = await wixClient.posts.listPosts({
                paging: { limit: 100 },
              })

              const foundPost = response.posts?.find((p: any) => p.slug === slug)
              if (foundPost) {
                fetchedPost = foundPost as Post
                console.log('Successfully found post using listPosts')
              }
            }
          } catch (listError) {
            console.error('listPosts also failed:', listError)
          }
        }

        if (fetchedPost) {
          setPost(fetchedPost)

          // Fetch related posts
          try {
            let relatedPostsData: Post[] = []

            if (typeof wixClient.posts.listPosts === 'function') {
              const relatedResponse = await wixClient.posts.listPosts({
                paging: { limit: 4 },
              })
              relatedPostsData = (relatedResponse.posts || [])
                .filter((p: any) => p._id !== fetchedPost._id)
                .slice(0, 3) as Post[]
            } else if (typeof wixClient.posts.queryPosts === 'function') {
              const relatedResponse = await wixClient.posts.queryPosts().ne('_id', fetchedPost._id).limit(3).find()
              relatedPostsData = relatedResponse.items as Post[]
            }

            setRelatedPosts(relatedPostsData)
          } catch (relatedError) {
            console.error('Failed to fetch related posts:', relatedError)
          }
        } else {
          setError("Post not found. The blog post you're looking for doesn't exist or has been removed.")
        }
      } catch (err: any) {
        console.error('Failed to fetch post:', err)
        setError(`Failed to load post: ${err.message || 'Unknown error'}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPostData()
  }, [slug])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <main className="container mx-auto px-4 md:px-0 py-12">
          <div className=" mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="aspect-[16/9] bg-gray-200"></div>
                <div className="p-8 md:p-12">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <main className="container mx-auto px-4 md:px-0 py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">😞</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <p className="text-sm text-gray-500 mb-6">Slug: {slug}</p>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <main className="container mx-auto px-4 md:px-0 py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
              <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
              <p className="text-sm text-gray-500 mb-6">Slug: {slug}</p>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const embedVideoUrl = post.media?.embedMedia?.video?.url
  const embedThumbnailUrl = post.media?.embedMedia?.thumbnail?.url
  const youtubeEmbedUrl = getYouTubeEmbedUrl(embedVideoUrl)
  const imageUrl = getWixImageUrl(post.media?.wixMedia?.image || post.coverMedia?.image)
  const readTime = calculateReadTime(post.richContent || post.contentText || post.content, post.minutesToRead)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <main className="container mx-auto px-4 md:px-0 py-8 md:py-12">
        <div className=" mx-auto">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Blog
            </button>
          </nav>

          {/* Main Article */}
          <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Hero Media */}
            {(youtubeEmbedUrl || embedVideoUrl || imageUrl) && (
              <div className="aspect-[16/9] relative overflow-hidden">
                {youtubeEmbedUrl ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={youtubeEmbedUrl}
                    title={post.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : embedVideoUrl ? (
                  <video
                    src={embedVideoUrl}
                    poster={embedThumbnailUrl}
                    controls
                    className="w-full h-full object-cover"
                    aria-label={`Play video for ${post.title}`}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
            )}

            <div className="p-8 md:p-12">
              {/* Article Header */}
              <header className="mb-8">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  {post.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.firstPublishedDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{readTime}</span>
                  </div>
                  {post.viewCount && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{post.viewCount.toLocaleString()} views</span>
                    </div>
                  )}
                </div>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-xl text-gray-700 leading-relaxed mb-8 font-light">
                    {post.excerpt}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 ${
                      isLiked
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likeCount ? post.likeCount + (isLiked ? 1 : 0) : isLiked ? 1 : 0}</span>
                  </button>

                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 ${
                      isBookmarked
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    <span>Save</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>

                  {post.commentingEnabled && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-gray-50 border-gray-200 text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentCount || 0} comments</span>
                    </div>
                  )}
                </div>
              </header>

              {/* Article Content */}
              <div className="prose prose-lg max-w-none">
                {post.richContent ? (
                  <RicosRenderer content={post.richContent} />
                ) : post.content ? (
                  <div dangerouslySetInnerHTML={{ __html: post.content }} />
                ) : post.contentText ? (
                  <div className="whitespace-pre-wrap text-lg text-gray-700 leading-relaxed">{post.contentText}</div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📝</span>
                    </div>
                    <p className="text-gray-600 italic text-lg">No content available for this post.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 mt-12 pt-8">
                {/* Tags */}
                {(post.tags || post.hashtags) && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {[...(post.tags || []), ...(post.hashtags || [])].map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Sharing */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Facebook</span>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                    >
                      <Twitter className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Twitter</span>
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">Copy Link</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => {
                  const relatedImageUrl = getWixImageUrl(
                    relatedPost.media?.wixMedia?.image || relatedPost.coverMedia?.image
                  )
                  return (
                    <div
                      key={relatedPost._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                    >
                      <button
                        onClick={() => window.location.href = `/blog/${relatedPost.slug}`}
                        className="block w-full text-left"
                      >
                        {relatedImageUrl && (
                          <div className="aspect-[16/9] overflow-hidden">
                            <img
                              src={relatedImageUrl}
                              alt={relatedPost.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                            {relatedPost.title}
                          </h3>
                          {relatedPost.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-3 mb-4">{relatedPost.excerpt}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatDate(relatedPost.firstPublishedDate)}</span>
                            <span>
                              {calculateReadTime(
                                relatedPost.richContent || relatedPost.contentText,
                                relatedPost.minutesToRead
                              )}
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}