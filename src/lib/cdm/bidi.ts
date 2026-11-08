import type { TextDirection } from './schema';

/**
 * Unicode UAX #9 First-Strong Character Detector for Arabic/RTL & Latin/LTR
 */
const RTL_CHAR_REGEX = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LTR_CHAR_REGEX = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/;

export function detectFirstStrongDirection(
  text: string,
  fallback: 'rtl' | 'ltr' = 'rtl'
): 'rtl' | 'ltr' {
  for (const char of text) {
    if (RTL_CHAR_REGEX.test(char)) {
      return 'rtl';
    }
    if (LTR_CHAR_REGEX.test(char)) {
      return 'ltr';
    }
  }
  return fallback;
}

export function resolveEffectiveDirection(
  explicitDirection: TextDirection | undefined,
  textSample: string,
  documentFallback: 'rtl' | 'ltr' = 'rtl'
): 'rtl' | 'ltr' {
  if (explicitDirection === 'rtl' || explicitDirection === 'ltr') {
    return explicitDirection;
  }
  return detectFirstStrongDirection(textSample, documentFallback);
}

export interface MixedRunSegment {
  text: string;
  direction: 'rtl' | 'ltr';
  isNumeric: boolean;
}

/**
 * Splits a mixed Arabic/English/Numeric string into directional runs so OOXML & pagination engines
 * can preserve bidirectional integrity and tabular numeric order.
 */
export function segmentBidiRuns(
  input: string,
  baseDirection: 'rtl' | 'ltr' = 'rtl'
): MixedRunSegment[] {
  if (!input) return [];

  const tokens = input.match(/([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+|[A-Za-z]+|[0-9.,%$SARAED]+|\s+|[^\s\u0600-\u06FFA-Za-z0-9]+)/g);
  if (!tokens) {
    return [{ text: input, direction: baseDirection, isNumeric: false }];
  }

  const segments: MixedRunSegment[] = [];
  for (const token of tokens) {
    const isRtl = RTL_CHAR_REGEX.test(token);
    const isLtr = LTR_CHAR_REGEX.test(token);
    const isNumeric = /^[0-9]+([.,][0-9]+)?[%$]?$/.test(token.trim());

    let dir: 'rtl' | 'ltr' = baseDirection;
    if (isRtl) dir = 'rtl';
    else if (isLtr || isNumeric) dir = 'ltr';
    else if (segments.length > 0) dir = segments[segments.length - 1].direction;

    const prev = segments[segments.length - 1];
    if (prev && prev.direction === dir && prev.isNumeric === isNumeric) {
      prev.text += token;
    } else {
      segments.push({ text: token, direction: dir, isNumeric });
    }
  }

  return segments;
}
