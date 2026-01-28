"use server"

import { wixClient } from "@/lib/wixClient"
import { Resend } from 'resend'

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY
if (!resendApiKey) {
  throw new Error("RESEND_API_KEY environment variable is required")
}
const resend = new Resend(resendApiKey)

// Updated validation to include new fields
function validate(input: any):
  | {
      ok: true
      data: {
        name: string
        email: string
        countryName: string
        whatsapp: string
        message: string
        appointmentDate: string
        appointmentTime: string
        appointmentVenue: string
        appointmentLocation: string
      }
    }
  | { ok: false; error: string } {
  const name = String(input?.name ?? "").trim()
  const email = String(input?.email ?? "").trim()
  const countryName = String(input?.countryName ?? "").trim()
  const whatsapp = String(input?.whatsapp ?? "").trim()
  const message = String(input?.message ?? "").trim()
  const appointmentDate = String(input?.appointmentDate ?? "").trim()
  const appointmentTime = String(input?.appointmentTime ?? "").trim()
  const appointmentVenue = String(input?.appointmentVenue ?? "").trim()
  const appointmentLocation = String(input?.appointmentLocation ?? "").trim()

  if (!name) return { ok: false, error: "Please enter your name." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Please enter a valid email." }
  if (!whatsapp) return { ok: false, error: "Please enter a valid WhatsApp number." }
  if (!appointmentDate) return { ok: false, error: "Please select an appointment date." }
  if (!appointmentTime) return { ok: false, error: "Please select an appointment time." }

  return { 
    ok: true, 
    data: { 
      name, 
      email, 
      countryName, 
      whatsapp, 
      message,
      appointmentDate,
      appointmentTime,
      appointmentVenue,
      appointmentLocation
    } 
  }
}

function toE164(whatsapp: string) {
  // Remove all non-digit characters except leading +
  const cleaned = whatsapp.replace(/\s/g, '')
  return cleaned
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const parsed = validate(body)
    if (!parsed.ok) {
      return new Response(JSON.stringify({ ok: false, error: parsed.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { 
      name, 
      email, 
      countryName, 
      whatsapp, 
      message,
      appointmentDate,
      appointmentTime,
      appointmentVenue,
      appointmentLocation
    } = parsed.data
    
    const fullPhone = toE164(whatsapp)

    const collectionId =
      process.env.NEXT_PUBLIC_WIX_CONTACT_COLLECTION_ID || process.env.WIX_CONTACT_COLLECTION_ID || "pacificpatientform"

    if (!collectionId) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Missing Wix CMS collection ID. Set WIX_CONTACT_COLLECTION_ID or NEXT_PUBLIC_WIX_CONTACT_COLLECTION_ID in Project Settings." 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const nowIso = new Date().toISOString()
      const payload = {
        name,
        email,
        countryName,
        whatsapp: fullPhone,
        phone: fullPhone,
        message,
        appointmentDate,
        appointmentTime,
        appointmentVenue,
        appointmentLocation,
        source: "registration-form",
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
          subject: `New Appointment Pacific Patient Registration from ${name}`,
          html: `
          <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
              <h2 style="color: #E22026; text-align: center;">New Appointment Registration</h2>
              <p>You have a new appointment registration from your website. Here are the details:</p>
              
              <div style="background-color: #fff; padding: 15px; border-radius: 6px; border: 1px solid #ddd;">
                <p style="margin: 0 0 10px;"><strong>Name:</strong> <span style="font-weight: normal;">${name}</span></p>
                <p style="margin: 0 0 10px;"><strong>Email:</strong> <span style="font-weight: normal;">${email}</span></p>
                <p style="margin: 0 0 10px;"><strong>Country/Location:</strong> <span style="font-weight: normal;">${appointmentLocation || countryName}</span></p>
                <p style="margin: 0 0 10px;"><strong>WhatsApp:</strong> <span style="font-weight: normal;">${fullPhone}</span></p>
                <p style="margin: 0 0 10px;"><strong>Appointment Date:</strong> <span style="font-weight: normal;">${appointmentDate}</span></p>
                <p style="margin: 0 0 10px;"><strong>Appointment Time:</strong> <span style="font-weight: normal;">${appointmentTime}</span></p>
                <p style="margin: 0 0 10px;"><strong>Venue:</strong> <span style="font-weight: normal;">${appointmentVenue || 'Not specified'}</span></p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="margin: 0 0 5px;"><strong>Additional Message:</strong></p>
                <p style="white-space: pre-wrap; margin: 0; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">${message || 'No additional message provided'}</p>
              </div>
              
              <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #888;">This email was sent from your registration form.</p>
            </div>
          </div>
          `,
        })
      } catch (emailError: any) {
        console.error("[v0] Resend email sending failed:", emailError)
        // Continue even if email fails - primary data submission was successful
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (err: any) {
      console.error("[v0] submitContact CMS error:", {
        message: err?.message || String(err),
        code: err?.code,
        details: err?.details,
      })
      
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Failed to submit. Please try again." 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error("[v0] Request parsing error:", error)
    return new Response(JSON.stringify({ 
      ok: false, 
      error: "Invalid request format" 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Keep the original function for backward compatibility
export async function submitContact(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = validate(input)
  if (!parsed.ok) return { ok: false, error: parsed.error }

  const { 
    name, 
    email, 
    countryName, 
    whatsapp, 
    message,
    appointmentDate,
    appointmentTime,
    appointmentVenue,
    appointmentLocation
  } = parsed.data
  
  const fullPhone = toE164(whatsapp)

  const collectionId =
    process.env.NEXT_PUBLIC_WIX_CONTACT_COLLECTION_ID || process.env.WIX_CONTACT_COLLECTION_ID || "pacificpatientform"

  if (!collectionId) {
    return {
      ok: false,
      error: "Missing Wix CMS collection ID. Set WIX_CONTACT_COLLECTION_ID or NEXT_PUBLIC_WIX_CONTACT_COLLECTION_ID in Project Settings.",
    }
  }

  try {
    const nowIso = new Date().toISOString()
    const payload = {
      name,
      email,
      countryName,
      whatsapp: fullPhone,
      phone: fullPhone,
      message,
      appointmentDate,
      appointmentTime,
      appointmentVenue,
      appointmentLocation,
      source: "registration-form",
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
        subject: `New Appointment Registration from ${name}`,
        html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
          <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #f9f9f9;">
            <h2 style="color: #E22026; text-align: center;">New Appointment Registration</h2>
            <p>You have a new appointment registration from your website. Here are the details:</p>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 6px; border: 1px solid #ddd;">
              <p style="margin: 0 0 10px;"><strong>Name:</strong> <span style="font-weight: normal;">${name}</span></p>
              <p style="margin: 0 0 10px;"><strong>Email:</strong> <span style="font-weight: normal;">${email}</span></p>
              <p style="margin: 0 0 10px;"><strong>Country/Location:</strong> <span style="font-weight: normal;">${appointmentLocation || countryName}</span></p>
              <p style="margin: 0 0 10px;"><strong>WhatsApp:</strong> <span style="font-weight: normal;">${fullPhone}</span></p>
              <p style="margin: 0 0 10px;"><strong>Appointment Date:</strong> <span style="font-weight: normal;">${appointmentDate}</span></p>
              <p style="margin: 0 0 10px;"><strong>Appointment Time:</strong> <span style="font-weight: normal;">${appointmentTime}</span></p>
              <p style="margin: 0 0 10px;"><strong>Venue:</strong> <span style="font-weight: normal;">${appointmentVenue || 'Not specified'}</span></p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="margin: 0 0 5px;"><strong>Additional Message:</strong></p>
              <p style="white-space: pre-wrap; margin: 0; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">${message || 'No additional message provided'}</p>
            </div>
            
            <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #888;">This email was sent from your registration form.</p>
          </div>
        </div>
        `,
      })
    } catch (emailError: any) {
      console.error("[v0] Resend email sending failed:", emailError)
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