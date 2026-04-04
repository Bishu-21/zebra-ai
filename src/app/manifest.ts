import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zebra AI',
    short_name: 'Zebra AI',
    description: 'The ultimate AI architect blueprint for your resume. Fix your resume, beat the ATS, and get shortlisted.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0A0A0A'
  };
}
