import { DEPARTMENT_BY_CATEGORY, type Category, type Severity, type Ticket } from "../lib/ticket";

const examples: [string, string, string, Category, Severity, string][] = [
  ["Kannada", "ನಿನ್ನೆ ರಾತ್ರಿ ಮಳೆ ಬಂದ ನಂತರ ಬಸ್ ನಿಲ್ದಾಣದ ಹತ್ತಿರ ಕಂಬದಿಂದ ವಿದ್ಯುತ್ ತಂತಿ ತುಂಬಾ ಕೆಳಗೆ ನೇತಾಡುತ್ತಿದೆ.", "A live wire hangs low near a bus stop after last night's rain.", "Electricity", "Critical", "Exposed live wire near a bus stop risks electrocution."],
  ["English", "A large tree has fallen across the main road near the market. Vehicles cannot pass.", "A fallen tree blocks the main road near the market.", "Trees", "Critical", "Fallen tree fully blocks a main road."],
  ["Hindi", "सुबह से सड़क पर पानी का पाइप फटा हुआ है। गली और दुकानों में पानी भर रहा है।", "A burst water pipe has been flooding the lane and shops since morning.", "Water", "High", "Heavy continuous leak is flooding a lane and wasting supply."],
  ["Tamil", "தொடக்கப் பள்ளி வாசல் அருகே சாக்கடை மூடி காணவில்லை. குழந்தைகள் தினமும் அந்த வழியாக நடந்து செல்கிறார்கள்.", "A drain cover is missing near a primary school entrance where children walk.", "Drainage", "High", "Uncovered drain beside a school entrance is a fall hazard for children."],
  ["English", "Garbage has not been collected from our street for four days. The bins are overflowing.", "Waste bins are overflowing after four days without collection.", "Waste", "Medium", "Multi-day uncollected waste is a hygiene issue but no immediate danger."],
  ["Hindi", "पार्क के पास वाली गली में गहरा गड्ढा है। दोपहिया वाहन वहाँ धीरे चलते हैं।", "A deep pothole on a side road near the park slows two-wheelers.", "Roads", "Medium", "Moderate pothole on a side street causes inconvenience, not blockage."],
  ["Kannada", "ನಮ್ಮ ಬೀದಿಯಲ್ಲಿ ಒಂದು ದೀಪ ರಾತ್ರಿ ಮಿನುಗುತ್ತಿರುತ್ತದೆ. ಉಳಿದ ದೀಪಗಳು ಸರಿಯಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿವೆ.", "One streetlight flickers at night while the other lights on the lane work.", "Electricity", "Low", "Single flickering light with neighbouring lights working."],
  ["English", "The zebra crossing paint has faded near the bus depot.", "Zebra crossing markings have faded near the bus depot.", "Roads", "Low", "Faded markings are a minor, non-urgent maintenance issue."],
];

export function seedTickets(): Ticket[] {
  const now = Date.now();
  return examples.map(([detectedLanguage, originalText, englishSummary, category, severity, severityReason], index) => ({
    id: crypto.randomUUID(), createdAt: new Date(now - (8 - index) * 3600000).toISOString(),
    originalText, detectedLanguage, englishSummary, category, severity, severityReason,
    department: DEPARTMENT_BY_CATEGORY[category], source: "ai", needsManualReview: false, isSeed: true,
  }));
}
