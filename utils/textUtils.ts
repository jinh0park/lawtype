// Hangul Jamo Constants
const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];
const JUNGSUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];
const JONGSUNG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// Map Compatibility Jamo (Keyboard input) to Initial Jamo (Unicode Block 1100~)
// 'ㄱ' (U+3131) -> 'ㄱ' (U+1100)
const COMPATIBILITY_TO_CHOSUNG: { [key: string]: string } = {
  'ㄱ': 'ㄱ', 'ㄲ': 'ㄲ', 'ㄴ': 'ㄴ', 'ㄷ': 'ㄷ', 'ㄸ': 'ㄸ', 'ㄹ': 'ㄹ', 'ㅁ': 'ㅁ', 'ㅂ': 'ㅂ', 'ㅃ': 'ㅃ',
  'ㅅ': 'ㅅ', 'ㅆ': 'ㅆ', 'ㅇ': 'ㅇ', 'ㅈ': 'ㅈ', 'ㅉ': 'ㅉ', 'ㅊ': 'ㅊ', 'ㅋ': 'ㅋ', 'ㅌ': 'ㅌ', 'ㅍ': 'ㅍ', 'ㅎ': 'ㅎ'
};

// Map Complex Vowels to their leading component (2-set keyboard standard logic)
// e.g. To type '의', you type 'ㅡ' then 'ㅣ'. So 'ㅡ' is a partial match for '의'.
const COMPLEX_VOWEL_PREFIXES: { [key: string]: string } = {
  'ㅘ': 'ㅗ', // ㅗ + ㅏ
  'ㅙ': 'ㅗ', // ㅗ + ㅐ
  'ㅚ': 'ㅗ', // ㅗ + ㅣ
  'ㅝ': 'ㅜ', // ㅜ + ㅓ
  'ㅞ': 'ㅜ', // ㅜ + ㅔ
  'ㅟ': 'ㅜ', // ㅜ + ㅣ
  'ㅢ': 'ㅡ'  // ㅡ + ㅣ
};

/**
 * Checks if a character matches the target, considering substitutions.
 * e.g., '1' matches '①', '.' matches '·'
 */
export const isEquivalentChar = (inputChar: string, targetChar: string): boolean => {
  if (inputChar === targetChar) return true;

  // 1. Circled Numbers (① ~ ⑮ -> 1 ~ 15)
  // Check range U+2460 (①) to U+246E (⑮)
  const code = targetChar.charCodeAt(0);
  if (code >= 0x2460 && code <= 0x246E) {
    const numValue = code - 0x2460 + 1;
    // Allow standard digit input. Note: 10-15 are multi-char in input but single char in target.
    // For simple typing, we mainly handle 1-9 here directly, or multi-digit logic needs complex input handling.
    // Assuming user types single digit '1' for '①'.
    return inputChar === numValue.toString();
  }
  
  // 2. Dots
  // '·' (Middle Dot), 'ㆍ' (Arae-a) -> '.'
  if (inputChar === '.' && (targetChar === '·' || targetChar === 'ㆍ')) {
    return true;
  }

  return false;
};

/**
 * Decomposes a Hangul character into [Cho, Jung, Jong].
 * Returns null if not a Hangul syllable.
 */
const decomposeHangul = (char: string) => {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return null;

  const offset = code - 0xAC00;
  const jongIndex = offset % 28;
  const jungIndex = Math.floor((offset / 28) % 21);
  const choIndex = Math.floor((offset / 28) / 21);

  return {
    cho: CHOSUNG[choIndex],
    jung: JUNGSUNG[jungIndex],
    jong: JONGSUNG[jongIndex]
  };
};

/**
 * Checks if inputChar is a valid partial input for targetChar.
 * e.g. 'ㄷ', '다' are valid partials for '당'. '더' is not.
 * e.g. '으' is a valid partial for '의'.
 */
export const isHangulPartialMatch = (inputChar: string, targetChar: string): boolean => {
  // If exact match (or equivalent), it's not "partial", it's just correct. 
  // But this function assumes strict equality failed.
  
  // 1. Decompose Target
  const targetParts = decomposeHangul(targetChar);
  if (!targetParts) return false; // Target is not Hangul syllable

  // 2. Handle Input
  // Input could be a Syllable ('다') or a Jamo ('ㄷ')
  const inputCode = inputChar.charCodeAt(0);
  
  // Case A: Input is a Compatibility Jamo (Keyboard consonant)
  if (inputCode >= 0x3131 && inputCode <= 0x318E) {
    const mappedCho = COMPATIBILITY_TO_CHOSUNG[inputChar];
    return mappedCho === targetParts.cho;
  }

  // Case B: Input is a complete Syllable
  const inputParts = decomposeHangul(inputChar);
  if (inputParts) {
    // Check Consistency
    if (inputParts.cho !== targetParts.cho) return false;
    
    // If input has Jung, it must match OR be a valid prefix
    if (inputParts.jung) {
        // Direct match
        if (inputParts.jung === targetParts.jung) {
             // Continue to check jong
        } 
        // Partial Vowel match (e.g. '으' for '의')
        else if (COMPLEX_VOWEL_PREFIXES[targetParts.jung] === inputParts.jung) {
             // If vowel is partial, jong MUST be empty in input
             // (You can't have jong if you haven't finished the complex vowel yet, 
             //  actually you can't technically type a jong on a partial vowel in standard IME easily without finishing vowel first, 
             //  but just in case: '읔' is not a partial for '의')
             if (inputParts.jong !== '') return false;
             
             // If vowel matches prefix, we return true immediately because we are in the middle of vowel composition
             return true; 
        }
        else {
            return false;
        }
    }
    
    return true;
  }

  return false;
};

// Complex Vowels that require 2 keystrokes
// e.g. ㅘ = ㅗ + ㅏ
const DOUBLE_KEYSTROKE_VOWELS = new Set([
  'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'
]);

// Complex Consonants (Jongseong) that require 2 keystrokes
// e.g. ㄳ = ㄱ + ㅅ
const DOUBLE_KEYSTROKE_JONGS = new Set([
  'ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ'
]);

/**
 * Calculates the total number of keystrokes (Jamos) in a string.
 * Decomposes Hangul syllables into components.
 * Complex vowels (e.g., ㅘ) and complex jongseong (e.g., ㄳ) count as 2.
 */
export const getJamoCount = (text: string): number => {
  let count = 0;
  
  for (const char of text) {
    // 1. Try Decompose Hangul Syllable
    const parts = decomposeHangul(char);
    
    if (parts) {
      // Chosung: Always 1
      count += 1;
      
      // Jungsung: 1 or 2
      if (DOUBLE_KEYSTROKE_VOWELS.has(parts.jung)) {
        count += 2;
      } else {
        count += 1;
      }
      
      // Jongsung: 0, 1, or 2
      if (parts.jong) {
         if (DOUBLE_KEYSTROKE_JONGS.has(parts.jong)) {
           count += 2;
         } else {
           count += 1;
         }
      }
      
      continue;
    }
    
    // 2. Not a Hangul Syllable (Alphabets, Numbers, Spaces, Symbols, or standalone Jamo)
    // Standalone Jamo check?
    // In standard typing, standalone jamo is 1 key.
    // Complex Jamo standalone? (e.g. 'ㄳ') -> Usually typed as separate keys if using standard 2-set, 
    // but often treated as 1 char in strings. 
    // For simplicity, we treat non-decomposable chars as length 1.
    // NOTE: If user types 'ㄳ' directly (copy paste?), it's 1 char. 
    // But typing practice usually involves full syllables.
    
    count += 1;
  }
  
  return count;
};