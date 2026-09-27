# Resume upload and analysis investigation

The reported upload/analysis error stopped occurring during the investigation. The remaining user concern is processing time. No resume-processing code or production records were changed during diagnosis.

## Verified results

- `npm run build`: production compilation, TypeScript, and generation of 44 pages passed.
- Focused resume-content, audit-rubric, validation, and Azure-provider tests: 44 passed.
- Live Azure audit with the repository's synthetic sample: passed schema validation, all 45 rubric checks across seven categories.
- Synthetic PDF text extraction: 0.10 seconds.
- Synthetic resume AI structuring: 2.91 seconds.
- Separate synthetic Azure audit timing: 47.02 seconds, including command startup. These were small samples in individual runs, not production percentiles or a complete browser journey.
- Read-only database health check from this machine failed with `ENOTFOUND`; the OS resolver refused the Neon hostname. Public DNS resolved the same hostname successfully. This does not establish that the hosted app has a database outage. Database schema and end-to-end persistence could not be verified here.

## Code findings

`AnalyzeResume.tsx` calls `/api/resumes/upload` and waits for extraction, AI structuring and saving before calling `/api/ai/analyse`. Both operations reserve one credit separately. A successful upload followed by a failed audit may therefore still have consumed the upload credit.

The audit budget is 16,000 maximum output tokens with medium reasoning. The maximum is a ceiling, not evidence of actual token consumption. The measured audit dominates the synthetic processing time; skipping structuring alone would save only about three seconds in this sample.

The UI advances six labels every 1.2 seconds and fills the progress bar over six seconds without server progress events. It can display “Finalizing Report” long before the audit finishes. This is a confirmed misleading progress indicator, not evidence that computation has frozen.

Several database operations occur before the analysis route's generation/validation/persistence catch block. A server or platform non-JSON failure may also be obscured because the client calls `res.json()` before handling the HTTP status. These are robustness gaps, not confirmed causes of the user's now-resolved error.

## Recommended sequence

1. Replace artificial percentage/stage completion with honest indeterminate progress and elapsed time; preserve the current audit and scoring behavior.
2. Establish a fixed set of representative student resumes. Measure rubric completeness, grounded findings, rewrite usefulness, latency and cost before comparing lower reasoning settings, smaller responses or alternate models. Do not reduce audit coverage to claim a speedup.
3. Add bounded provider deadlines and user-safe handling for non-JSON service errors, with regression tests. Validate persistence and credit behavior against isolated staging.
4. Refactor the editor and application workspace in small behavior-preserving steps, keeping rendering and persistence contracts stable.

The second supplied audit is reference material. Claims of unique competitor capabilities, star-conversion multipliers and guaranteed growth were not validated. Fine-tuning and embeddings are not prerequisites for a useful AI product; evaluation should establish whether retrieval or output quality actually needs them. Existing provider fallback already handles SDK `APIConnectionError` and `APIConnectionTimeoutError`, so the audit's blanket network-fallback claim is too broad.
