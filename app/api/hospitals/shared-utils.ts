// app/api/hospitals/shared-utils.ts
// Shared utilities for hospitals API

/**
 * Extracts plain text from rich text content.
 * @param richContent - The rich text content
 * @returns Plain text string
 */
export const extractRichText = (richContent: any): string => {
  if (!richContent) return ""
  if (typeof richContent === "string") return richContent.trim()

  if (richContent.data && richContent.data.aboutDoctor !== undefined) {
    richContent = richContent.data
  }

  try {
    if (richContent.nodes && Array.isArray(richContent.nodes)) {
      return richContent.nodes
        .map((node: any) => {
          if (node.nodes && Array.isArray(node.nodes)) {
            return node.nodes.map((child: any) => child.textData?.text || child.text || "").join("")
          }
          return node.textData?.text || node.text || ""
        })
        .filter(Boolean)
        .join("\n")
        .trim()
    }
  } catch (e) {
    console.warn("Rich text parse failed:", e)
  }

  return String(richContent).trim() || ""
}

/**
 * Extracts HTML from rich text content.
 * @param richContent - The rich text content
 * @returns HTML string
 */
export const extractRichTextHTML = (richContent: any): string => {
  if (!richContent) return ""
  if (typeof richContent === "string") return richContent

  if (richContent.data) richContent = richContent.data

  let html = ""
  try {
    if (richContent.nodes && Array.isArray(richContent.nodes)) {
      richContent.nodes.forEach((node: any) => {
        const text =
          node.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") ||
          node.textData?.text ||
          node.text ||
          ""

        switch (node.type) {
          case "PARAGRAPH":
            html += `<p>${text}</p>`
            break
          case "HEADING_ONE":
            html += `<h1>${text}</h1>`
            break
          case "HEADING_TWO":
            html += `<h2>${text}</h2>`
            break
          case "HEADING_THREE":
            html += `<h3>${text}</h3>`
            break
          case "BULLETED_LIST":
            html += "<ul>"
            node.nodes?.forEach((li: any) => {
              const liText = li.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") || ""
              html += `<li>${liText}</li>`
            })
            html += "</ul>"
            break
          case "ORDERED_LIST":
            html += "<ol>"
            node.nodes?.forEach((li: any) => {
              const liText = li.nodes?.map((n: any) => n.textData?.text || n.text || "").join("") || ""
              html += `<li>${liText}</li>`
            })
            html += "</ol>"
            break
          default:
            if (text) html += `<p>${text}</p>`
        }
      })
      return html || extractRichText(richContent)
    }
  } catch (e) {
    console.warn("HTML parse failed:", e)
  }

  return extractRichText(richContent)
}

/**
 * Gets a value from an item using multiple possible keys.
 * @param item - The item to extract from
 * @param keys - Possible keys to check
 * @returns The found value or undefined
 */
export const getValue = (item: any, ...keys: string[]): string | undefined => {
  for (const key of keys) {
    const val = item?.[key] ?? item?.data?.[key]
    if (val !== undefined && val !== null && val !== "") {
      if (typeof val === 'string') {
        return val.trim()
      }
      if (typeof val === 'object') {
        // Handle Wix CMS reference objects - try to get name/title from common fields
        const name = val.name || val.title || val.state || val.StateName || val.stateName || val['State Name'] || null
        if (name) {
          return String(name).trim()
        }
      }
      return String(val).trim()
    }
  }
  return undefined
}

/**
 * Generates a URL-friendly slug from a name string.
 * @param name - The name to convert to a slug
 * @returns The generated slug
 */
export const generateSlug = (name: string): string => {
  if (!name || typeof name !== 'string') return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}