/** Read API responses without exposing HTML error pages or JSON parser failures. */
export async function readApiResponse<T = Record<string, unknown>>(
    response: Response,
    fallbackMessage: string,
): Promise<T> {
    const data: unknown = await response.json().catch(() => null);
    const object = data && typeof data === 'object' && !Array.isArray(data)
        ? data as Record<string, unknown>
        : null;

    if (!response.ok) {
        if (typeof object?.error === 'string' && object.error.trim()) {
            throw new Error(object.error);
        }
        if (response.status === 504 || response.status === 408) {
            throw new Error('Processing is taking longer than expected. Check your saved resumes before retrying.');
        }
        if (response.status >= 500) {
            throw new Error('The service is temporarily unavailable. Please try again shortly.');
        }
        throw new Error(fallbackMessage);
    }
    if (!object) throw new Error('The service returned an invalid response. Please try again shortly.');
    return object as T;
}
