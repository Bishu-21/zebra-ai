import type { Metadata } from 'next';
import './globals.css';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WithContext, WebApplication, Organization } from 'schema-dts';
import { Providers } from '@/components/Providers';

const baseUrl = 'https://zebra-ai.app';

export const viewport: import('next').Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0A0A',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Zebra AI | Improve your resume for a specific job',
    template: '%s | Zebra AI',
  },
  description:
    'Import an existing resume, review suggested changes for a job, and export a PDF when you are ready. Credits are used for AI reviews and generation.',
  keywords: [
    'Zebra AI',
    'zebra-ai.app',
    'resume review',
    'job-specific resume editor',
    'resume PDF export',
    'job application tracker',
  ],
  authors: [{ name: 'Zebra AI Team', url: baseUrl }],
  creator: 'Zebra AI',
  publisher: 'Zebra AI',
  category: 'Career & Productivity',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Zebra AI | Improve your resume for a specific job',
    description:
      'Import an existing resume, review suggested changes for a job, and export a PDF when you are ready.',
    url: baseUrl,
    siteName: 'Zebra AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/zebra_star.png',
        width: 800,
        height: 800,
        alt: 'Zebra AI resume builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zebra AI | Improve your resume for a specific job',
    description:
      'Import an existing resume, review suggested changes for a job, and export a PDF when you are ready.',
    images: ['/zebra_star.png'],
  },
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/zebra_star.png',
    shortcut: '/zebra_star.png',
    apple: '/apple-icon.png',
  },
};

const organizationSchema: WithContext<Organization> = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Zebra AI',
  url: baseUrl,
  logo: `${baseUrl}/zebra_star.png`,
  description:
    'Zebra AI provides resume building, structured resume reviews, job-description matching, and application tracking.',
};

const webAppSchema: WithContext<WebApplication> = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Zebra AI Web Application',
  url: baseUrl,
  browserRequirements: 'Requires JavaScript. Works in all modern browsers (Chrome, Safari, Firefox, Edge).',
  applicationCategory: 'CareerApplication',
  featureList: [
    'Structured resume quality review',
    'Job description matching',
    'Evidence-grounded bullet suggestions',
    'Live resume preview and PDF export',
    'Job application tracking',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased font-sans"
      data-scroll-behavior="smooth"
    >
      <head>
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={webAppSchema} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
