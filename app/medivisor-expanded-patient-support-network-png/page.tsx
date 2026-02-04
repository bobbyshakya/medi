import PngExpanded from './pngExpanded';
import { Metadata } from 'next';
import { pngExpendedMetadata } from '@/app/metadata'; // Import the specific metadata // Import the client component

// 1. ✨ EXPORT THE PAGE-SPECIFIC METADATA HERE
// This is allowed because this file is a Server Component (no "use client").
 export const metadata: Metadata = pngExpendedMetadata;

export default function Page() {
  return <PngExpanded />;
}
