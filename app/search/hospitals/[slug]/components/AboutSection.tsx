"use client"

import Link from "next/link"
import { Inter } from "next/font/google"
import RichTextDisplay from "./RichTextDisplay"

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter"
})

const AboutSection = ({ description, hospitalName, hospitalSlug }: any) => (
  <section className={`bg-gray-50 md:p-4 p-2 first-heading rounded-xs shadow-xs w-full border border-gray-100 ${inter.variable} font-light`}>
    <RichTextDisplay htmlContent={description.html || description} />
    <div className="mt-1">
      <Link href={`/search/${hospitalSlug}`} className="border-b border-gray-600 text-gray-700 hover:text-gray-900 transition-colors">
        Read about the {hospitalName}
      </Link>
    </div>
  </section>
)

export default AboutSection