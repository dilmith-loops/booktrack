// Multilingual content moderation patterns for Sri Lankan English, Sinhala (සිංහල & Singlish), and Tamil (தமிழ் & Tanglish)
// Strictly enforces Sampath Bank zero-tolerance community safety for BMICH Colombo Book Fair 2026.

export interface ProfanityMatchResult {
  isClean: boolean;
  reason?: string;
  detectedType?: 'profanity' | 'racist_or_ethnic_slur' | 'communal_peace_harm';
  detectedLanguage?: 'English' | 'Sinhala' | 'Singlish' | 'Tamil' | 'Tanglish' | 'Multilingual';
  matchedWord?: string;
}

/**
 * Checks if user-based input does not make any sense or contains meaningless words/invalid Singlish
 * (gibberish, keyboard mashing, repeated character loops, vowel-less letter clusters, or symbol spam).
 * Per community safety guidelines, any Singlish words or input that does not have a real meaning
 * when converted to English, Sinhala, or Singlish is marked as profanity and blocked.
 */
// Recognized common abbreviations without vowels
const VALID_NO_VOWEL_TOKENS = new Set([
  'bmich', 'lkr', 'plc', 'isbn', 'pdf', 'mp3', 'dvd', 'cd', 'tv',
  'vol', 'ed', 'pp', 'rs', 'mr', 'mrs', 'dr', 'st', 'rd', 'sl', 'txt',
  'sms', 'cctv', 'pvt', 'ltd', 'fm', 'slbc', 'itn', 'rupavahini'
]);

// Known authentic Sinhala, Singlish, and literary vocabulary
const AUTHENTIC_SINHALA_SINGLISH_VOCAB = new Set([
  'karumakkarayo', 'muthu', 'ahura', 'vanitha', 'wasana', 'gamperaliya', 'madol', 'doova',
  'viragaya', 'senasuma', 'kavya', 'shekharaya', 'guttilaya', 'guttila', 'kusajathakaya',
  'sandeshaya', 'salalihini', 'selalihini', 'paravi', 'kokila', 'gira', 'hamsa', 'mayura',
  'amba', 'yahaluwo', 'hathpana', 'magul', 'kama', 'handapana', 'kaluwara', 'gedara',
  'baddegama', 'yuganthaya', 'kaliyugaya', 'thunmanhandiya', 'bambaru', 'avith', 'siri',
  'medura', 'arunodhya', 'chithra', 'jeewithaya', 'adaraya', 'samagiya', 'shanthiya',
  'sahithya', 'ithihasaya', 'bhashawa', 'vidyava', 'kalawa', 'darshanaya', 'shilpaya',
  'potha', 'poth', 'aluth', 'parana', 'mulu', 'gata', 'lanka', 'lankadeepa', 'silumina',
  'dinamina', 'divaina', 'lankawa', 'colombo', 'bmich', 'sarasavi', 'godage', 'gunasena',
  'dayawansa', 'jayakody', 'samudra', 'wijesooriya', 'grantha', 'granthaaloke', 'rathna',
  'visidunu', 'fast', 'lakehouse', 'amarasekera', 'wickramasinghe', 'munidasa', 'kumaratunga',
  'sarachchandra', 'ediriweera', 'jayatillake', 'ilangaratne', 'wettasinghe', 'sekera',
  'mahagama', 'alwis', 'perera', 'silva', 'fernando', 'hoyanawa', 'hoyanna', 'thiyenawa',
  'thiyeda', 'thiyenawada', 'kiyawanna', 'balanna', 'ganna', 'denna', 'kiyanna', 'ahanna',
  'danna', 'hambawuna', 'dakke', 'dakka', 'ona', 'adui', 'wedi', 'godak', 'tika',
  'monawada', 'koheda', 'kavadada', 'kageda', 'mokakda', 'kawda', 'onna', 'menna',
  'machan', 'nawa', 'katha', 'kathawa', 'ketikatha', 'kata', 'katakatha', 'katakathawa',
  'katandara', 'kathandara', 'janakatha', 'gamakatha', 'purawrutha', 'upakatha',
  'folklore', 'folk', 'stories', 'tales', 'folktales', 'folktale', 'achchi', 'aththa', 'paththare',
  'natat', 'natath', 'nathath', 'ayek', 'suramathin', 'suramatin', 'sura', 'mathin', 'natha',
  'apegama', 'senkottan', 'guru', 'geethaya', 'hima', 'piyali',
  'suddha', 'yuddhaya', 'chandrika', 'rashtriya', 'shasthra', 'paddlers', 'creek'
]);

