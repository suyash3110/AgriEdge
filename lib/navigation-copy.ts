import { local } from "./locale";
export const roleName = (locale: string, role: string) =>
  ({
    farmer: local(locale, "Farmer", "किसान", "शेतकरी"),
    buyer: local(locale, "Buyer", "खरीदार", "खरेदीदार"),
    fpo: "FPO",
    transporter: local(locale, "Transporter", "परिवहनकर्ता", "वाहतूकदार"),
    admin: local(locale, "Administrator", "प्रशासक", "प्रशासक"),
  })[role] || role;
const marathi: Record<string, string> = {
  jobs: "माझी कामे",
  models: "कृत्रिम बुद्धिमत्ता आणि मॉडेल",
  reported: "तक्रार केलेले संदेश",
  dashboard: "डॅशबोर्ड",
  profile: "प्रोफाइल आणि पिके",
  prices: "बाजारभाव",
  lots: "शेतमाल",
  bids: "बोली",
  circles: "हार्वेस्ट सर्कल",
  quality: "गुणवत्ता तपासणी",
  warehouse: "गोदाम",
  transactions: "व्यवहार",
  transport: "वाहतूक",
  assistant: "कृषी सहाय्यक",
  schemes: "शासकीय योजना",
  messages: "संदेश",
  notifications: "सूचना",
  disputes: "तक्रारी",
  farmers: "शेतकरी",
  collection: "संकलन केंद्र",
  inventory: "साठा",
  staff: "कर्मचारी परवानग्या",
  reports: "अहवाल",
  demand: "खरेदीदारांची मागणी",
  vehicles: "माझी वाहने",
  earnings: "कमाई",
  verification: "सत्यापन",
  users: "सहभागी",
  imports: "CSV आयात",
  audit: "तपासणी नोंदी",
  payments: "भरणे",
  settings: "सेटिंग्ज",
};
export function navName(locale: string, key: string, en: string, hi: string) {
  return locale === "mr" ? marathi[key] || en : locale === "hi" ? hi : en;
}
