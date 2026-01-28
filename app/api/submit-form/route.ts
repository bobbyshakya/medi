"use server"

import { wixClient } from "@/lib/wixClient"
import { Resend } from 'resend'

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY
if (!resendApiKey) {
  throw new Error("RESEND_API_KEY environment variable is required")
}
const resend = new Resend(resendApiKey)

// Simple runtime validation without external deps
function validate(input: any):
  | {
      ok: true
      data: {
        name: string
        email: string
        countryName: string
        countryCode: string
        whatsapp: string
        message: string
      }
    }
  | { ok: false; error: string } {
  const name = String(input?.name ?? "").trim()
  const email = String(input?.email ?? "").trim()
  const countryName = String(input?.countryName ?? "").trim()
  const countryCode = String(input?.countryCode ?? "").trim()
  const whatsapp = String(input?.whatsapp ?? "").trim()
  const message = String(input?.message ?? "").trim()

  if (!name) return { ok: false, error: "Please enter your name." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Please enter a valid email." }
  if (!/^\+\d{1,4}$/.test(countryCode)) return { ok: false, error: "Please enter a valid country code (e.g. +1)." }
  if (!/^\d{6,15}$/.test(whatsapp)) return { ok: false, error: "Please enter a valid WhatsApp number." }
  if (!message) return { ok: false, error: "Please enter a message." }

  return { ok: true, data: { name, email, countryName, countryCode, whatsapp, message } }
}

function toE164(countryCode: string, whatsapp: string) {
  const cc = countryCode.startsWith("+") ? countryCode : `+${countryCode}`
  const num = whatsapp.replace(/\D/g, "")
  return `${cc}${num}`
}

export async function submitContact(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = validate(input)
  if (!parsed.ok) return { ok: false, error: parsed.error }

  const { name, email, countryName, countryCode, whatsapp, message } = parsed.data
  const fullPhone = toE164(countryCode, whatsapp)

  const collectionId =
    process.env.NEXT_PUBLIC_WIX_CONTACT_COLLECTION_ID || process.env.WIX_CONTACT_COLLECTION_ID || "contactForm3"

  if (!collectionId) {
    return {
      ok: false,
      error:
        "Missing Wix CMS collection ID. Set WIX_CONTACT_COLLECTION_ID or NEXT_PUBLIC_WIX_CONTACT_COLLECTION_ID in Project Settings.",
    }
  }

  try {
    const nowIso = new Date().toISOString()
    const payload = {
      name,
      email,
      countryName,
      countryCode,
      whatsapp,
      phone: fullPhone,
      message,
      source: "contact-form",
      createdAt: nowIso,
      submissionTime: nowIso,
    }

    if (typeof (wixClient as any)?.items?.insert === "function") {
      try {
        await (wixClient as any).items.insert({
          dataCollectionId: collectionId,
          item: payload,
        })
      } catch (e: any) {
        console.log("[v0] items.insert headless signature failed, retrying legacy:", e?.message || e)
        await (wixClient as any).items.insert(collectionId, payload)
      }
    } else {
      console.log("[v0] wixClient.items.insert not available")
      throw new Error("Wix data items.insert API not available on wixClient")
    }

    // After successful Wix CMS submission, send the email via Resend
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'info@medivisorhealth.com',
        subject: `New Contact Form Submission from ${name}`,
        html: `
         <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
  <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
    <h2 style="color: #E22026; text-align: center;">New Contact Form Submission</h2>
    <p>You have a new message from your website's contact form. Here are the details:</p>
    
    <div style="background-color: #fff; padding: 15px; border-radius: 6px; border: 1px solid #ddd;">
      <p style="margin: 0 0 10px;"><strong>Name:</strong> <span style="font-weight: normal;">${name}</span></p>
      <p style="margin: 0 0 10px;"><strong>Email:</strong> <span style="font-weight: normal;">${email}</span></p>
      <p style="margin: 0 0 10px;"><strong>Country:</strong> <span style="font-weight: normal;">${countryName}</span></p>
      <p style="margin: 0 0 10px;"><strong>WhatsApp:</strong> <span style="font-weight: normal;">${fullPhone}</span></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="margin: 0 0 5px;"><strong>Message:</strong></p>
      <p style="white-space: pre-wrap; margin: 0; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">${message}</p>
    </div>
    
    <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #888;">This email was sent from your contact form.</p>
  </div>
</div>
        `,
      })
    } catch (emailError: any) {
      console.error("[v0] Resend email sending failed:", emailError)
      // We can choose to log this error but still return ok, as the primary data submission to CMS was successful.
      // Depending on the priority, you could also return an error here.
    }

    return { ok: true }
  } catch (err: any) {
    console.error("[v0] submitContact CMS error:", {
      message: err?.message || String(err),
      code: err?.code,
      details: err?.details,
    })
    return { ok: false, error: "Failed to submit. Please try again." }
  }
}