/**
 * Checks if input is gibberish, meaningless pseudo-words, or keyboard mash.
 * Optimized to accurately distinguish authentic Sinhala words (script & Singlish)
 * and English literature from genuine gibberish.
 */
export function isNonsensicalText(text: string): { isNonsense: boolean; detail?: string } {
  if (!text) return { isNonsense: false };
  const trimmed = text.trim();
  if (trimmed.length === 0) return { isNonsense: false };

  // 1. Check for pure symbol or numeric spam without any letters
  // (Sinhala Unicode: \u0D80-\u0DFF, Tamil: \u0B80-\u0BFF, Latin: a-zA-Z)
  const hasLetters = /[a-zA-Z\u0D80-\u0DFF\u0B80-\u0BFF]/.test(trimmed);
  if (!hasLetters && trimmed.length >= 3) {
    return {
      isNonsense: true,
      detail: 'Input contains only symbols or numbers with no words.'
    };
  }

  // 2. Character repetition (e.g. "aaaaa", "zzzzz", "sssss" - 4+ repeated)
  if (/([a-zA-Z])\1{3,}/i.test(trimmed)) {
    return {
      isNonsense: true,
      detail: 'Repeated character spam detected.'
    };
  }

  // 3. Indic script checks (Sinhala / Tamil)
  const isSinhalaScript = /[\u0D80-\u0DFF]/.test(trimmed);
  const isTamilScript = /[\u0B80-\u0BFF]/.test(trimmed);

  if (isSinhalaScript) {
    // 5+ identical Sinhala characters in a row
    if (/([\u0D80-\u0DFF])\1{4,}/.test(trimmed)) {
      return {
        isNonsense: true,
        detail: 'Repeated Sinhala character spam detected.'
      };
    }
    // Consecutive viramas (invalid orthography)
    if (/[\u0DCA]{2,}/.test(trimmed)) {
      return {
        isNonsense: true,
        detail: 'Invalid character cluster in Sinhala script detected.'
      };
    }
    // If predominantly Sinhala script, authentic words (e.g., ගම්පෙරළිය, කරුමක්කාරයෝ) are verified clean!
    if (/^[\u0D80-\u0DFF\s\d\p{P}]+$/u.test(trimmed)) {
      return { isNonsense: false };
    }
  }

  if (isTamilScript) {
    if (/([\u0B80-\u0BFF])\1{4,}/.test(trimmed)) {
      return {
        isNonsense: true,
        detail: 'Repeated Tamil character spam detected.'
      };
    }
    if (/[\u0BCD]{2,}/.test(trimmed)) {
      return {
        isNonsense: true,
        detail: 'Invalid character cluster in Tamil script detected.'
      };
    }
    if (/^[\u0B80-\u0BFF\s\d\p{P}]+$/u.test(trimmed)) {
      return { isNonsense: false };
    }
  }

  // 4. Keyboard smash row sequences
  const KEYBOARD_SMASH_PATTERNS = [
    'asdfgh', 'asdfjkl', 'dfghjkl', 'fghjkl', 'ghjkl',
    'qwerty', 'wertyu', 'ertyui', 'rtyuio', 'tyuiop',
    'zxcvbn', 'xcvbnm', 'lkjhgf', 'kjhgfd', 'jhgfds', 'poiuyt',
    'mnbvcx', 'qazwsx', 'wsxedc', 'edcrfv', 'rfvtgb', 'yhnujm',
    'sdfsdf', 'fjskdf', 'shkdfj', 'kjsdhf', 'weripou'
  ];
  const compact = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const smash of KEYBOARD_SMASH_PATTERNS) {
    if (compact.includes(smash) && compact.length <= smash.length + 4) {
      return {
        isNonsense: true,
        detail: 'Keyboard row mash detected.'
      };
    }
  }

  // 5. Repetitive nonsense syllables (e.g. "blabla", "plapla")
  if (/\b(?:bla|pla|kru|womp){2,}\b/i.test(trimmed)) {
    return {
      isNonsense: true,
      detail: 'Nonsense syllable repetition detected.'
    };
  }

  // 6. Word-by-word structural & phonotactic validity check for English, Sinhala, & Singlish
  const words = trimmed.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (!cleanWord) continue;

    // Check against authentic vocabulary first
    if (AUTHENTIC_SINHALA_SINGLISH_VOCAB.has(cleanWord)) {
      continue;
    }

    // Repeated syllable loops WITHIN a single word (e.g. "asdasdasd", "abcabcabc", "xyzxyzxyz", "qweqweqwe")
    if (cleanWord.length >= 6 && /(.{2,4})\1{2,}/i.test(cleanWord)) {
      return {
        isNonsense: true,
        detail: `Repetitive keyboard loop in "${word}" detected.`
      };
    }

    // A Latin word with 3+ characters and 0 vowels that is not a standard acronym
    if (cleanWord.length >= 3 && !/[aeiouy]/.test(cleanWord) && !VALID_NO_VOWEL_TOKENS.has(cleanWord)) {
      return {
        isNonsense: true,
        detail: `Meaningless word "${word}" without vowels detected.`
      };
    }

    if (cleanWord.length >= 4) {
      // Check for impossible English/Singlish keyboard mashed sequences
      if (/(?:q[^u]|xj|jx|qz|zq|qx|xq|vx|xv|dxz|fgh|ghj|hjk|jkl|lkj|kjh|jhg|hgf|gfd|fds|dsa|zxcv|xcvb|cvbn|vbnm|qwrt|wryt)/i.test(cleanWord)) {
        return {
          isNonsense: true,
          detail: `Meaningless or invalid Singlish token "${word}" with unnatural letter structure detected.`
        };
      }

      // Consonant cluster analysis:
      const normalizedClusters = cleanWord
        .replace(/(?:thth|chch|dhdh|shth|ndr|kkh|tth|nth|nch|ndh|mbh)/g, 'c')
        .replace(/(?:th|ch|dh|sh|kh|gh|bh|ph|ng|nd|mb|gn|ny)/g, 'c')
        .replace(/(?:str|spl|thr|rhythm|ngth|night|ght|sch|psych|twelfth|glimpse|craft|bestsell)/g, 'c');

      if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(normalizedClusters)) {
        return {
          isNonsense: true,
          detail: `Unnatural consonant cluster in "${word}" detected.`
        };
      }

      const vowels = cleanWord.match(/[aeiouy]/g);
      if (cleanWord.length >= 8 && (!vowels || vowels.length <= 1)) {
        return {
          isNonsense: true,
          detail: `Unnatural letter distribution in "${word}" detected.`
        };
      }
    }
  }

  return { isNonsense: false };
}

