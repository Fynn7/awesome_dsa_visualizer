/**
 * Legacy re-export shim. The authoritative motion token source is now
 * `src/design/motionTokens.ts`. This file is preserved temporarily so that
 * `src/lib/*Animation*.ts` modules can be updated incrementally without a
 * single-step refactor breaking unrelated tests.
 *
 * Prefer importing from `src/design/motionTokens` in new code.
 */
export * from "../design/motionTokens";
