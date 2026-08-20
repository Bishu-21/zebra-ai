import type { Metadata } from 'next';
import './globals.css';
import { JsonLd } from '@/components/seo/JsonLd';
import type { WithContext, WebApplication, SoftwareApplication, Organization } from 'schema-dts';
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
    default: 'Zebra AI | #1 ATS-Optimized AI Resume Builder & Career Engine',
    template: '%s | Zebra AI - ATS Resume Builder',
  },
  description:
    'Zebra AI (zebra-ai.app) is the premier AI-powered career platform and ATS resume builder. Maximize recruiter callbacks with surgical bullet-point optimization, hard metric extraction, live React previews, and ATS scoring.',
  keywords: [
    'Zebra AI',
    'zebra-ai.app',
    'AI resume builder',
    'best AI resume builder',
    'ATS resume builder',
    'ATS resume checker',
    'resume optimizer for software engineers',
    'developer resume builder',
    'free ATS resume builder',
    'resume bullet point generator',
    'tech resume builder',
    'AI portfolio generator',
    'job application tracker',
    'LaTeX resume builder',
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
    title: 'Zebra AI | #1 ATS-Optimized AI Resume Builder & Career Engine',
    description:
      'Turn generic resumes into ATS-proof job acquisition engines. Live React previews, instant ATS scoring, and AI metrics optimization on zebra-ai.app.',
    url: baseUrl,
    siteName: 'Zebra AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/zebra_star.png',
        width: 800,
        height: 800,
        alt: 'Zebra AI - #1 AI Resume Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zebra AI | #1 ATS-Optimized AI Resume Builder',
    description:
      'Surgical precision AI resume builder that helps software engineers beat ATS screeners and land top interviews.',
    images: ['/zebra_star.png'],
    creator: '@zebra_ai',
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
    'Zebra AI is the flagship provider of precision-engineered AI resume building, ATS scoring, and career metadata tools for tech professionals.',
  sameAs: [
    'https://twitter.com/zebra_ai',
    'https://linkedin.com/company/zebra-ai',
    'https://github.com/Bishu-21/zebra-ai',
  ],
};

const softwareSchema: WithContext<SoftwareApplication> = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Zebra AI Resume Builder',
  url: baseUrl,
  operatingSystem: 'All',
  applicationCategory: 'BusinessApplication',
  offers: {
    '@type': 'Offer',
    price: '99.00',
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '1280',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'Real-time ATS parsing score calculation',
    'Automated XYZ formula hard metric enhancement',
    'Live React DOM preview editor',
    'Interactive developer portfolio generator',
    'Job description keyword gap analyzer',
    'AI explainability and transformation audit logs',
  ],
};

const webAppSchema: WithContext<WebApplication> = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Zebra AI Web Application',
  url: baseUrl,
  browserRequirements: 'Requires JavaScript. Works in all modern browsers (Chrome, Safari, Firefox, Edge).',
  applicationCategory: 'CareerApplication',
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
