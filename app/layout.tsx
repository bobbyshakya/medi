// app/layout.tsx
import './globals.css';
import '@/public/style.css';
import 'keen-slider/keen-slider.min.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { WixAuthProvider } from '@/components/wix-auth-provider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Metadata } from 'next';
import { defaultMetadata } from '@/app/metadata';

const inter = Inter({ subsets: ['latin'] });

// Export metadata from the configuration
export const metadata: Metadata = defaultMetadata;

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        {/* You can add additional head elements here if needed */}
      </head>
      <body className={inter.className}>
        <WixAuthProvider>
          {/* Global Scripts */}
          <Script id="gtm-script" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MNZKG23S');
            `}
          </Script>
          <Script id="clarity-script" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "t5hkqz15nw");
            `}
          </Script>

          {/* NoScript GTM */}
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-MNZKG23S"
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>

          <Header />
          {children}
          <Footer />
        </WixAuthProvider>
      </body>
    </html>
  );
}