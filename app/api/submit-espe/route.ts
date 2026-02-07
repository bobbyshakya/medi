// /app/actions/submit-form.ts
'use server';

import { wixClient } from "@/lib/wixClient";
import { Resend } from 'resend';
import { redirect } from 'next/navigation';

interface FormData {
  fullName: string;
  applicantType: string;
  contactPerson: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  background: string;
  backgroundDescription: string;
  yearsWorking: string;
  motivation: string;
  experience: string;
  hasOffice: string;
  officeLocation: string;
  hasSmartphone: boolean;
  hasWhatsapp: boolean;
  hasEmail: boolean;
  hasInternet: boolean;
  serviceArea: string;
  agreeTerms: boolean;
  signatureName: string;
  signatureDate: string;
}

interface Attachments {
  idProof: boolean;
  cv: boolean;
  orgRegistration: boolean;
  reference: boolean;
}

export async function submitMedivisorForm(formData: FormData, attachments: Attachments) {
  try {
    console.log("[v0] Starting form submission for:", formData.fullName);
    console.log("[v0] Resend API Key configured:", !!process.env.RESEND_API_KEY);

    // Initialize Resend client
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return { ok: false, error: "RESEND_API_KEY environment variable is required" };
    }
    const resend = new Resend(resendApiKey);

    // Validation
    if (!formData.fullName?.trim()) {
      return { ok: false, error: "Full name is required" };
    }
    if (!formData.email?.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      return { ok: false, error: "Valid email is required" };
    }
    if (!formData.phone?.trim()) {
      return { ok: false, error: "Phone number is required" };
    }
    if (!formData.agreeTerms) {
      return { ok: false, error: "You must agree to the terms" };
    }
    if (!formData.signatureName?.trim()) {
      return { ok: false, error: "Signature is required" };
    }

    // Use lightboxContact06 as the collection ID
    const collectionId = "lightboxContact06";

    const nowIso = new Date().toISOString();
    const payload = {
      ...formData,
      attachments: JSON.stringify(attachments),
      source: "medivisor-application-form",
      submittedAt: nowIso,
      status: "pending",
      applicationDate: nowIso,
    };

    let wixInsertSuccess = false;
    
    // Insert into Wix CMS
    try {
      console.log("[v0] Attempting to insert into Wix CMS collection:", collectionId);
      const result = await wixClient.items.insert(collectionId, payload);
      console.log("[v0] Form submitted successfully to Wix CMS");
      wixInsertSuccess = true;
    } catch (e: any) {
      console.error("[v0] Error inserting into Wix collection:", {
        message: e?.message,
        code: e?.code,
        details: e?.details,
        stack: e?.stack
      });
      throw new Error(`Failed to save form data to Wix: ${e?.message || 'Unknown error'}`);
    }

    // Send email notification using Resend
    try {
      console.log("[v0] Attempting to send email via Resend");
      
      // Format the background for display
      const backgroundDisplay = formData.background === 'medical' ? 'Medical/Healthcare' :
        formData.background === 'church' ? 'Church/Faith-based' :
        formData.background === 'ngo' ? 'NGO/Social Work' :
        formData.background === 'community' ? 'Community Leader' :
        formData.background === 'business' ? 'Business' : 'Other';

      // Format years of experience
      const experienceDisplay = formData.yearsWorking === 'less1' ? '< 1 year' :
        formData.yearsWorking === '1-3' ? '1-3 years' :
        formData.yearsWorking === '3-5' ? '3-5 years' : '> 5 years';

      // Generate application ID
      const applicationId = Date.now().toString(36).toUpperCase();

      const emailResponse = await resend.emails.send({
        from: 'Medivisor <onboarding@resend.dev>',
        to: ['info@medivisorhealth.com'],
        replyTo: formData.email,
        subject: `New Medivisor EPSP Application from ${formData.fullName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Medivisor EPSP Application</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                font-size: 16px;
                color: #333;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .container {
                max-width: 700px;
                margin: 20px auto;
                padding: 25px;
                border: 1px solid #e0e0e0;
                border-radius: 10px;
                background: linear-gradient(to bottom, #ffffff, #f9f9f9);
              }
              .header {
                text-align: center;
                margin-bottom: 25px;
                padding-bottom: 20px;
                border-bottom: 2px solid #E22026;
              }
              .header h1 {
                color: #E22026;
                margin: 0;
                font-size: 28px;
              }
              .header p {
                color: #666;
                margin: 10px 0 0;
                font-size: 16px;
              }
              .section {
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #ddd;
                margin-bottom: 20px;
              }
              .section h2 {
                color: #E22026;
                font-size: 20px;
                margin-top: 0;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
              }
              .section h3 {
                color: #E22026;
                font-size: 18px;
                margin-top: 0;
                margin-bottom: 15px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              tr:nth-child(even) {
                background-color: #f9f9f9;
              }
              td {
                padding: 8px 0;
              }
              td:first-child {
                width: 35%;
                font-weight: bold;
                color: #555;
              }
              .motivation-box {
                background-color: #f8f8f8;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #E22026;
              }
              .experience-box {
                background-color: #f8f8f8;
                padding: 15px;
                border-radius: 5px;
              }
              .signature-box {
                background-color: #f0f7ff;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #cce5ff;
                text-align: center;
              }
              .footer {
                text-align: center;
                margin-top: 25px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #888;
                font-size: 14px;
              }
              ul {
                margin: 0;
                padding-left: 20px;
              }
              li {
                margin-bottom: 5px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Medivisor EPSP</h1>
                <p>New Application Submission</p>
              </div>
              
              <div class="section">
                <h2>Applicant Information</h2>
                <table>
                  <tr>
                    <td>Full Name:</td>
                    <td>${formData.fullName}</td>
                  </tr>
                  <tr>
                    <td>Applicant Type:</td>
                    <td>${formData.applicantType === 'individual' ? 'Individual' : 'Organization'}</td>
                  </tr>
                  ${formData.applicantType === 'organization' ? `
                  <tr>
                    <td>Contact Person:</td>
                    <td>${formData.contactPerson || 'Not provided'}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td>Email:</td>
                    <td>${formData.email}</td>
                  </tr>
                  <tr>
                    <td>WhatsApp:</td>
                    <td>${formData.whatsapp}</td>
                  </tr>
                  <tr>
                    <td>Background:</td>
                    <td>${backgroundDisplay}</td>
                  </tr>
                  <tr>
                    <td>Experience:</td>
                    <td>${experienceDisplay}</td>
                  </tr>
                </table>
              </div>
              
              <div class="section">
                <h3>Motivation</h3>
                <div class="motivation-box">
                  ${formData.motivation.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div class="signature-box">
                <p style="margin: 0; color: #004085; font-size: 14px;">
                  <strong>Submitted:</strong> ${new Date().toLocaleString()} <br>
                  <strong>Signature:</strong> ${formData.signatureName} on ${formData.signatureDate}
                </p>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;">This application was submitted via the Medivisor EPSP online form.</p>
                <p style="margin: 5px 0;">Application ID: ${applicationId}</p>
                <p style="margin: 5px 0; font-size: 12px;">You can reply directly to this email to contact the applicant.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (emailResponse.error) {
        console.error("[v0] Resend email sending failed:", emailResponse.error);
        // Don't fail the whole submission if email fails
      } else {
        console.log("[v0] Email sent successfully via Resend:", emailResponse.data?.id);
      }
      
    } catch (emailError: any) {
      console.error("[v0] Resend email sending error:", {
        message: emailError?.message,
        name: emailError?.name,
        stack: emailError?.stack
      });
      // Don't fail the whole submission if email fails
    }

    console.log("[v0] Form submission completed successfully");
    
    // Return success without redirecting - let the client handle the redirect
    return { 
      ok: true, 
      success: true,
      message: "Application submitted successfully",
      redirectUrl: "/thank-you"  // Tell client where to redirect
    };

  } catch (err: any) {
    console.error("[v0] submitMedivisorForm error:", {
      message: err?.message || String(err),
      name: err?.name,
      stack: err?.stack
    });
    return { 
      ok: false, 
      error: "Failed to submit application. Please try again or contact support." 
    };
  }
}