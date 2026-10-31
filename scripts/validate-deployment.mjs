import { pathToFileURL } from 'node:url';

export function resolveDeploymentEnvironment(env) {
  const explicit = env.DEPLOY_ENVIRONMENT?.trim();
  if (explicit === 'staging' || explicit === 'production') return explicit;
  if (env.VERCEL_ENV === 'production') return 'production';
  return null;
}

export function validateDeployment(env) {
  const deploymentEnvironment = resolveDeploymentEnvironment(env);
  if (!deploymentEnvironment) {
    throw new Error(
      'Unknown deployment environment. Set DEPLOY_ENVIRONMENT to staging or production, or deploy the Vercel Production target (VERCEL_ENV=production). Preview deploys must set DEPLOY_ENVIRONMENT=staging.',
    );
  }
  env = { ...env, DEPLOY_ENVIRONMENT: deploymentEnvironment };
  if (!env.DATABASE_URL) throw new Error('Missing DATABASE_URL');
  const appUrl = env.APP_URL || env.NEXT_PUBLIC_APP_URL || env.BETTER_AUTH_URL;
  env = { ...env, APP_URL: appUrl };
  for (const name of ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL', 'APP_URL']) {
    if (!env[name]) throw new Error(`Missing ${name}`);
  }
  const database = new URL(env.DATABASE_URL);
  const expectedHost = env.EXPECTED_DATABASE_HOST?.trim() || database.hostname;
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || database.hostname !== expectedHost) {
    throw new Error('Unexpected database host for deployment environment');
  }
  const origin = new URL(env.APP_URL);
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('APP_URL must be an HTTPS origin');
  }
  for (const name of ['BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL']) {
    if (env[name].replace(/\/$/, '') !== origin.origin) throw new Error(`${name} must match APP_URL`);
  }
  if (env.BETTER_AUTH_SECRET.length < 32) throw new Error('Auth secret must contain at least 32 characters');
  if (!env.CHROMIUM_PACK_URL?.trim()) throw new Error('Deployment requires CHROMIUM_PACK_URL for PDF export');
  const browserPack = new URL(env.CHROMIUM_PACK_URL);
  if (browserPack.protocol !== 'https:') throw new Error('CHROMIUM_PACK_URL must use HTTPS');
  if (browserPack.username || browserPack.password) throw new Error('CHROMIUM_PACK_URL must not contain credentials');
  const checkoutConfigured = env.CHECKOUT_DISABLED !== 'true' && Boolean(env.RAZORPAY_KEY_SECRET?.trim() && env.RAZORPAY_WEBHOOK_SECRET?.trim() && env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim());
  if (checkoutConfigured && env.DEPLOY_ENVIRONMENT === 'production' && !env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_')) {
    throw new Error('Production requires Razorpay live credentials');
  }
  if (env.DEPLOY_ENVIRONMENT === 'staging') {
    for (const name of ['PRODUCTION_DATABASE_HOST', 'PRODUCTION_APP_URL']) {
      if (!env[name]) throw new Error(`Missing ${name}`);
    }
    if (database.hostname === env.PRODUCTION_DATABASE_HOST) {
      throw new Error('Staging must not use the production database host');
    }
    if (origin.origin === new URL(env.PRODUCTION_APP_URL).origin) {
      throw new Error('Staging must not use the production application origin');
    }
    if (!origin.hostname.startsWith('staging.')) {
      throw new Error('Staging APP_URL must use a staging. hostname');
    }
    if (checkoutConfigured && !env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_test_')) {
      throw new Error('Staging requires Razorpay test credentials');
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateDeployment(process.env);
  console.log('Deployment environment validated');
}
