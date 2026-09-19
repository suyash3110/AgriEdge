import Link from "next/link";
import Image from "next/image";
import LanguageSwitch from "./LanguageSwitch";
import { local, pilot, services } from "@/lib/locale";
export default function PublicHeader({
  locale,
  login = false,
}: {
  locale: string;
  login?: boolean;
}) {
  return (
    <>
      <div className="utility">
        <span>
          {pilot(locale)} · {services(locale)}
        </span>
        <LanguageSwitch locale={locale} />
      </div>
      <header className="brand public-brand">
        <Link className="brand-home" href={"/" + locale} prefetch={false}>
          <Image
            src="/images/agriedge-logo.jpg"
            alt=""
            width={54}
            height={58}
            priority
          />
          <strong>AgriEdge</strong>
        </Link>
        {!login && (
          <Link
            className="signin-link"
            prefetch={false}
            href={"/" + locale + "/login"}
          >
            {local(
              locale,
              "Sign in | Login",
              "साइन इन | लॉगिन",
              "साइन इन | लॉगिन",
            )}
          </Link>
        )}
      </header>
      <div className="nav-band">
        <span>{services(locale)}</span>
        <span>
          {local(
            locale,
            "NAGPUR PILOT",
            "नागपुर पायलट",
            "नागपूर पथदर्शी प्रकल्प",
          )}
        </span>
      </div>
      <div className="reference-divider" />
    </>
  );
}