// 1. English Profanities and Vulgarities
export const ENGLISH_PROFANITY: string[] = [
  'fuck', 'fucker', 'fucking', 'fucked', 'fuckers', 'fuckhead', 'motherfucker', 'motherfucking',
  'shit', 'shitty', 'bullshit', 'shitting', 'shited', 'dipshit', 'horseshit',
  'bitch', 'bitches', 'bitching', 'bitchy', 'son of a bitch',
  'asshole', 'assholes', 'dumbass', 'jackass', 'badass',
  'bastard', 'bastards', 'cunt', 'cunts',
  'dick', 'dicks', 'dickhead', 'cock', 'cocks', 'cockhead',
  'pussy', 'pussies', 'whore', 'whores', 'slut', 'sluts',
  'wanker', 'twat', 'prick', 'douchebag', 'blowjob'
];

// 2. Sinhala Script Profanities and Vulgar Slurs (සිංහල අසභ්‍ය වචන)
export const SINHALA_SCRIPT_PROFANITY: string[] = [
  'පකයා', 'පක', 'පකෝ', 'පකේ', 'පකෙන්', 'පකෙක්',
  'කැරියා', 'කැරි', 'කැරියෝ', 'කැරියෙක්', 'කැරිබල්ලා', 'කැරිවැඩ',
  'හුත්ත', 'හුත්තෝ', 'හුත්තේ', 'හුත්තෙ', 'හුත්තා', 'හුත්තියෙ', 'හුතු',
  'හුකපන්', 'හුකන්නා', 'හුකන', 'හුකනවා', 'හුකන්නී', 'හුකනෝ', 'හුක්',
  'වේසි', 'වේසාවා', 'වේසිගෙ', 'වේසිගෙපුතා', 'වේස', 'වේසිකම',
  'පොන්නයා', 'පොන්න', 'පොන්ස්', 'පොන්නයෝ', 'පොන්නයෙක්',
  'බල්ලා', 'බැල්ලි', 'බල්ලො', 'පරයා', 'පරයෝ', 'පරට්ටී', 'පරට්ටි',
  'කලවැද්දා', 'පයිය', 'බිජ්ජ', 'තොත්තා', 'අම්මටහුකන', 'අපතයා',
  'ගූ', 'අසූචි', 'අවජාතක'
];

