import { type Instrumentation } from 'next'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    if (connectionString) {
      try {
        const { useAzureMonitor } = await import('@azure/monitor-opentelemetry');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useAzureMonitor({
          azureMonitorExporterOptions: {
            connectionString: connectionString,
          },
        });
        console.log('--- Azure Application Insights (OpenTelemetry) Initialized ---');
      } catch (error) {
        console.error('Failed to initialize Azure Application Insights:', error);
      }
    } else {
      // Don't log a warning in local dev to keep console clean, unless explicitly needed
      if (process.env.NODE_ENV === 'production') {
        console.warn('APPLICATIONINSIGHTS_CONNECTION_STRING is missing in production.');
      }
    }
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  const message = err instanceof Error ? err.message : String(err);
  const digest = (err as { digest?: string })?.digest || 'N/A';

  console.error('--- Next.js Server Error Captured ---');
  console.error('Message:', message);
  console.error('Digest:', digest);
  console.error('Path:', request.path);
  console.error('Method:', request.method);
  console.error('Context:', context.routeType, context.routerKind);
  console.error('--------------------------------------');

  // Capture exception in Azure Monitor if initialized and in Node runtime
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    try {
      const { trace } = await import('@opentelemetry/api');
      const span = trace.getActiveSpan();
      if (span) {
        span.recordException(err instanceof Error ? err : new Error(message));
        span.setAttributes({
          'next.request.path': request.path,
          'next.request.method': request.method,
          'next.error.digest': digest,
          'next.route.type': context.routeType,
          'next.router.kind': context.routerKind
        });
      }
    } catch {
      // Fail silently to avoid infinite error loops or cluttering logs
    }
  }
}

