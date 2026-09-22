# Update reporting channels

Edit [lib/src/reporting/channels.ts](../lib/src/reporting/channels.ts). It is the source for both the offline lookup and the downloadable Markdown. The channel reference is operator-maintained; it has no upstream feed or automatic updater.

1. Open the record's published instructions. Confirm the intended service role, route and conditions. For registrar-specific conditions, retain the requirement to check case RDAP.
2. Update the record. Keep the channel kind accurate: `email` for an address, `form` for a form endpoint, and `instructions` for a page that links to or explains a form. Record a source link for the published route.
3. Set that record's `checkedAt` to the UTC date of the successful review. Keep the previous date when a page fails to load. Confirm every channel and source in the record before advancing its date.
4. Generate the portable document from the repository root:

   ```sh
   npm run reporting:generate
   ```

5. Check the catalogue and generated output:

   ```sh
   npm run reporting:check
   npm run check:types
   ```

6. Review the source and Markdown diff together. If a route or condition changed intentionally, update any test that pins the former behavior. Run `npm test` before committing the change.

The generator replaces the file rather than appending rows. Running it again with unchanged records produces identical content. Both `reporting:check` and the root test suite fail if the Markdown differs from the generator. The generator loads the TypeScript source directly, so it cannot silently use an older build.

New provider IDs must be lowercase words joined by hyphens. Multiple records can share a provider when their roles differ, as with Cloudflare. Each provider-and-role pair must occur in only one record; a test catches conflicting coverage. The Flue tool description derives its provider IDs from the catalogue. Changes to source records take effect in Flue after the normal `pretriage` library build.

Review a channel when preparing to use it, when a provider changes its instructions, or when a delivery failure or reply reveals a different route. No scheduled update policy or automatic expiry is implemented. Revert the source and regenerate the Markdown to undo an update. Generation never sends a report or queries a provider.
