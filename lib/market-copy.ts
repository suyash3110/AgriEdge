import { local } from "./locale";
const names: Record<string, [string, string]> = {
  wheat: ["गेहूँ", "गहू"], gram: ["चना", "हरभरा"], rice: ["चावल", "तांदूळ"], paddy: ["धान", "भात"],
  maize: ["मक्का", "मका"], tomato: ["टमाटर", "टोमॅटो"], onion: ["प्याज", "कांदा"], potato: ["आलू", "बटाटा"],
  groundnut: ["मूँगफली", "भुईमूग"], mustard: ["सरसों", "मोहरी"], sorghum: ["ज्वार", "ज्वारी"],
  "cucumbar(kheera)": ["खीरा", "काकडी"], cabbage: ["पत्तागोभी", "कोबी"], "green chilli": ["हरी मिर्च", "हिरवी मिरची"],
  pumpkin: ["कद्दू", "भोपळा"], carrot: ["गाजर", "गाजर"], "coriander(leaves)": ["धनिया पत्ती", "कोथिंबीर"],
  "bhindi(ladies finger)": ["भिंडी", "भेंडी"], garlic: ["लहसुन", "लसूण"], brinjal: ["बैंगन", "वांगी"],
  cauliflower: ["फूलगोभी", "फुलकोबी"], "ginger(green)": ["अदरक", "आले"], raddish: ["मूली", "मुळा"],
  drumstick: ["सहजन", "शेवगा"], banana: ["केला", "केळी"], papaya: ["पपीता", "पपई"], grapes: ["अंगूर", "द्राक्षे"],
  "mousambi(sweet lime)": ["मौसंबी", "मोसंबी"], "ridgeguard(tori)": ["तुरई", "दोडका"], apple: ["सेब", "सफरचंद"],
  soyabean: ["सोयाबीन", "सोयाबीन"], pomegranate: ["अनार", "डाळिंब"], spinach: ["पालक", "पालक"],
  guar: ["ग्वार", "गवार"], "methi(leaves)": ["मेथी पत्ती", "मेथी"], "pointed gourd(parval)": ["परवल", "परवल"],
  "chili red": ["लाल मिर्च", "लाल मिरची"], "corriander seed": ["धनिया बीज", "धणे"],
  "chilly capsicum": ["शिमला मिर्च", "ढोबळी मिरची"], "red gram/arhar/tur(whole)": ["अरहर", "तूर"],
  "little gourd(kundru)": ["कुंदरू", "तोंडली"], "peas wet": ["हरे मटर", "हिरवे वाटाणे"], pineapple: ["अनानास", "अननस"],
  beetroot: ["चुकंदर", "बीट"], lime: ["नींबू", "लिंबू"], "bitter gourd": ["करेला", "कारले"],
  "bottle gourd": ["लौकी", "दुधी भोपळा"], orange: ["संतरा", "संत्री"], "chikoos(sapota)": ["चीकू", "चिकू"],
  "mango(raw-ripe)": ["आम (कच्चा-पका)", "आंबा (कच्चा-पिकलेला)"],
  "Non-FAQ": ["सामान्य उचित गुणवत्ता से भिन्न", "सामान्य योग्य गुणवत्तेपेक्षा वेगळा"],
  unspecified: ["ग्रेड उपलब्ध नहीं", "दर्जा उपलब्ध नाही"],
  Nagpur: ["नागपुर", "नागपूर"],
  Hingna: ["हिंगना", "हिंगणा"],
  Kamthi: ["कामठी", "कामठी"],
  Kamptee: ["कामठी", "कामठी"],
  Umared: ["उमरेड", "उमरेड"],
  Ramtek: ["रामटेक", "रामटेक"],
  Savner: ["सावनेर", "सावनेर"],
  Katol: ["काटोल", "काटोल"],
  Narkhed: ["नरखेड़", "नरखेड"],
  Parseoni: ["पारशिवनी", "पारशिवनी"],
  Kalmeshwar: ["कलमेश्वर", "कळमेश्वर"],
  Mauda: ["मौदा", "मौदा"],
  Local: ["स्थानीय", "स्थानिक"],
  Other: ["अन्य", "इतर"],
  "Red Local": ["लाल स्थानीय", "लाल स्थानिक"],
  FAQ: ["सामान्य उचित गुणवत्ता", "सामान्य योग्य गुणवत्ता"],
};
export function marketCopy(locale: string, value: string): string {
  if (locale === "en") return value;
  const exact = names[value] || names[value.toLowerCase()];
  if (exact) return exact[locale === "mr" ? 1 : 0];
  return value
    .split(/([,\s/·]+)/)
    .map((part) =>
      part === "APMC"
        ? local(locale, part, "कृषि उपज मंडी", "कृषी उत्पन्न बाजार समिती")
        : (names[part]?.[locale === "mr" ? 1 : 0] ?? part),
    )
    .join("");
}
