import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readApiResponse } from '../src/lib/api-response';

test('returns successful JSON data', async () => {
    assert.deepEqual(await readApiResponse(Response.json({ id: 'resume-1' }), 'Upload failed'), { id: 'resume-1' });
});

test('preserves actionable API errors', async () => {
    await assert.rejects(readApiResponse(Response.json({ error: 'Insufficient credits.' }, { status: 402 }), 'Upload failed'), /Insufficient credits/);
});

test('handles HTML gateway errors without leaking response content', async () => {
    await assert.rejects(readApiResponse(new Response('<html>private proxy diagnostics</html>', { status: 504 }), 'Analysis failed'), /taking longer than expected/);
    await assert.rejects(readApiResponse(new Response('<html>private proxy diagnostics</html>', { status: 503 }), 'Upload failed'), /temporarily unavailable/);
});

test('rejects malformed successful responses and uses a safe error fallback', async () => {
    await assert.rejects(readApiResponse(new Response('not JSON'), 'Analysis failed'), /invalid response/);
    await assert.rejects(readApiResponse(new Response('null'), 'Analysis failed'), /invalid response/);
    await assert.rejects(readApiResponse(Response.json({ error: { internal: 'secret' } }, { status: 400 }), 'Upload failed'), /^Error: Upload failed$/);
});
