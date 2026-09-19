import { local } from "./locale";
export type Scheme = {
  id: string;
  name: string;
  point: string;
  url: string;
  image: string;
  state: boolean;
};
export function schemeCatalogue(locale: string): Scheme[] {
  const t = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  return [
    {
      id: "pmkisan",
      name: t(
        "PM Kisan Samman Nidhi",
        "पीएम किसान सम्मान निधि",
        "पीएम किसान सन्मान निधी",
      ),
      point: t(
        "Income support for eligible landholding farmer families. Check eligibility and payment status.",
        "पात्र भूमिधारक किसान परिवारों को आय सहायता। पात्रता और भुगतान स्थिति देखें।",
        "पात्र जमीनधारक शेतकरी कुटुंबांना आर्थिक मदत. पात्रता आणि भरण्याची स्थिती तपासा.",
      ),
      url: "https://pmkisan.gov.in/",
      image: "/images/scheme-income.jpg",
      state: false,
    },
    {
      id: "pmfby",
      name: t(
        "PM Fasal Bima Yojana",
        "प्रधानमंत्री फसल बीमा योजना",
        "प्रधानमंत्री पीक विमा योजना",
      ),
      point: t(
        "Crop insurance for notified crops and areas. Review the current season and enrolment dates.",
        "अधिसूचित फसलों और क्षेत्रों के लिए फसल बीमा। चालू मौसम और आवेदन की तारीखें देखें।",
        "अधिसूचित पिके आणि क्षेत्रांसाठी पीक विमा. चालू हंगाम आणि अर्जाच्या तारखा पहा.",
      ),
      url: "https://pmfby.gov.in/",
      image: "/images/scheme-insurance.jpg",
      state: false,
    },
    {
      id: "soil",
      name: t(
        "Soil Health Card",
        "मृदा स्वास्थ्य कार्ड",
        "मृदा आरोग्य पत्रिका",
      ),
      point: t(
        "Soil testing information to support nutrient and fertiliser decisions.",
        "पोषक तत्व और उर्वरक संबंधी निर्णयों के लिए मिट्टी जाँच की जानकारी।",
        "अन्नद्रव्ये आणि खतांविषयी निर्णय घेण्यासाठी माती परीक्षणाची माहिती.",
      ),
      url: "https://soilhealth.dac.gov.in/",
      image: "/images/scheme-soil.jpg",
      state: false,
    },
    {
      id: "enam",
      name: t(
        "e-NAM: National Agriculture Market",
        "ई-नाम: राष्ट्रीय कृषि बाजार",
        "ई-नाम: राष्ट्रीय कृषी बाजार",
      ),
      point: t(
        "An electronic trading network connecting agricultural produce markets.",
        "कृषि उपज मंडियों को जोड़ने वाला इलेक्ट्रॉनिक व्यापार नेटवर्क।",
        "कृषी उत्पन्न बाजारांना जोडणारे इलेक्ट्रॉनिक व्यापार जाळे.",
      ),
      url: "https://enam.gov.in/",
      image: "/images/scheme-market.jpg",
      state: false,
    },
    {
      id: "solar",
      name: t("PM-KUSUM", "पीएम-कुसुम", "पीएम-कुसुम"),
      point: t(
        "Solar agriculture pumps and renewable energy support. Check current component availability.",
        "सौर कृषि पंप और नवीकरणीय ऊर्जा सहायता। चालू घटकों की उपलब्धता जाँचें।",
        "सौर कृषी पंप आणि नवीकरणीय ऊर्जा सहाय्य. सध्याच्या घटकांची उपलब्धता तपासा.",
      ),
      url: "https://mnre.gov.in/en/pradhan-mantri-kisan-urja-suraksha-evam-utthaan-mahabhiyaan-pm-kusum/",
      image: "/images/scheme-solar.jpg",
      state: false,
    },
    {
      id: "mechanisation",
      name: t(
        "Farm Mechanisation Support",
        "कृषि यंत्रीकरण सहायता",
        "कृषी यांत्रिकीकरण सहाय्य",
      ),
      point: t(
        "Explore machinery and equipment assistance through the Maharashtra farmer portal.",
        "महाराष्ट्र किसान पोर्टल पर कृषि यंत्र और उपकरण सहायता देखें।",
        "महाराष्ट्र शेतकरी पोर्टलवर कृषी यंत्रे आणि उपकरणांसाठी मदत पहा.",
      ),
      url: "https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin",
      image: "/images/scheme-tractor.jpg",
      state: true,
    },
    {
      id: "pond",
      name: t(
        "Chief Minister Sustainable Agriculture Irrigation",
        "मुख्यमंत्री शाश्वत कृषि सिंचाई",
        "मुख्यमंत्री शाश्वत कृषी सिंचन",
      ),
      point: t(
        "Review individual farm-pond assistance, eligibility and required documents on MahaDBT.",
        "महाडीबीटी पर व्यक्तिगत खेत तालाब सहायता, पात्रता और दस्तावेज देखें।",
        "महाडीबीटीवर वैयक्तिक शेततळे सहाय्य, पात्रता आणि आवश्यक कागदपत्रे पहा.",
      ),
      url: "https://mahadbt.maharashtra.gov.in/Farmer/SchemeData/SchemeData?str=E9DDFA703C38E51A62CEFB7856E29C24",
      image: "/images/scheme-pond.jpg",
      state: true,
    },
    {
      id: "orchard",
      name: t(
        "Bhausaheb Fundkar Orchard Plantation",
        "भाऊसाहेब फुंडकर बागान रोपण",
        "भाऊसाहेब फुंडकर फळबाग लागवड",
      ),
      point: t(
        "Explore orchard plantation support and current application requirements on MahaDBT.",
        "महाडीबीटी पर फल बागान सहायता और चालू आवेदन आवश्यकताएँ देखें।",
        "महाडीबीटीवर फळबाग लागवड सहाय्य आणि सध्याच्या अर्जाच्या अटी पहा.",
      ),
      url: "https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin",
      image: "/images/scheme-orchard.jpg",
      state: true,
    },
  ];
}