// 3. Singlish (Romanized Sinhala Colloquial Slang & Vulgarities)
export const SINGLISH_PROFANITY: string[] = [
  'pakaya', 'pakayaa', 'pakayo', 'paka', 'pako', 'pakoo', 'pake', 'pakenda', 'pakada', 'pakek',
  'kariya', 'kariyaa', 'kariyo', 'kari', 'kariyek', 'kari balla', 'kari balli', 'kari hutto', 'kari pakaya', 'kariweda', 'amu kariya', 'amu kariyek',
  'hutta', 'hutto', 'hutte', 'huththe', 'huththa', 'huththi', 'huththee', 'hukapan', 'hukanna', 'hukanawa', 'hukana', 'hukanne', 'hukano',
  'wesa', 'wesi', 'wesige', 'wesiba', 'wesikema', 'wesigeputha', 'wesige putha', 'wesigeputho', 'wesige putho', 'wesikeli', 'wesa balla', 'wesa balli',
  'ponnaya', 'ponna', 'ponz', 'ponzla', 'ponnay', 'ponnayo', 'ponnayek', 'ponnayine',
  'balla', 'balli', 'ballo', 'paraya', 'parayo', 'paratti', 'kalawadda', 'payya', 'bijja',
  'ammata hukanwa', 'ammata hukanna', 'thuk nodokin', 'nodokin', 'pala hutto', 'pala pakaya', 'pala wesi',
  'avajathaka', 'gon bijja', 'gon thadiya', 'gon hutto', 'gon pakaya', 'wal balla', 'wal wesi', 'gu pakaya', 'gu kariya'
];

// 4. Tamil Script Profanities and Vulgarities (தமிழ் அவதூறு வார்த்தைகள்)
export const TAMIL_SCRIPT_PROFANITY: string[] = [
  'தேவிடியா', 'தேவுடியா', 'பூல்', 'பூலு', 'ஓத்தா', 'ஓத்த', 'ஒத்தா', 'ஒத்தால', 'ஒம்மால',
  'சுன்னி', 'மயிர்', 'மயிறு', 'பொட்டை', 'புண்டை', 'புண்ட', 'கூதி', 'கூதிமவன்',
  'நாயே', 'பன்னி', 'தாயோளி', 'கண்டாரோளி', 'சூத்து', 'சூத்துல'
];

