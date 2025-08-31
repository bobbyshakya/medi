"use client";

import Banner from "@/components/BannerService";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define Post type
interface Post {
  _id: string;
  title: string;
  slug: string;
  firstPublishedDate?: string;
  excerpt?: string;
  content?: string;
  coverMedia?: {
    processedImageUrl?: string;
    originalImageUrl?: string;
  };
}

// Function to calculate read time
function calculateReadTime(text: string | undefined): string {
  if (!text) return "1 min read";
  const wordsPerMinute = 200;
  const plainText = text.replace(/<[^>]*>/g, "");
  const wordCount = plainText.split(/\s+/).filter((w) => w.length > 0).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes === 0 ? "1 min read" : `${minutes} min read`;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [totalPosts, setTotalPosts] = useState<number | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const postsContainerRef = useRef<HTMLDivElement>(null);

  const LIMIT = 9;

  const fetchPosts = useCallback(
    async (pageToFetch: number) => {
      setIsLoading(true);
      try {
        const offset = pageToFetch * LIMIT;

        // ✅ Call our API route instead of wixClient directly
        const res = await fetch(
          `/api/posts?limit=${LIMIT}&offset=${offset}&sort=PUBLISHED_DATE_DESC`,
          { cache: "no-store" }
        );
        const result = await res.json();

        const newPosts: Post[] = Array.isArray(result.posts) ? result.posts : [];

        setPosts(newPosts);
        setTotalPosts(result.total || 0);
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setPosts([]);
        setTotalPosts(0);
      } finally {
        setIsLoading(false);
        setInitialLoadComplete(true);
        if (postsContainerRef.current) {
          postsContainerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    },
    [LIMIT]
  );

  useEffect(() => {
    if (totalPosts !== 0 || !initialLoadComplete) {
      fetchPosts(currentPage);
    }
  }, [currentPage, fetchPosts, totalPosts, initialLoadComplete]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const totalPages = totalPosts !== null ? Math.ceil(totalPosts / LIMIT) : 0;
  const hasNextPage = currentPage < totalPages - 1;

  return (
    <>
      <div>
        <Banner
          topSpanText="Featured Insights from Our Hospital Network"
          title="Stories, Innovations, and Patient Journeys from Leading Hospitals in India"
          description="Welcome to the Medivisor India blog – your source for firsthand stories from top hospitals, expert healthcare advice, behind-the-scenes innovation, and inspiring patient experiences. Explore in-depth articles that spotlight our network’s excellence in care, technology, and treatment options across the country."
          buttonText="Browse Hospital Articles"
          buttonLink="/hospital-network/#hospital-blogs"
          bannerBgImage="bg-blogs.png"
          mainImageSrc="/about-main.png"
          mainImageAlt="Medivisor Blog – India's Top Hospitals in Focus"
        />

        <div className="py-10 bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            {initialLoadComplete && posts.length === 0 && !isLoading && (
              <p className="text-center text-gray-600 dark:text-gray-400 mt-10 text-lg">
                No blog posts found. Please check your Wix blog settings or permissions.
              </p>
            )}

            <div
              ref={postsContainerRef}
              className="grid gap-6 space-y-10 md:space-y-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {posts.map((post) => {
                const readTime = calculateReadTime(post.content);

                return (
                  <div
                    key={post._id}
                    className="flex flex-col overflow-hidden border border-gray-100 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out"
                  >
                    <Link href={`/blog/${post.slug}`} className="block">
                      <div className="relative w-full h-48 overflow-hidden">
                        {post.coverMedia?.processedImageUrl ? (
                          <img
                            src={post.coverMedia.processedImageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
                            No Media Available
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4 bg-white">
                      <div className="pb-2">
                        <div className="text-xl font-medium leading-tight">
                          <Link
                            href={`/blog/${post.slug}`}
                            className="hover:text-primary line-clamp-2 text-gray-700 transition-colors duration-200"
                          >
                            {post.title}
                          </Link>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {post.firstPublishedDate &&
                          new Date(post.firstPublishedDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                      </span>
                      <div className="flex-grow pt-2">
                        {post.excerpt && (
                          <p className="text-gray-600 text-base line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-4">
                        <span className="text-sm text-gray-600">{readTime}</span>
                        <Link href={`/blog/${post.slug}`} passHref>
                          <button className="border-gray-200 text-medium rounded-sm border px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200">
                            Read More
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isLoading && (
              <p className="text-center text-gray-600 mt-10 text-lg">
                Loading posts...
              </p>
            )}

            {posts.length > 0 && !isLoading && (
              <div className="flex justify-center text-xs items-center gap-4 mt-12">
                <button onClick={handlePreviousPage} disabled={currentPage === 0 || isLoading}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                </button>
                <span className="text-gray-700">
                  {currentPage + 1} of {totalPages || "..."}
                </span>
                <button onClick={handleNextPage} disabled={!hasNextPage || isLoading}>
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}

            {!hasNextPage && !isLoading && posts.length > 0 && (
              <p className="text-center text-gray-600 mt-10 text-lg">
                You've reached the end of the posts.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
