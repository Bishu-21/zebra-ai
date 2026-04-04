import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WithContext, WebApplication, SoftwareApplication } from 'schema-dts';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const baseUrl = 'https://zebra-ai.dev';

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
};

const softwareSchema: SoftwareApplication = {
  '@type': 'SoftwareApplication',
  name: 'Zebra AI',
  operatingSystem: 'Web',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '5.00',
    priceCurrency: 'USD',
  },
};

const webAppSchema: WebApplication = {
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
    >
      <head>
        <JsonLd schema={softwareSchema} />
        <JsonLd schema={webAppSchema} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
