import { local } from "@/lib/locale";
import { sectionAllowed } from "@/lib/access";
import { redirect, notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { portalData } from "@/lib/portal-data";
import Portal from "@/components/Portal";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; section: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, section } = await params;
  if (!["en", "hi", "mr"].includes(locale)) notFound();
  const c = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);
  const user = await currentUser();
  if (!user) redirect("/" + locale + "/login");
  if (!sectionAllowed(user, section))
    return (
      <main className="standalone">
        <h1>{c("Permission denied", "अनुमति नहीं है", "परवानगी नाही")}</h1>
        <p>
          {c(
            "Your role or FPO staff grant does not allow this service.",
            "आपकी भूमिका या संगठन की अनुमति में यह सेवा शामिल नहीं है।",
            "तुमच्या भूमिकेला किंवा संस्थेच्या परवानगीला ही सेवा उपलब्ध नाही.",
          )}
        </p>
      </main>
    );
  if (user.suspended)
    return (
      <main className="standalone">
        <h1>{c("Account suspended", "खाता निलंबित है", "खाते निलंबित आहे")}</h1>
        <p>
          {c(
            "Contact your FPO or platform administrator for review.",
            "समीक्षा के लिए अपने संगठन या प्रशासक से संपर्क करें।",
            "पुनरावलोकनासाठी तुमच्या संस्थेशी किंवा प्रशासकाशी संपर्क साधा.",
          )}
        </p>
      </main>
    );
  const page = Math.max(
    1,
    Math.min(10000, Number((await searchParams).page) || 1),
  );
  return (
    <Portal
      data={await portalData(user, page)}
      locale={locale}
      section={section}
      page={page}
    />
  );
}
