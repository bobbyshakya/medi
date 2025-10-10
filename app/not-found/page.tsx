"use client"

import Link from "next/link"
import { Home, Search, Phone, ArrowLeft, Heart, Stethoscope } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50  flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Medical Icon Animation */}
        <div className="relative mb-4">
          <div className="w-32 h-32 mx-auto bg-[#74BF44]/20 rounded-full flex items-center justify-center shadow-xs border border-[#74BF44]/10">
            <Stethoscope className="w-16 h-16 text-[#74BF44]" />
          </div>
         
        </div>

        {/* Error Message */}
        <div className="mb-4">
          <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-balance">Page Not Found</h2>
          <p className="text-xl text-[#241d1f] leading-relaxed mb-2">
            Oops! The page you're looking for seems to have wandered off.
          </p>
          <p className="text-lg text-gray-500">Don't worry, our medical team is here to help you find what you need.</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1  gap-6 mb-8">
          <Link
            href="/"
            className="group bg-white rounded-2xl p-6 shadow-xs border border-gray-100 hover:shadow-sm transition-all duration-200 hover:border-[#74BF44]/20"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-[#74BF44]/20 rounded-xl mb-4 mx-auto  transition-colors">
              <Home className="w-6 h-6 text-[#74BF44]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Go Home</h3>
            <p className="text-[#241d1f]">Return to our homepage and explore our medical services</p>
          </Link>

        
        </div>

      

      

      
      </div>
    </div>
  )
}
