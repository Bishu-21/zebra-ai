import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateDeployment } from '../scripts/validate-deployment.mjs';
import { readFileSync } from 'node:fs';

test('hosting build checks schema without applying migrations', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
    assert.match(config.buildCommand, /npm run db:health/);
    assert.doesNotMatch(config.buildCommand, /db:prepare|db:migrate|drizzle-kit/);
});

const production = {
    DEPLOY_ENVIRONMENT: 'production',
    DATABASE_URL: 'postgresql://test:test@production.example.com/app',
    EXPECTED_DATABASE_HOST: 'production.example.com',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://production.example.com',
    NEXT_PUBLIC_APP_URL: 'https://production.example.com',
    APP_URL: 'https://production.example.com',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_live_example',
    RAZORPAY_KEY_SECRET: 'test-fixture-secret',
    RAZORPAY_WEBHOOK_SECRET: 'test-fixture-webhook',
    CHROMIUM_PACK_URL: 'https://example.com/chromium-pack.tar',
};

test('production accepts closed checkout but requires live keys when fully configured', () => {
    assert.doesNotThrow(() => validateDeployment({ ...production, CHECKOUT_DISABLED: 'true', NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_test_example' }));
    assert.doesNotThrow(() => validateDeployment(production));
    assert.throws(() => validateDeployment({ ...production, NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_test_example' }), /live credentials/);
    assert.doesNotThrow(() => validateDeployment({ ...production, RAZORPAY_WEBHOOK_SECRET: '' }));
    assert.doesNotThrow(() => validateDeployment({ ...production, RAZORPAY_KEY_SECRET: '' }));
});

test('Vercel Production target is accepted without DEPLOY_ENVIRONMENT', () => {
    const vercelProduction = Object.fromEntries(Object.entries(production).filter(([key]) => key !== 'DEPLOY_ENVIRONMENT'));
    assert.doesNotThrow(() => validateDeployment({ ...vercelProduction, VERCEL_ENV: 'production' }));
});

test('preview and unknown environments stay rejected without an explicit staging flag', () => {
    const withoutFlag = Object.fromEntries(Object.entries(production).filter(([key]) => key !== 'DEPLOY_ENVIRONMENT'));
    assert.throws(() => validateDeployment(withoutFlag), /Unknown deployment environment/);
    assert.throws(() => validateDeployment({ ...withoutFlag, VERCEL_ENV: 'preview' }), /Unknown deployment environment/);
    assert.throws(() => validateDeployment({ ...staging, DEPLOY_ENVIRONMENT: 'preview' }), /Unknown deployment environment/);
});

const staging = {
    DEPLOY_ENVIRONMENT: 'staging',
    DATABASE_URL: 'postgresql://test:test@localhost/staging',
    BETTER_AUTH_SECRET: 'a'.repeat(32),
    APP_URL: 'https://staging.example.com',
    BETTER_AUTH_URL: 'https://staging.example.com',
    NEXT_PUBLIC_APP_URL: 'https://staging.example.com',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_test_example',
    RAZORPAY_KEY_SECRET: 'test-only',
    RAZORPAY_WEBHOOK_SECRET: 'test-only-webhook',
    EXPECTED_DATABASE_HOST: 'localhost',
    PRODUCTION_DATABASE_HOST: 'production.example.com',
    PRODUCTION_APP_URL: 'https://example.com',
    CHROMIUM_PACK_URL: 'https://example.com/chromium-pack.tar',
};

test('deployment requires a secure browser pack for serverless PDF export', () => {
    for (const environment of [staging, production]) {
        assert.throws(() => validateDeployment({ ...environment, CHROMIUM_PACK_URL: '' }), /CHROMIUM_PACK_URL/);
        assert.throws(() => validateDeployment({ ...environment, CHROMIUM_PACK_URL: 'http://example.com/pack.tar' }), /HTTPS/);
        assert.throws(() => validateDeployment({ ...environment, CHROMIUM_PACK_URL: 'https://user:secret@example.com/pack.tar' }), /credentials/);
    }
});

test('staging accepts aligned origins and test payments', () => {
    assert.doesNotThrow(() => validateDeployment(staging));
});
test('staging refuses live payments', () => {
    assert.throws(() => validateDeployment({ ...staging, NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_live_example' }), /test credentials/);
});
test('deployment refuses wrong origin, missing database and weak auth', () => {
    assert.throws(() => validateDeployment({ ...staging, BETTER_AUTH_URL: 'https://production.example.com' }), /match APP_URL/);
    assert.throws(() => validateDeployment({ ...staging, DATABASE_URL: '' }), /DATABASE_URL/);
    assert.throws(() => validateDeployment({ ...staging, BETTER_AUTH_SECRET: 'short' }), /32 characters/);
});
test('deployment refuses a database outside the configured environment', () => {
    assert.throws(() => validateDeployment({ ...staging, DATABASE_URL: 'postgresql://test:test@production.example.com/app' }), /database host/);
    assert.throws(() => validateDeployment({ ...staging, EXPECTED_DATABASE_HOST: '' }), /EXPECTED_DATABASE_HOST/);
});

test('staging refuses the production database host or application origin', () => {
    assert.throws(() => validateDeployment({ ...staging, PRODUCTION_DATABASE_HOST: 'localhost' }), /production database host/);
    assert.throws(() => validateDeployment({ ...staging, PRODUCTION_APP_URL: staging.APP_URL }), /production application origin/);
    assert.throws(() => validateDeployment({ ...staging, PRODUCTION_DATABASE_HOST: '' }), /PRODUCTION_DATABASE_HOST/);
    assert.throws(() => validateDeployment({ ...staging, PRODUCTION_APP_URL: '' }), /PRODUCTION_APP_URL/);
    assert.throws(() => validateDeployment({ ...staging, APP_URL: 'https://app.example.com', BETTER_AUTH_URL: 'https://app.example.com', NEXT_PUBLIC_APP_URL: 'https://app.example.com' }), /staging\. hostname/);
});
