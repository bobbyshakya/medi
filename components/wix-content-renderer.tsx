import Image from "next/image"
import type { BlogPost } from "@/lib/wixapi" // Import type for BlogPost
import type { JSX } from "react" // Import JSX for type declaration

// Define the ContentBlock type from lib/wix-api.ts for local use
type ContentBlock = NonNullable<BlogPost["content"]>["document"][number]

interface WixContentRendererProps {
  contentDocument: ContentBlock[]
}

/**
 * A basic renderer for Wix's structured content (ProseMirror document).
 * This handles paragraphs, headings, text, and images.
 * For full fidelity, more block types (lists, quotes, embeds, etc.) would need to be added.
 */
const renderBlock = (block: ContentBlock, index: number): JSX.Element | null => {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={index} className="mb-4">
          {block.nodes?.map((node, i) => renderBlock(node, i))}
        </p>
      )
    case "heading":
      const HeadingTag = `h${block.attrs?.level || 2}` as keyof JSX.IntrinsicElements
      return (
        <HeadingTag key={index} className={`text-${6 - (block.attrs?.level || 2)}xl font-bold mb-4 mt-6`}>
          {block.nodes?.map((node, i) => renderBlock(node, i))}
        </HeadingTag>
      )
    case "text":
      return <span key={index}>{block.text}</span>
    case "image":
      if (block.attrs?.src) {
        return (
          <div key={index} className="my-6">
            <Image
              src={block.attrs.src || "/placeholder.svg"}
              alt={block.attrs.alt || "Blog image"}
              width={block.attrs.width || 800}
              height={block.attrs.height || 450}
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>
        )
      }
      return null
    // Add more cases for other block types as needed (e.g., 'bulletList', 'orderedList', 'listItem', 'codeBlock', 'blockquote')
    case "bulletList":
      return (
        <ul key={index} className="list-disc pl-5 mb-4">
          {block.nodes?.map((node, i) => renderBlock(node, i))}
        </ul>
      )
    case "orderedList":
      return (
        <ol key={index} className="list-decimal pl-5 mb-4">
          {block.nodes?.map((node, i) => renderBlock(node, i))}
        </ol>
      )
    case "listItem":
      return <li key={index}>{block.nodes?.map((node, i) => renderBlock(node, i))}</li>
    case "blockquote":
      return (
        <blockquote
          key={index}
          className="border-l-4 border-gray-300 pl-4 italic text-[#241d1f] dark:border-gray-600 dark:text-gray-300 my-4"
        >
          {block.nodes?.map((node, i) => renderBlock(node, i))}
        </blockquote>
      )
    case "codeBlock":
      return (
        <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm my-4">
          <code>{block.nodes?.map((node, i) => renderBlock(node, i))}</code>
        </pre>
      )
    default:
      console.warn(`Unknown Wix content block type: ${block.type}`)
      return null
  }
}

export function WixContentRenderer({ contentDocument }: WixContentRendererProps) {
  if (!contentDocument || contentDocument.length === 0) {
    return null
  }
  return (
    <div className="prose prose-gray max-w-none dark:prose-invert">
      {contentDocument.map((block, index) => renderBlock(block, index))}
    </div>
  )
}
