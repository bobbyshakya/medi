"use client"

import React from "react"
import { media } from "@wix/sdk"
import type { JSX } from "react/jsx-runtime"

interface RicosContent {
  nodes: any[]
  metadata?: any
}

interface RicosRendererProps {
  content: RicosContent | any[]
}

export function RicosRenderer({ content }: RicosRendererProps) {
  if (!content || (!content.nodes && !Array.isArray(content))) {
    return null
  }

  const nodes = content.nodes || (Array.isArray(content) ? content : [])

  if (nodes.length === 0) {
    return null
  }

  const renderNode = (node: any, index: number, isInsideList = false): React.ReactNode => {
    if (!node) return null

    // Handle paragraph nodes
    if (node.type === "PARAGRAPH" || node.paragraphData) {
      // If inside a list, we don't want the large margin-bottom that breaks the bullet layout
      const pClassName = isInsideList 
        ? "inline text-base md:text-lg text-[#241d1f] leading-relaxed" 
        : "mb-6 text-base md:text-lg text-[#241d1f] leading-relaxed"

      return (
        <p key={index} className={pClassName}>
          {node.nodes && renderNodes(node.nodes, isInsideList)}
          {node.textData && node.textData.text}
        </p>
      )
    }

    // Handle heading nodes
    if (node.type === "HEADING" || node.headingData) {
      const level = node.headingData?.level || 2
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
      const className =
        level === 1
          ? "text-2xl md:text-3xl font-bold mb-6 mt-8 text-[#241d1f]"
          : level === 2
            ? "text-xl md:text-2xl font-semibold mb-4 mt-6 text-[#241d1f]"
            : "text-lg md:text-xl font-medium mb-3 mt-4 text-[#241d1f]"

      return (
        <HeadingTag key={index} className={className}>
          {node.nodes && renderNodes(node.nodes)}
          {node.textData && node.textData.text}
        </HeadingTag>
      )
    }

    // Handle text nodes
    if (node.type === "TEXT" || node.textData) {
      const text = node.textData?.text || ""
      let className = ""

      if (node.textData?.decorations) {
        const decorations = node.textData.decorations.map((d: any) => d.type || d)
        if (decorations.includes("BOLD")) className += " font-bold"
        if (decorations.includes("ITALIC")) className += " italic"
        if (decorations.includes("UNDERLINE")) className += " underline"
      }

      return (
        <span key={index} className={className || undefined}>
          {text}
        </span>
      )
    }

    // Handle list nodes
    if (node.type === "BULLETED_LIST" || node.bulletedListData) {
      return (
        <ul key={index} className="list-disc ml-6 mb-6 space-y-2 text-[#241d1f]">
          {node.nodes && renderNodes(node.nodes, true)}
        </ul>
      )
    }

    if (node.type === "ORDERED_LIST" || node.orderedListData) {
      return (
        <ol key={index} className="list-decimal ml-6 mb-6 space-y-2 text-[#241d1f]">
          {node.nodes && renderNodes(node.nodes, true)}
        </ol>
      )
    }

    if (node.type === "LIST_ITEM" || node.listItemData) {
      return (
        <li key={index} className="text-base md:text-lg leading-relaxed pl-1">
          {node.nodes && renderNodes(node.nodes, true)}
        </li>
      )
    }

    // Handle image nodes
    if (node.type === "IMAGE" || node.imageData) {
      const imageSourceData = node.imageData?.image?.src || node.imageData?.containerData?.image?.src
      let imageSrc = ""

      if (imageSourceData && typeof imageSourceData === "object") {
        imageSrc = imageSourceData.id || imageSourceData.url || ""
      } else if (typeof imageSourceData === "string") {
        imageSrc = imageSourceData
      }

      const alt = node.imageData?.altText || "Blog Image"
      let finalImageUrl = ""

      if (imageSrc) {
        if (imageSrc.startsWith("http")) {
          finalImageUrl = imageSrc
        } else if (imageSrc.startsWith("wix:image://")) {
          try {
            const { url } = media.getImageUrl(imageSrc)
            finalImageUrl = url
          } catch {
            const match = imageSrc.match(/wix:image:\/\/v1\/([^/]+)\//)
            if (match) finalImageUrl = `https://static.wixstatic.com/media/${match[1]}`
          }
        } else {
          finalImageUrl = `https://static.wixstatic.com/media/${imageSrc}`
        }
      }

      if (finalImageUrl) {
        return (
          <div key={index} className="my-8">
            <img
              src={finalImageUrl}
              alt={alt}
              className="w-full h-auto rounded-lg shadow-sm"
              loading="lazy"
            />
            {alt && alt !== "Blog Image" && <p className="text-sm text-gray-500 text-center mt-2 italic">{alt}</p>}
          </div>
        )
      }
    }

    // Handle divider
    if (node.type === "DIVIDER" || node.dividerData) {
      return <hr key={index} className="my-8 border-gray-200" />
    }

    // Handle blockquote
    if (node.type === "BLOCKQUOTE" || node.blockquoteData) {
      return (
        <blockquote
          key={index}
          className="border-l-4 border-blue-500 pl-6 my-6 italic text-[#241d1f] bg-gray-50 py-4 rounded-r-lg"
        >
          {node.nodes && renderNodes(node.nodes)}
        </blockquote>
      )
    }

    // Handle Link
    if (node.type === "LINK" || node.linkData) {
      const href = node.linkData?.link?.url || "#"
      const target = node.linkData?.link?.target || "_self"
      return (
        <a
          key={index}
          href={href}
          target={target}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {node.nodes && renderNodes(node.nodes)}
        </a>
      )
    }

    if (node.nodes && Array.isArray(node.nodes)) {
      return <React.Fragment key={index}>{renderNodes(node.nodes, isInsideList)}</React.Fragment>
    }

    return null
  }

  const renderNodes = (nodes: any[], isInsideList = false): React.ReactNode[] => {
    if (!Array.isArray(nodes)) return []
    return nodes.map((node, index) => renderNode(node, index, isInsideList))
  }

  return <div className="rich-content-viewer">{renderNodes(nodes)}</div>
}