// 5. Tanglish (Romanized Tamil Vulgarities & Slang)
export const TANGLISH_PROFANITY: string[] = [
  'thevidiya', 'thevdia', 'thevdiya', 'thevidiya paiya', 'thevdiya mavan', 'otha', 'othale', 'oththa',
  'otha gommala', 'ommale', 'poolu', 'pool', 'sunni', 'sunniya', 'sunni mavan',
  'mayiru', 'mayir', 'mayire', 'pottai', 'punda', 'pundai', 'pundamavan', 'punda mavane', 'pundakokki',
  'koothi', 'koothiyan', 'soothu', 'soothula', 'naaye', 'naaye peye', 'panni', 'pannada',
  'poramboku', 'thaayoli', 'kandaaroli', 'lavadagopal'
];

// 6. Racist Slurs, Ethnic Hatred, & Communal Conflict Words (English, Sinhala, Singlish, Tamil)
// Violating peaceful coexistence among Sinhalese, Tamils, Muslims, Burghers, etc.
export const RACIST_AND_COMMUNAL_HATE_WORDS: string[] = [
  // English
  'nigger', 'nigga', 'chink', 'kike', 'spic', 'wetback', 'faggot', 'tranny',
  'ethnic cleansing', 'subhuman', 'terrorist dog',
  // Sinhala Script Racist / Ethnic Hate
  'හම්බයා', 'හම්බයෝ', 'පර දෙමළා', 'මරක්කලයා', 'කල්ල තෝනි', 'ජාතිවාදී',
  'මරමු', 'වර්ගවාදය', 'බෝම්බ ගහපල්ලා', 'තම්බියා', 'තම්බි',
  // Singlish Racist / Communal Slurs & Incitement
  'hambaya', 'hambayo', 'para demala', 'marakkalaya', 'kalla thoni',
  'demallu', 'thambiya', 'thambi', 'hamba balla', 'maranna ona', 'gahapalla',
  'bomb gahanna', 'maramu', 'sinhalaya maramu', 'demala maramu',
  // Tanglish / Tamil Hate
  'sinhalavan', 'kallathoni', 'kolluvom', 'parayan'
];

/**
 * Normalizes input text to catch common leetspeak substitutions
 * e.g. p@k@y@ -> pakaya, f*ck -> fuck, h.u.t.t.o -> hutto
 */
export function normalizeForSafetyCheck(raw: string): string {
  if (!raw) return '';
  let str = raw.toLowerCase();

  // Common leetspeak replacements
  str = str
    .replace(/[@4]/g, 'a')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[\*\_\-\.\,\/\\]/g, ' ') // treat symbols as word breaks
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

/**
 * Fast synchronous check against local multilingual dictionary of profanity and hate speech
 * covering: English, Sinhala Script, Singlish, Tamil Script, and Tanglish.
 */
