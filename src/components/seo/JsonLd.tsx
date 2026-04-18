import { WithContext, Thing } from 'schema-dts';

export function JsonLd({ schema }: { schema: WithContext<Thing> }) {
  const schemaWithContext = {
    '@context': 'https://schema.org',
    ...(schema as Record<string, unknown>),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWithContext) }}
    />
  );
}
