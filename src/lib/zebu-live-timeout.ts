export class ZebuLiveTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

export function withZebuTimeout<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string,
  options: { onTimeout?: () => void; onLateResolve?: (value: T) => void } = {},
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      options.onTimeout?.();
      reject(new ZebuLiveTimeoutError(message));
    }, timeoutMs);

    operation.then(
      (value) => {
        if (settled) {
          options.onLateResolve?.(value);
          return;
        }
        settled = true;
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}