export function checkLocalProfanity(text: string): ProfanityMatchResult {
  if (!text || text.trim().length === 0) {
    return { isClean: true };
  }

  const normalized = normalizeForSafetyCheck(text);
  const rawLower = text.toLowerCase();

  // 1. Check Racist and Communal Hate Words First (Highest Priority)
  for (const word of RACIST_AND_COMMUNAL_HATE_WORDS) {
    const wordNorm = word.toLowerCase();
    const isLatin = /^[a-z0-9\s]+$/i.test(wordNorm);
    const isMultiWord = wordNorm.includes(' ');
    const regex = new RegExp(`\\b${wordNorm}\\b`, 'i');
    const matched = isLatin
      ? (regex.test(normalized) || regex.test(rawLower) || (isMultiWord && normalized.includes(wordNorm)))
      : (rawLower.includes(wordNorm) || normalized.includes(wordNorm));

    if (matched) {
      return {
        isClean: false,
        reason: 'Restricted: Racist language, ethnic slurs, or communal disharmony is strictly forbidden by Sampath Bank community standards.',
        detectedType: 'racist_or_ethnic_slur',
        detectedLanguage: 'Multilingual',
        matchedWord: word
      };
    }
  }

  // 2. Check Sinhala Script Profanities (සිංහල අසභ්‍ය වචන)
  for (const word of SINHALA_SCRIPT_PROFANITY) {
    if (rawLower.includes(word.toLowerCase())) {
      return {
        isClean: false,
        reason: `අවවාදයයි: "${word}" අසභ්‍ය වචන භාවිතය සම්පත් බැංකු ප්‍රජා රීති මගින් තහනම් කර ඇත (Sinhala profanity restricted).`,
        detectedType: 'profanity',
        detectedLanguage: 'Sinhala',
        matchedWord: word
      };
    }
  }

  // 3. Check Singlish Romanized Profanities
  for (const word of SINGLISH_PROFANITY) {
    const wordNorm = word.toLowerCase();
    const isMultiWord = wordNorm.includes(' ');
    const regex = new RegExp(`\\b${wordNorm}\\b`, 'i');
    if (regex.test(normalized) || regex.test(rawLower) || (isMultiWord && normalized.includes(wordNorm))) {
      return {
        isClean: false,
        reason: `Restricted: Singlish profanity / offensive slang ("${word}") detected. Please keep communications clean and respectful.`,
        detectedType: 'profanity',
        detectedLanguage: 'Singlish',
        matchedWord: word
      };
    }
  }

  // 4. Check Tamil Script Profanities (தமிழ் தகாத வார்த்தைகள்)
  for (const word of TAMIL_SCRIPT_PROFANITY) {
    if (rawLower.includes(word.toLowerCase())) {
      return {
        isClean: false,
        reason: `எச்சரிக்கை: "${word}" ஆபாசமான அல்லது தகாத வார்த்தைகள் தடைசெய்யப்பட்டுள்ளன (Tamil profanity restricted).`,
        detectedType: 'profanity',
        detectedLanguage: 'Tamil',
        matchedWord: word
      };
    }
  }

  // 5. Check Tanglish Romanized Profanities
  for (const word of TANGLISH_PROFANITY) {
    const wordNorm = word.toLowerCase();
    const isMultiWord = wordNorm.includes(' ');
    const regex = new RegExp(`\\b${wordNorm}\\b`, 'i');
    if (regex.test(normalized) || regex.test(rawLower) || (isMultiWord && normalized.includes(wordNorm))) {
      return {
        isClean: false,
        reason: `Restricted: Tanglish profanity / abusive slang ("${word}") detected.`,
        detectedType: 'profanity',
        detectedLanguage: 'Tanglish',
        matchedWord: word
      };
    }
  }

  // 6. Check English Profanities
  for (const word of ENGLISH_PROFANITY) {
    const wordNorm = word.toLowerCase();
    const regex = new RegExp(`\\b${wordNorm}\\b`, 'i');
    if (regex.test(normalized) || regex.test(rawLower)) {
      return {
        isClean: false,
        reason: `Restricted: English profanity / vulgarity ("${word}") is not permitted.`,
        detectedType: 'profanity',
        detectedLanguage: 'English',
        matchedWord: word
      };
    }
  }

  // 7. Check if user input does not make any sense or contains meaningless words / invalid Singlish
  const nonsenseCheck = isNonsensicalText(text);
  if (nonsenseCheck.isNonsense) {
    return {
      isClean: false,
      reason: `Flagged as profanity: Input contains words or Singlish terms with no valid meaning when converted to English, Sinhala, or Singlish (${nonsenseCheck.detail || 'meaningless words are banned from entering'}).`,
      detectedType: 'profanity',
      detectedLanguage: 'Singlish',
      matchedWord: nonsenseCheck.detail || 'nonsensical_input'
    };
  }

  return { isClean: true };
}
