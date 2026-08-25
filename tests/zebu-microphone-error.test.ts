import assert from "node:assert/strict";
import test from "node:test";
import nextConfig from "../next.config";
import { describeMicrophoneCaptureFailure, isMicrophonePermissionFailure } from "../src/lib/zebu-microphone-error";

const allowedEnvironment = { secureContext: true, policyAllowsMicrophone: true };

test("Zebu distinguishes Windows microphone denial from a site-setting block", () => {
  const error = new DOMException("Permission denied by system", "NotAllowedError");
  assert.match(describeMicrophoneCaptureFailure(error, "denied", allowedEnvironment), /Windows is denying/);
  assert.equal(isMicrophonePermissionFailure(error, "denied"), true);
});

test("Zebu reports a missing microphone instead of calling it blocked", () => {
  const error = new DOMException("Requested device not found", "NotFoundError");
  assert.match(describeMicrophoneCaptureFailure(error, "prompt", allowedEnvironment), /cannot find an input microphone/);
});

test("Zebu reports insecure contexts and permissions-policy denial", () => {
  const error = new DOMException("Permission denied", "NotAllowedError");
  assert.match(describeMicrophoneCaptureFailure(error, "denied", { ...allowedEnvironment, secureContext: false }), /secure page/);
  assert.match(describeMicrophoneCaptureFailure(error, "denied", { ...allowedEnvironment, policyAllowsMicrophone: false }), /permissions policy/);
});

test("Zebra's response headers allow same-origin microphone capture", async () => {
  assert.ok(nextConfig.headers);
  const rules = await nextConfig.headers();
  const permissionPolicy = rules
    .flatMap((rule) => rule.headers)
    .find((header) => header.key === "Permissions-Policy");
  assert.equal(permissionPolicy?.value, "camera=(), microphone=(self), geolocation=()");
});
