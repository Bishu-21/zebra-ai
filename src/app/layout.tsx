import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WithContext, WebApplication, SoftwareApplication } from 'schema-dts';
import Script from 'next/script';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zebra-ai.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Zebra AI | ATS-Optimized Resume Editor',
    template: '%s | Zebra AI',
  },
  description:
    'The ultimate job acquisition engine. Zebra AI helps software engineers bypass Applicant Tracking Systems with live AI metrics and optimizations.',
  openGraph: {
    title: 'Zebra AI | ATS-Optimized Resume Editor',
    description: 'Fix your resume to beat the ATS. Live React previews and AI feedback.',
    url: baseUrl,
    siteName: 'Zebra AI',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/zebra_star.png',
    apple: '/zebra_star.png',
  },
};

const softwareSchema: WithContext<SoftwareApplication> = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Zebra AI',
  operatingSystem: 'Web',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '99.00',
    priceCurrency: 'INR',
  },
};

const webAppSchema: WithContext<WebApplication> = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Zebra AI',
  browserRequirements: 'Requires JavaScript. Works in all modern browsers.',
};

import { Providers } from '@/components/Providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased font-sans`}
      data-scroll-behavior="smooth"
    >
      <head>
        <JsonLd schema={softwareSchema} />
        <JsonLd schema={webAppSchema} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

