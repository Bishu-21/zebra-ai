import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Zebra AI',
    short_name: 'Zebra AI',
    description: 'Import a resume, review suggested changes for a job, and export a PDF when you are ready.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0A0A0A'
  };
}
