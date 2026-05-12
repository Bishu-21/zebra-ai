import { type Instrumentation } from 'next'

export async function register() {
  // Startup logic if needed
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  // Capture unhandled rejections and other server-side errors
  const message = err instanceof Error ? err.message : String(err);
  const digest = (err as any)?.digest || 'N/A';

  console.error('--- Next.js Server Error Captured ---');
  console.error('Message:', message);
  console.error('Digest:', digest);
  console.error('Path:', request.path);
  console.error('Method:', request.method);
  console.error('Context:', context.routeType, context.routerKind);
  console.error('--------------------------------------');
}

