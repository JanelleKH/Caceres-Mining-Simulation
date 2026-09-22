import { parseCsvLine } from './csvParse';

export type UploadSlot = 'community' | 'developer';

/** Columns a file must carry to be accepted in each upload slot. */
export const REQUIRED_HEADERS: Record<UploadSlot, string[]> = {
  community: ['winnerId', 'benefitsCount', 'benefitIds', 'consensusAreaId'],
  developer: [
    'size_km2',
    'capacity_mton',
    'total_budget',
    'final_water_m3',
    'final_waste_ton',
  ],
};

const SLOT_LABEL: Record<UploadSlot, string> = {
  community: 'Community Results',
  developer: 'Developer Results',
};

export interface CsvHeaderCheck {
  ok: boolean;
  /** Plain-language reason shown to the administrator when ok is false. */
  message?: string;
}

/** Which slot a file belongs in, judged by its header row. */
export function detectSlot(header: string[]): UploadSlot | null {
  const hasAll = (cols: string[]) => cols.every(c => header.includes(c));
  if (hasAll(REQUIRED_HEADERS.community)) return 'community';
  if (hasAll(REQUIRED_HEADERS.developer)) return 'developer';
  return null;
}

/**
 * Check an uploaded file against the slot it was dropped into, before any
 * values are read. Guards against the two files being swapped, and against
 * a file that is not a simulation export at all.
 */
export function checkCsvForSlot(text: string, slot: UploadSlot): CsvHeaderCheck {
  const firstLine = text.trim().split(/\r?\n/).filter(Boolean)[0];
  if (!firstLine) {
    return { ok: false, message: 'That file is empty. Please upload the CSV downloaded from the simulation.' };
  }

  const header = parseCsvLine(firstLine);
  const detected = detectSlot(header);

  if (detected === slot) return { ok: true };

  if (detected) {
    return {
      ok: false,
      message: `This is the ${SLOT_LABEL[detected]} file. Upload it in the ${SLOT_LABEL[detected]} box instead.`,
    };
  }

  const missing = REQUIRED_HEADERS[slot].filter(c => !header.includes(c));
  return {
    ok: false,
    message: `This does not look like a ${SLOT_LABEL[slot]} export — the column${missing.length === 1 ? '' : 's'} ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing. Please upload the CSV downloaded from the simulation.`,
  };
}
