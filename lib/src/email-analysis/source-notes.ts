import * as v from 'valibot';
import { domainSchema } from '../lookups/rdap.ts';

/** Explicitly reviewed external evidence. Fields describe the supplier's claims, not a runtime fetch. */
export const sourceNotesSchema = v.pipe(v.array(v.object({
  url: v.pipe(v.string(), v.maxLength(4096), v.url(), v.regex(/^https?:\/\//i)),
  retrievedAt: v.pipe(v.string(), v.isoTimestamp()),
  displayedDate: v.nullable(v.pipe(v.string(), v.maxLength(64))),
  claim: v.pipe(v.string(), v.minLength(1), v.maxLength(2000)),
  providedBy: v.picklist(['operator', 'agent']),
  sourceAuthority: v.picklist(['claimed_official', 'other', 'unknown']),
  relation: v.picklist(['supports_concern', 'contradicts_concern', 'context', 'unknown']),
  subjectHosts: v.pipe(v.array(domainSchema), v.maxLength(16)),
  messageDateApplicability: v.picklist(['applicable', 'not_applicable', 'unknown']),
})), v.maxLength(16));

export type SourceNote = v.InferOutput<typeof sourceNotesSchema>[number] & {
  id: string;
  acquisition: 'caller_supplied_note';
  verification: 'not_performed';
};
