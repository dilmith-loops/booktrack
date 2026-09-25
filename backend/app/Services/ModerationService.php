<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ModerationService
{
    protected ?string $apiKey;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
    }

    /**
     * Check if Multilingual Profanity Filter is active.
     */
    public function isProfanityFilterEnabled(): bool
    {
        $filePath = storage_path('app/moderation_settings.json');
        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            if (is_array($data) && isset($data['profanityFilter'])) {
                return (bool) $data['profanityFilter'];
            }
        }
        return true;
    }

    /**
     * Check if Image Multimodal Guardian is active.
     */
    public function isImageGuardianEnabled(): bool
    {
        $filePath = storage_path('app/moderation_settings.json');
        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            if (is_array($data) && isset($data['imageGuardian'])) {
                return (bool) $data['imageGuardian'];
            }
        }
        return true;
    }

    /**
     * Check if Auto AI Spot Verification is active.
     */
    public function isAiSpotVerificationEnabled(): bool
    {
        $filePath = storage_path('app/moderation_settings.json');
        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            if (is_array($data) && isset($data['aiSpotVerification'])) {
                return (bool) $data['aiSpotVerification'];
            }
        }
        return true;
    }

    /**
     * Authentic Sinhala, Singlish, and literary vocabulary that should NEVER be flagged as gibberish
     */
    protected const AUTHENTIC_SINHALA_SINGLISH_VOCAB = [
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
    ];

    protected const VALID_NO_VOWEL_TOKENS = [
        'bmich', 'lkr', 'plc', 'isbn', 'pdf', 'mp3', 'dvd', 'cd', 'tv',
        'vol', 'ed', 'pp', 'rs', 'mr', 'mrs', 'dr', 'st', 'rd', 'sl', 'txt',
        'sms', 'cctv', 'pvt', 'ltd', 'fm', 'slbc', 'itn', 'rupavahini'
    ];

    /**
     * Checks if input contains nonsensical text, keyboard mashing, or repeated letter spam
     */
    public function isNonsensicalText(string $text): array
    {
        $trimmed = trim($text);
        if ($trimmed === '') {
            return ['isNonsense' => false];
        }

        // 1. Symbol or numeric spam with no letters
        if (preg_match('/^[^\p{L}]+$/u', $trimmed) && mb_strlen($trimmed) >= 3) {
            return [
                'isNonsense' => true,
                'detail' => 'Input contains only symbols or numbers with no words.'
            ];
        }

        // 2. Character repetition (4+ times)
        if (preg_match('/([a-zA-Z])\1{3,}/i', $trimmed)) {
            return [
                'isNonsense' => true,
                'detail' => 'Repeated character spam detected.'
            ];
        }

        // 3. Indic scripts (Sinhala / Tamil)
        if (preg_match('/[\x{0D80}-\x{0DFF}]/u', $trimmed)) {
            if (preg_match('/([\x{0D80}-\x{0DFF}])\1{4,}/u', $trimmed)) {
                return ['isNonsense' => true, 'detail' => 'Repeated Sinhala character spam detected.'];
            }
            if (preg_match('/[\x{0DCA}]{2,}/u', $trimmed)) {
                return ['isNonsense' => true, 'detail' => 'Invalid character cluster in Sinhala script detected.'];
            }
            if (preg_match('/^[\x{0D80}-\x{0DFF}\s\d\p{P}]+$/u', $trimmed)) {
                return ['isNonsense' => false];
            }
        }

        if (preg_match('/[\x{0B80}-\x{0BFF}]/u', $trimmed)) {
            if (preg_match('/([\x{0B80}-\x{0BFF}])\1{4,}/u', $trimmed)) {
                return ['isNonsense' => true, 'detail' => 'Repeated Tamil character spam detected.'];
            }
            if (preg_match('/^[\x{0B80}-\x{0BFF}\s\d\p{P}]+$/u', $trimmed)) {
                return ['isNonsense' => false];
            }
        }

        // 4. Keyboard smash row sequences
        $smashPatterns = [
            'asdfgh', 'asdfjkl', 'dfghjkl', 'fghjkl', 'ghjkl',
            'qwerty', 'wertyu', 'ertyui', 'rtyuio', 'tyuiop',
            'zxcvbn', 'xcvbnm', 'lkjhgf', 'kjhgfd', 'jhgfds', 'poiuyt',
            'mnbvcx', 'qazwsx', 'wsxedc', 'edcrfv', 'rfvtgb', 'yhnujm',
            'sdfsdf', 'fjskdf', 'shkdfj', 'kjsdhf', 'weripou'
        ];
        $compact = strtolower(preg_replace('/[^a-z0-9]/', '', $trimmed));
        foreach ($smashPatterns as $smash) {
            if (str_contains($compact, $smash) && strlen($compact) <= strlen($smash) + 4) {
                return ['isNonsense' => true, 'detail' => 'Keyboard row mash detected.'];
            }
        }

        // 5. Word analysis
        $words = preg_split('/\s+/u', $trimmed);
        $vocabSet = array_flip(self::AUTHENTIC_SINHALA_SINGLISH_VOCAB);
        $noVowelTokens = array_flip(self::VALID_NO_VOWEL_TOKENS);

        foreach ($words as $w) {
            $cleanWord = strtolower(preg_replace('/[^a-zA-Z]/', '', $w));
            if ($cleanWord === '') continue;

            if (isset($vocabSet[$cleanWord])) continue;

            // Repeated syllable loops in single word (e.g. asdasdasd)
            if (strlen($cleanWord) >= 6 && preg_match('/(.{2,4})\1{2,}/i', $cleanWord)) {
                return ['isNonsense' => true, 'detail' => "Repetitive keyboard loop in '{$w}' detected."];
            }

            // Word without vowels (not a standard token)
            if (strlen($cleanWord) >= 3 && !preg_match('/[aeiouy]/i', $cleanWord) && !isset($noVowelTokens[$cleanWord])) {
                return ['isNonsense' => true, 'detail' => "Meaningless word '{$w}' without vowels detected."];
            }
        }

        return ['isNonsense' => false];
    }

    /**
     * Local regex pattern check for profanity, slurs, and communal peace violations
     */
    public function checkLocalProfanity(string $text): array
    {
        if (!$this->isProfanityFilterEnabled()) {
            return ['isClean' => true];
        }

        if (trim($text) === '') {
            return ['isClean' => true];
        }

        // 1. Check for gibberish / nonsensical text
        $nonsenseCheck = $this->isNonsensicalText($text);
        if ($nonsenseCheck['isNonsense']) {
            return [
                'isClean' => false,
                'reason' => 'Flagged as profanity: Input is nonsensical gibberish, meaningless pseudo-words, or keyboard mashing.',
                'detectedType' => 'profanity',
                'matchedWord' => $nonsenseCheck['detail'] ?? 'gibberish'
            ];
        }

        $lower = mb_strtolower($text, 'UTF-8');

        // Check for legitimate folk stories / literary titles exception
        $hasLiteraryPhrase = str_contains($lower, 'kata katha') ||
            str_contains($lower, 'katakatha') ||
            str_contains($lower, 'කටකතා') ||
            str_contains($lower, 'කට කතා') ||
            str_contains($lower, 'natat ayek') ||
            str_contains($lower, 'natath ayek') ||
            str_contains($lower, 'suramathin') ||
            str_contains($lower, 'නැතත් අයෙක් සුරමතින්');

        // 1. Racist / Communal Hate speech
        $hateSlurs = [
            'nigger', 'nigga', 'chink', 'kike', 'spic', 'wetback', 'faggot', 'tranny',
            'ethnic cleansing', 'subhuman', 'terrorist dog',
            'හම්බයා', 'හම්බයෝ', 'පර දෙමළා', 'මරක්කලයා', 'කල්ල තෝනි', 'ජාතිවාදී', 'මරමු', 'වර්ගවාදය', 'බෝම්බ ගහපල්ලා', 'තම්බියා', 'තම්බි',
            'hambaya', 'hambayo', 'para demala', 'marakkalaya', 'kalla thoni', 'demallu', 'thambiya', 'thambi', 'hamba balla', 'maranna ona', 'gahapalla', 'bomb gahanna', 'maramu', 'sinhalaya maramu', 'demala maramu',
            'sinhalavan', 'kallathoni', 'kolluvom', 'parayan'
        ];
        foreach ($hateSlurs as $slur) {
            if (str_contains($lower, $slur)) {
                return [
                    'isClean' => false,
                    'reason' => "Contains prohibited hate speech or communal slur: '{$slur}'",
                    'detectedType' => 'racist_or_ethnic_slur',
                    'detectedLanguage' => 'Multilingual',
                    'matchedWord' => $slur
                ];
            }
        }

        // 2. English profanity list
        $englishProfanities = [
            'fuck', 'fucker', 'fucking', 'fucked', 'fuckers', 'fuckhead', 'motherfucker', 'motherfucking',
            'shit', 'shitty', 'bullshit', 'shitting', 'shited', 'dipshit', 'horseshit',
            'bitch', 'bitches', 'bitching', 'bitchy', 'son of a bitch',
            'asshole', 'assholes', 'dumbass', 'jackass', 'badass',
            'bastard', 'bastards', 'cunt', 'cunts',
            'dick', 'dicks', 'dickhead', 'cock', 'cocks', 'cockhead',
            'pussy', 'pussies', 'whore', 'whores', 'slut', 'sluts',
            'wanker', 'twat', 'prick', 'douchebag', 'blowjob'
        ];

        foreach ($englishProfanities as $bad) {
            if (preg_match('/\b' . preg_quote($bad, '/') . '\b/i', $text) || preg_match('/\b' . preg_quote($bad, '/') . '\b/i', $lower)) {
                return [
                    'isClean' => false,
                    'reason' => "Restricted: English profanity / vulgarity ('{$bad}') is not permitted.",
                    'detectedType' => 'profanity',
                    'detectedLanguage' => 'English',
                    'matchedWord' => $bad
                ];
            }
        }

        // 3. Sinhala Unicode script swear words (සිංහල අසභ්‍ය වචන)
        $sinhalaSwears = [
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

        foreach ($sinhalaSwears as $sn) {
            if (str_contains($text, $sn)) {
                return [
                    'isClean' => false,
                    'reason' => "අවවාදයයි: '{$sn}' අසභ්‍ය වචන භාවිතය සම්පත් බැංකු ප්‍රජා රීති මගින් තහනම් කර ඇත (Sinhala profanity restricted).",
                    'detectedType' => 'profanity',
                    'detectedLanguage' => 'Sinhala',
                    'matchedWord' => $sn
                ];
            }
        }

        // 4. Singlish Romanized Sinhala Colloquial Profanities
        $singlishCurses = [
            'pakaya', 'pakayaa', 'pakayo', 'paka', 'pako', 'pakoo', 'pake', 'pakenda', 'pakada', 'pakek',
            'kariya', 'kariyaa', 'kariyo', 'kari', 'kariyek', 'kari balla', 'kari balli', 'kari hutto', 'kari pakaya', 'kariweda', 'amu kariya', 'amu kariyek',
            'hutta', 'hutto', 'hutte', 'huththe', 'huththa', 'huththi', 'huththee', 'hukapan', 'hukanna', 'hukanawa', 'hukana', 'hukanne', 'hukano',
            'wesa', 'wesi', 'wesige', 'wesiba', 'wesikema', 'wesigeputha', 'wesige putha', 'wesigeputho', 'wesige putho', 'wesikeli', 'wesa balla', 'wesa balli',
            'ponnaya', 'ponna', 'ponz', 'ponzla', 'ponnay', 'ponnayo', 'ponnayek', 'ponnayine',
            'balla', 'balli', 'ballo', 'paraya', 'parayo', 'paratti', 'kalawadda', 'payya', 'bijja',
            'ammata hukanwa', 'ammata hukanna', 'thuk nodokin', 'nodokin', 'pala hutto', 'pala pakaya', 'pala wesi',
            'avajathaka', 'gon bijja', 'gon thadiya', 'gon hutto', 'gon pakaya', 'wal balla', 'wal wesi', 'gu pakaya', 'gu kariya'
        ];

        foreach ($singlishCurses as $curse) {
            if (preg_match('/\b' . preg_quote($curse, '/') . '\b/i', $text) || str_contains($lower, $curse)) {
                return [
                    'isClean' => false,
                    'reason' => "Restricted: Singlish profanity / offensive slang ('{$curse}') detected. Please keep communications clean and respectful.",
                    'detectedType' => 'profanity',
                    'detectedLanguage' => 'Singlish',
                    'matchedWord' => $curse
                ];
            }
        }

        // 5. Tamil Unicode script profanities (தமிழ் தகாத வார்த்தைகள்)
        $tamilScriptCurses = [
            'தேவிடியா', 'தேவுடியா', 'பூல்', 'பூலு', 'ஓத்தா', 'ஓத்த', 'ஒத்தா', 'ஒத்தால', 'ஒம்மால',
            'சுன்னி', 'மயிர்', 'மயிறு', 'பொட்டை', 'புண்டை', 'புண்ட', 'கூதி', 'கூதிமவன்',
            'நாயே', 'பன்னி', 'தாயோளி', 'கண்டாரோளி', 'சூத்து', 'சூத்துல'
        ];

        foreach ($tamilScriptCurses as $tm) {
            if (str_contains($text, $tm)) {
                return [
                    'isClean' => false,
                    'reason' => "எச்சரிக்கை: '{$tm}' ஆபாசமான அல்லது தகாத வார்த்தைகள் தடைசெய்யப்பட்டுள்ளன (Tamil profanity restricted).",
                    'detectedType' => 'profanity',
                    'detectedLanguage' => 'Tamil',
                    'matchedWord' => $tm
                ];
            }
        }

        // 6. Tanglish Romanized Tamil vulgarities & slang
        $tanglishCurses = [
            'thevidiya', 'thevdia', 'thevdiya', 'thevidiya paiya', 'thevdiya mavan', 'otha', 'othale', 'oththa',
            'otha gommala', 'ommale', 'poolu', 'pool', 'sunni', 'sunniya', 'sunni mavan',
            'mayiru', 'mayir', 'mayire', 'pottai', 'punda', 'pundai', 'pundamavan', 'punda mavane', 'pundakokki',
            'koothi', 'koothiyan', 'soothu', 'soothula', 'naaye', 'naaye peye', 'panni', 'pannada',
            'poramboku', 'thaayoli', 'kandaaroli', 'lavadagopal'
        ];

        foreach ($tanglishCurses as $tg) {
            if (preg_match('/\b' . preg_quote($tg, '/') . '\b/i', $text) || str_contains($lower, $tg)) {
                return [
                    'isClean' => false,
                    'reason' => "Restricted: Tanglish profanity / abusive slang ('{$tg}') detected.",
                    'detectedType' => 'profanity',
                    'detectedLanguage' => 'Tanglish',
                    'matchedWord' => $tg
                ];
            }
        }

        return ['isClean' => true];
    }

    /**
     * Moderates book spotting content using local patterns and optional Gemini AI
     */
    public function moderateContent(
        string $bookName,
        ?string $notes = null,
        ?string $shelfLocationNote = null,
        ?string $priceOrOffer = null,
        ?string $finderName = null,
        ?string $stallName = null
    ): array {
        if (!$this->isProfanityFilterEnabled()) {
            return ['isClean' => true];
        }

        $combinedText = implode(' ', array_filter([
            $bookName, $notes, $shelfLocationNote, $priceOrOffer, $finderName, $stallName
        ]));

        $localCheck = $this->checkLocalProfanity($combinedText);
        if (!$localCheck['isClean']) {
            return $localCheck;
        }

        if (empty($this->apiKey)) {
            return ['isClean' => true];
        }

        try {
            $prompt = <<<PROMPT
You are the Sampath Bank AI Community Peace & Safety Guardian for the BMICH Colombo Book Fair 2026.
Zero tolerance for profanity, racism, ethnic hatred, violence, or gibberish.
Analyze this book submission:
Book Title: "{$bookName}"
Notes: "{$notes}"
Shelf Location: "{$shelfLocationNote}"
Price / Offer: "{$priceOrOffer}"
Finder: "{$finderName}"
Stall: "{$stallName}"

Respond ONLY with valid JSON in this exact structure:
{
  "isClean": boolean,
  "reason": "polite explanation if rejected, or empty string if approved",
  "violationType": "clean" | "profanity" | "racist_or_ethnic_slur" | "communal_peace_harm" | "harassment"
}
PROMPT;

            $response = Http::timeout(5)
                ->withoutVerifying()
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$this->apiKey}", [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature' => 0.1
                    ]
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $textResult = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                if ($textResult) {
                    $parsed = json_decode(trim($textResult), true);
                    if (isset($parsed['isClean'])) {
                        return [
                            'isClean' => (bool) $parsed['isClean'],
                            'reason' => $parsed['reason'] ?? ($parsed['isClean'] ? null : 'Flagged by Sampath AI Safety Moderation.'),
                            'detectedType' => $parsed['violationType'] ?? 'profanity'
                        ];
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Gemini moderation fallback: ' . $e->getMessage());
        }

        return ['isClean' => true];
    }

    /**
     * Dual-space RGB + YCbCr heuristic for human skin pixels across diverse skin tones.
     */
    protected function isSkinPixelRgbYcbcr(int $r, int $g, int $b): bool
    {
        if ($r <= 95 || $g <= 40 || $b <= 20) {
            return false;
        }

        if (($r - $g) < 15 || ($r - $b) < 15) {
            return false;
        }

        $cb = 128 - (0.168736 * $r) - (0.331264 * $g) + (0.5 * $b);
        $cr = 128 + (0.5 * $r) - (0.418688 * $g) - (0.081312 * $b);

        // Human skin tone in YCbCr requires Cb in [77, 125], Cr in [135, 173] AND distinct reddish bias (Cr - Cb >= 12)
        return ($cb >= 77 && $cb <= 125 && $cr >= 135 && $cr <= 173 && ($cr - $cb) >= 12);
    }

    /**
     * Inspects image binary data locally using GD for excessive skin exposure / swimwear / vulgarity.
     */
    public function analyzeImageLocally(string $binaryData): array
    {
        if (!extension_loaded('gd')) {
            return ['isClean' => true];
        }

        $srcImg = @imagecreatefromstring($binaryData);
        if (!$srcImg) {
            return ['isClean' => true];
        }

        $sampleSize = 100;
        $thumb = imagecreatetruecolor($sampleSize, $sampleSize);
        $srcW = imagesx($srcImg);
        $srcH = imagesy($srcImg);

        imagecopyresampled($thumb, $srcImg, 0, 0, 0, 0, $sampleSize, $sampleSize, $srcW, $srcH);
        imagedestroy($srcImg);

        $totalPixels = 0;
        $skinPixels = 0;

        for ($y = 0; $y < $sampleSize; $y++) {
            for ($x = 0; $x < $sampleSize; $x++) {
                $rgb = imagecolorat($thumb, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;

                $totalPixels++;
                if ($this->isSkinPixelRgbYcbcr($r, $g, $b)) {
                    $skinPixels++;
                }
            }
        }

        imagedestroy($thumb);

        if ($totalPixels === 0) {
            return ['isClean' => true];
        }

        $skinRatio = $skinPixels / $totalPixels;
        $skinPct = round($skinRatio * 100);

        // Threshold:
        // Book covers / stalls have <= 6% skin pixels.
        // Swimwear, bikinis, lingerie, or revealing photos have 30% - 60%+ skin pixels.
        if ($skinRatio >= 0.22) {
            return [
                'isClean' => false,
                'reason' => "Excessive skin exposure ({$skinPct}%) or swimwear/revealing attire detected. Prohibited under Google Safety and Sampath Book Finder policies."
            ];
        }

        return ['isClean' => true, 'skinPercentage' => $skinPct];
    }

    /**
     * Moderates uploaded image (base64 or URL)
     */
    public function moderateImage(?string $imageDataUrlOrUrl): array
    {
        if (!$this->isImageGuardianEnabled()) {
            return ['isClean' => true];
        }

        if (empty($imageDataUrlOrUrl)) {
            return ['isClean' => true];
        }

        if (str_starts_with($imageDataUrlOrUrl, 'https://images.unsplash.com/')) {
            return ['isClean' => true];
        }

        $rawBinary = null;
        $mimeType = 'image/jpeg';
        $base64Data = null;

        if (preg_match('/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/', $imageDataUrlOrUrl, $matches)) {
            $rawMime = strtolower($matches[1]);
            $mimeType = $rawMime === 'image/jpg' ? 'image/jpeg' : $rawMime;
            $base64Data = $matches[2];
            $rawBinary = base64_decode($base64Data);
        } elseif (filter_var($imageDataUrlOrUrl, FILTER_VALIDATE_URL)) {
            try {
                $download = Http::timeout(5)->withoutVerifying()->get($imageDataUrlOrUrl);
                if ($download->successful()) {
                    $rawBinary = $download->body();
                    $base64Data = base64_encode($rawBinary);
                }
            } catch (\Throwable $e) {
                // Ignore download failure
            }
        }

        // 1. Strict Gemini AI Vision Inspection
        if (!empty($this->apiKey) && !empty($base64Data)) {
            try {
                $prompt = 'You are the Strict Image Safety Guardian for Sampath Book Finder at BMICH Colombo Book Fair. ' .
                    'STRICT POLICY: Reject any photo with excessive skin exposure, bikinis, swimwear, lingerie, underwear, cleavage, ' .
                    'bare midriff, vulgarity, suggestive poses, or sexual content. Only genuine book covers, pages, and book fair stalls are permitted. ' .
                    'Respond ONLY with valid JSON: {"isClean": boolean, "reason": "reason if rejected"}';

                $response = Http::timeout(10)
                    ->withoutVerifying()
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$this->apiKey}", [
                        'contents' => [
                            [
                                'parts' => [
                                    ['text' => $prompt],
                                    [
                                        'inline_data' => [
                                            'mime_type' => $mimeType,
                                            'data' => $base64Data
                                        ]
                                    ]
                                ]
                            ]
                        ],
                        'safetySettings' => [
                            [
                                'category' => 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                                'threshold' => 'BLOCK_LOW_AND_ABOVE'
                            ],
                            [
                                'category' => 'HARM_CATEGORY_HATE_SPEECH',
                                'threshold' => 'BLOCK_LOW_AND_ABOVE'
                            ],
                            [
                                'category' => 'HARM_CATEGORY_HARASSMENT',
                                'threshold' => 'BLOCK_LOW_AND_ABOVE'
                            ],
                            [
                                'category' => 'HARM_CATEGORY_DANGEROUS_CONTENT',
                                'threshold' => 'BLOCK_LOW_AND_ABOVE'
                            ]
                        ],
                        'generationConfig' => [
                            'responseMimeType' => 'application/json',
                            'temperature' => 0.1
                        ]
                    ]);

                if ($response->successful()) {
                    $data = $response->json();
                    
                    // Check if blocked by safety settings directly
                    $candidate = $data['candidates'][0] ?? null;
                    if ($candidate && isset($candidate['finishReason']) && $candidate['finishReason'] === 'SAFETY') {
                        return [
                            'isClean' => false,
                            'reason' => 'Photo blocked by AI Safety Shield: Violates Google policies against sexually explicit or suggestive content.'
                        ];
                    }

                    $textResult = $candidate['content']['parts'][0]['text'] ?? '';
                    if ($textResult) {
                        $parsed = json_decode(trim($textResult), true);
                        if (isset($parsed['isClean'])) {
                            return [
                                'isClean' => (bool) $parsed['isClean'],
                                'reason' => $parsed['reason'] ?? ($parsed['isClean'] ? null : 'Image flagged by Sampath AI Safety Shield.')
                            ];
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini image moderation error: ' . $e->getMessage());
            }
        }

        // 2. Local Computer Vision Skin-Tone Fallback (runs if Gemini unavailable or network offline)
        if ($rawBinary) {
            $localAnalysis = $this->analyzeImageLocally($rawBinary);
            if (!$localAnalysis['isClean']) {
                return $localAnalysis;
            }
        }

        return ['isClean' => true];
    }
}
