import { DEPARTMENT_BY_CATEGORY, type Ticket, type Category, type Severity } from "./ticket";

const words: [Category, string[]][] = [
  ["Roads", ["pothole", "road collapse", "markings", "गड्ढ", "gaddha", "ಗುಂಡಿ", "gundi", "பள்ளம்", "pallam"]],
  ["Waste", ["garbage", "litter", "waste", "kachra", "कचरा", "कूड़ा", "ಕಸ", "kasa", "குப்பை", "kuppai"]],
  ["Water", ["pipe", "water supply", "leak", "pani", "पानी", "ನೀರು", "neeru", "தண்ணீர்", "thanneer"]],
  ["Electricity", ["wire", "streetlight", "street light", "electric", "बिजली", "bijli", "ತಂತಿ", "tanti", "மின்கம்பி", "minkambi"]],
  ["Trees", ["tree", "branch", "पेड़", "ped gir", "ಮರ", "mara", "மரம்", "maram"]],
  ["Drainage", ["drain", "manhole", "waterlogging", "नाली", "nali", "ಚರಂಡಿ", "charandi", "சாக்கடை", "saakkadai"]],
];

export function fallback(text: string) {
  const lower = text.toLowerCase();
  const matches = (list: string[]) => list.some(word => lower.includes(word));
  const category = words.find(([, list]) => matches(list))?.[0] ?? "Other";
  let severity: Severity = "Medium";
  if (matches(["live wire", "open manhole", "blocking", "collapsed", "fire", "electric shock"])) severity = "Critical";
  else if (matches(["school", "hospital", "burst", "flood"])) severity = "High";
  const scripts = [["Hindi", /[\u0900-\u097f]/], ["Kannada", /[\u0c80-\u0cff]/], ["Tamil", /[\u0b80-\u0bff]/]] as const;
  return {
    detectedLanguage: scripts.find(([, script]) => script.test(text))?.[0] ?? "Unknown",
    englishSummary: text.trim().split(/\s+/).slice(0,25).join(" "), category, severity,
    severityReason: "Keyword-based estimate; AI triage unavailable.",
    department: DEPARTMENT_BY_CATEGORY[category], source: "fallback", needsManualReview: true,
  } satisfies Partial<Ticket>;
}
