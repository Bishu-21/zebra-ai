import { pathToFileURL } from 'node:url';

export function validateDeployment(env) {
  if (!['staging', 'production'].includes(env.DEPLOY_ENVIRONMENT)) {
    throw new Error('Unknown deployment environment');
  }
  for (const name of ['DATABASE_URL', 'EXPECTED_DATABASE_HOST', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL', 'APP_URL']) {
    if (!env[name]) throw new Error(`Missing ${name}`);
  }
  const database = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(database.protocol) || database.hostname !== env.EXPECTED_DATABASE_HOST) {
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
  if (!env.RAZORPAY_KEY_SECRET?.trim() || !env.RAZORPAY_WEBHOOK_SECRET?.trim()) {
    throw new Error('Deployment requires payment and webhook secrets');
  }
  if (env.DEPLOY_ENVIRONMENT === 'production' && !env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_live_')) {
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
    if (!env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.startsWith('rzp_test_')) {
      throw new Error('Staging requires Razorpay test credentials');
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateDeployment(process.env);
  console.log('Deployment environment validated');
}
