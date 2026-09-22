# TypeScript style

### Readability and size

- Prefer explicit `if` statements and early returns over ternary
  expressions. Use `else` when it makes the alternatives easier to follow.
- Use an exhaustive `switch` when handling a discriminated union.
- Reduce code by removing redundant work, duplicated decisions, and
  unnecessary wrappers. Prefer fewer concepts over fewer physical lines.
- Keep related logic together. Extract a function when its name explains
  a meaningful operation or removes distracting detail from its caller.
- Avoid helpers that merely forward arguments or force readers to jump
  between files.
- Keep mutable state in the smallest practical scope.
- Follow existing formatting. Avoid unrelated formatting changes.

### Types and errors

- Reuse authoritative library and domain types instead of copying them.
- Validate external input at entry points. Trust validated internal types.
- Prefer narrowing over `as` assertions. Use `unknown` instead of `any`
  for values whose shape is not established.
- Keep `try` blocks focused on the operation whose failure is handled.
  Use `finally` for cleanup that must happen on success and failure.
- Move substantial callback definitions outside cleanup blocks when that
  makes the operation easier to read.
- Catch errors where recovery or safe translation is possible.
  Keep credentials out of error messages and logs.

### Comments and JSDoc

- First try clearer names, types, and control flow.
- Use comments for non-obvious reasons, external constraints, security
  boundaries, or ordering requirements that code alone cannot explain.
- Place a comment immediately above the relevant code. Keep it as short
  as the explanation permits.
- Avoid comments that narrate the next statement, decorative section
  banners, and commented-out code.
- Use JSDoc when callers need a contract that the signature cannot express:
  side effects, ownership, cancellation behavior, or important failure
  conditions. Being exported alone does not require JSDoc.
- Do not repeat TypeScript types in `@param` or `@returns` tags.
- Keep architecture decisions and operating instructions in project docs.
  Link from code only when that context is needed to understand it.
- Give TODOs a concrete remaining action and an issue reference or removal
  condition. Update or remove comments when their assumptions change.
