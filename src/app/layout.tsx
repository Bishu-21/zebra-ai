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
    default: 'Zebra AI | Evidence-Based Resume Builder',
    template: '%s | Zebra AI - ATS Resume Builder',
  },
  description:
    'Build, review, and tailor evidence-based resumes with structured checks, job-description matching, live previews, and clear explanations for suggested changes.',
  keywords: [
    'Zebra AI',
    'zebra-ai.app',
    'AI resume builder',
    'ATS resume builder',
    'ATS resume checker',
    'resume optimizer for software engineers',
    'developer resume builder',
    'free ATS resume builder',
    'resume bullet point generator',
    'tech resume builder',
    'AI portfolio generator',
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
    title: 'Zebra AI | Evidence-Based Resume Builder',
    description:
      'Review resume structure, tailor content to a job description, edit with a live preview, and export a clean PDF.',
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
    title: 'Zebra AI | Evidence-Based Resume Builder',
    description:
      'Build and tailor resumes with evidence-grounded suggestions and transparent scoring.',
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
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
