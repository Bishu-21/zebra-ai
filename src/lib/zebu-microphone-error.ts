export type ZebuMicrophonePermissionValue = "unknown" | "granted" | "prompt" | "denied" | "unsupported";

type MicrophoneEnvironment = {
  secureContext: boolean;
  policyAllowsMicrophone: boolean;
};

function errorDetails(caught: unknown) {
  return caught && typeof caught === "object"
    ? caught as { name?: string; message?: string }
    : {};
}

export function isMicrophonePermissionFailure(caught: unknown, permission: ZebuMicrophonePermissionValue): boolean {
  return permission === "denied" || errorDetails(caught).name === "NotAllowedError";
}

export function describeMicrophoneCaptureFailure(
  caught: unknown,
  permission: ZebuMicrophonePermissionValue,
  environment: MicrophoneEnvironment,
): string {
  const details = errorDetails(caught);
  const message = details.message ?? "";

  if (!environment.secureContext) {
    return "Chrome only allows microphone capture from a secure page. Use localhost or HTTPS, then reload and retry.";
  }
  if (!environment.policyAllowsMicrophone) {
    return "This page's browser permissions policy blocks microphone capture. Check the site's Permissions-Policy header.";
  }
  if (permission === "unsupported" || details.name === "NotSupportedError") {
    return "This browser cannot capture microphone audio. You can still use text mode.";
  }
  if (details.name === "TimeoutError") {
    return "Chrome did not finish the microphone request. Close the permission panel, reload the page, and tap the mic again.";
  }
  if (details.name === "NotFoundError" || details.name === "DevicesNotFoundError") {
    return "Chrome cannot find an input microphone. Connect or enable one in Windows Sound settings, select it in Chrome, and retry.";
  }
  if (details.name === "NotReadableError" || details.name === "TrackStartError" || details.name === "AbortError") {
    return "Chrome has microphone permission, but could not open the input device. Close other audio apps, check the selected Windows input, and retry.";
  }
  if (details.name === "OverconstrainedError" || details.name === "ConstraintNotSatisfiedError") {
    return "The selected microphone does not support the requested audio mode. Choose another Chrome input device and retry.";
  }
  if (details.name === "SecurityError") {
    return "Chrome's security settings prevented microphone capture. Reload the page and review the site's microphone permission.";
  }
  if (details.name === "NotAllowedError" || permission === "denied") {
    if (/system|operating system|windows/i.test(message)) {
      return "Windows is denying microphone access to Chrome. Open Windows Settings > Privacy & security > Microphone, enable Microphone access and desktop-app access, then fully restart Chrome.";
    }
    return "Microphone access is denied by Chrome or Windows. If this site's microphone toggle is already on, check Windows Settings > Privacy & security > Microphone, enable desktop-app access, then fully restart Chrome.";
  }
  if (permission === "granted") {
    return "Microphone permission is allowed, but the selected input could not start. Check the Windows input device and retry.";
  }
  return "Chrome could not start the microphone. Allow access if prompted, verify the Windows input device, then tap the mic again.";
}
