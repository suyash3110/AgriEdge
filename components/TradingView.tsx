import { useCopy, useDate } from "./useCopy";
import { useLocale } from "next-intl";
import { useState } from "react";
import type { PortalData, Row } from "@/lib/portal-data";
import type { ActionSpec } from "./ActionDialog";
import { s, n, Badge, Empty, Table } from "./ui";
import { money, totalPaise } from "@/lib/domain";
import { field, select, lotFields, cropField, future, records } from "./forms";
export default function TradingView({
  data,
  section,
  open,
}: {
  data: PortalData;
  section: string;
  open: (s: ActionSpec) => void;
}) {
  const copy = useCopy();
  const date = useDate();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [selectedLots, setSelectedLots] = useState<string[]>([]);
  const role = s(data.user, "role"),
    userId = s(data.user, "id");
  const lots = data.lots.filter((r) =>
    (
      s(r, "title") +
      " " +
      s(r, "crop") +
      " " +
      copy(s(r, "title")) +
      " " +
      copy(s(r, "crop"))
    )
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  function accept(b: Row, l: Row) {
    const gross = totalPaise(s(l, "kg"), BigInt(s(b, "rate")));
    open({
      title: "Review & accept this bid",
      action: "bid.accept",
      fixed: { id: s(b, "id") },
      fields: [
        {
          name: "confirm",
          label:
            "I accept these frozen terms and commit the entire lot quantity.",
          type: "checkbox",
        },
      ],
      submit: "Accept bid & commit stock",
      descriptionMr: `${s(l, "title")} · ${s(l, "kg")} किलो · खरेदीदार ${s(b, "buyerId")} · दर ${copy(money(s(b, "rate")))}/क्विंटल · एकूण ${money(gross)} · खर्च ${s(b, "costPaise") ? money(s(b, "costPaise")) : "अज्ञात"} · वाहतूक भरणा: ${s(b, "payer") === "buyer" ? "खरेदीदार" : "विक्रेता"} · ${s(b, "terms")}। अज्ञात खर्च अज्ञात राहतील. स्वीकारल्यावर बोली बंद होईल.`,
      descriptionHi: `${s(l, "title")} · ${s(l, "kg")} किग्रा · खरीदार ${s(b, "buyerId")} · दर ${copy(money(s(b, "rate")))}/क्विंटल · कुल ${money(gross)} · खर्च ${s(b, "costPaise") ? money(s(b, "costPaise")) : "अज्ञात"} · परिवहन शुल्क: ${s(b, "payer") === "buyer" ? "खरीदार" : "विक्रेता"} · ${s(b, "terms")}। अज्ञात खर्च अज्ञात ही रहेंगे। स्वीकृति से बोली बंद हो जाएगी।`,
      description:
        s(l, "title") +
        " · " +
        s(l, "kg") +
        " kg · buyer " +
        s(b, "buyerId") +
        " · rate " +
        money(s(b, "rate")) +
        "/quintal · gross " +
        money(gross) +
        " · costs " +
        money(s(b, "costPaise") || null) +
        " · transport payer " +
        s(b, "payer") +
        " · " +
        s(b, "terms") +
        ". Unknown costs remain unknown. This closes bidding.",
    });
  }
  if (section === "demand")
    return (
      <>
        <div className="actions" style={{ marginBottom: 16 }}>
          {role === "buyer" && (
            <button
              onClick={() =>
                open({
                  title: "Publish buyer demand",
                  action: "demand.create",
                  fields: [
                    cropField(),
                    select(
                      "category",
                      "Category",
                      ["produce", "residue"],
                      "produce",
                    ),
                    field("kg", "Required quantity (kg)", "", "decimal"),
                    field("grade", "Quality basis", "FAQ"),
                    field("location", "Delivery area", "Nagpur"),
                    field("deadline", "Demand deadline", future(), "date"),
                    field(
                      "terms",
                      "Payment and delivery terms",
                      "",
                      "textarea",
                    ),
                  ],
                })
              }
            >
              {copy(" ＋ Post demand ")}
            </button>
          )}
        </div>
        <section className="panel">
          <Table
            headers={[
              "Commodity",
              "Quantity",
              "Quality & terms",
              "Location",
              "Deadline",
            ]}
            empty={!data.demands.length}
          >
            {data.demands.map((r) => (
              <tr key={s(r, "id")}>
                <td>
                  <strong>{copy(s(r, "crop"))}</strong>
                  <small>{copy(s(r, "category"))}</small>
                </td>
                <td>
                  {s(r, "kg")}
                  {copy(" kg")}
                </td>
                <td>
                  {copy(s(r, "grade"))}
                  <small>{copy(s(r, "terms"))}</small>
                </td>
                <td>{copy(s(r, "location"))}</td>
                <td>{date(r.deadline)}</td>
              </tr>
            ))}
          </Table>
        </section>
      </>
    );
  if (section === "bids")
    return (
      <>
        <div className="notice info">
          {copy(
            " Highest and latest offers are different. Sellers may select any valid offer after reviewing costs and terms. ",
          )}
        </div>
        <section className="panel">
          <Table
            headers={[
              "Lot / buyer",
              "Rate per quintal",
              "Costs & terms",
              "Status",
              "Action",
            ]}
            empty={!data.bids.length}
          >
            {data.bids
              .filter((b) => role !== "buyer" || s(b, "buyerId") === userId)
              .map((b) => {
                const lot = data.lots.find((l) => s(l, "id") === s(b, "lotId"));
                return (
                  <tr key={s(b, "id")}>
                    <td>
                      {lot ? s(lot, "title") : s(b, "lotId")}
                      <small>{s(b, "buyerId")}</small>
                    </td>
                    <td>{copy(money(s(b, "rate")))}</td>
                    <td>
                      {copy(money(s(b, "costPaise") || null))}
                      <small>{copy(s(b, "terms"))}</small>
                    </td>
                    <td>
                      <Badge value={s(b, "status")} />
                    </td>
                    <td>
                      {s(b, "status") === "active" &&
                        b.eligible === true &&
                        lot &&
                        (s(lot, "ownerId") === userId ? (
                          <button
                            className="small"
                            onClick={() => accept(b, lot)}
                          >
                            {copy(" Review & accept ")}
                          </button>
                        ) : s(b, "buyerId") === userId ? (
                          <button
                            className="secondary small"
                            onClick={() =>
                              open({
                                title: "Withdraw active bid",
                                action: "bid.withdraw",
                                fixed: { id: s(b, "id") },
                                fields: [],
                                description:
                                  "The seller will no longer be able to accept this offer.",
                              })
                            }
                          >
                            {copy(" Withdraw ")}
                          </button>
                        ) : null)}
                    </td>
                  </tr>
                );
              })}
          </Table>
        </section>
      </>
    );
  return (
    <>
      <div className="filter-row">
        <input
          aria-label={copy("Search lots")}
          placeholder={copy("Search crop or listing / उपज खोजें")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {["farmer", "fpo"].includes(role) && (
          <button
            onClick={() =>
              open({
                title: "Create produce or residue draft",
                action: "lot.create",
                fields: role === "fpo" ? [records("ownerId", "Farmer owner", data.users.filter((u) => s(u, "role") === "farmer"), "name"), ...lotFields(locale), select("grade", "FPO assigned grade (optional)", ["", "A", "B", "C"], "", false)] : lotFields(locale),
                description:
                  "Use measured kilograms. Residue listings also require material, form, intended use and contamination information.",
              })
            }
          >
            {locale === "hi" ? "＋ उपज सूची बनाएँ" : copy("＋ Create listing")}
          </button>
        )}
        {["buyer", "fpo"].includes(role) && selectedLots.length >= 2 && (
          <button onClick={() => open({ title: "Create Harvest Circle from selected lots", action: "circle.requestLots", fixed: { lotIds: selectedLots }, fields: [records("demandId", "Matching buyer demand", data.demands, "crop"), field("name", "Circle name"), field("minimumKg", "Minimum viable quantity (kg)", "1", "decimal"), field("hub", "Collection hub", "Nagpur Kisan collection centre"), field("deadline", "Response deadline", future(), "date")] })}>
            {copy(`Create Harvest Circle (${selectedLots.length})`)}
          </button>
        )}
      </div>
      {!lots.length ? (
        <section className="panel">
          <Empty
            title="No matching listings"
            description="Change the search or create your first produce/residue draft."
          />
        </section>
      ) : (
        lots.map((l) => {
          const bids = data.bids.filter((b) => s(b, "lotId") === s(l, "id"));
          const active = bids
            .filter((b) => s(b, "status") === "active" && b.eligible)
            .sort((a, b) => n(b, "rate") - n(a, "rate"));
          const own = s(l, "ownerId") === userId;
          return (
            <section className="panel" key={s(l, "id")}>
              <div className="panel-heading">
                <div>
                  <h2>{copy(s(l, "title"))}</h2>
                  {["buyer", "fpo"].includes(role) && s(l, "status") === "open" && s(l, "fpoId") && <label className="lot-selector"><input type="checkbox" checked={selectedLots.includes(s(l, "id"))} onChange={(event) => setSelectedLots((current) => event.target.checked ? [...current, s(l, "id")] : current.filter((id) => id !== s(l, "id")))} /> {copy("Select for Harvest Circle")}</label>}
                  <small>
                    {copy("Farmer")}: {copy(s(l, "ownerName"))} · {copy("Trust")}: {s(l, "ownerTrustScore")}/100 · <Badge value={l.ownerTrustVerified ? "verified" : "unverified"} /> ·{" "}
                    {copy(s(l, "location"))} · {copy(s(l, "category"))} ·{" "}
                    {copy("Grade")}: {copy(s(l, "grade"))} ·{" "}
                    {copy(s(l, "gradeMethod"))}
                    {s(l, "imageAssessmentId") && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={
                            "/api/v1/quality-image?id=" +
                            s(l, "imageAssessmentId")
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {copy("View crop photo")}
                        </a>
                      </>
                    )}
                  </small>
                </div>
                <Badge value={s(l, "status")} />
              </div>
              <div className="panel-body">
                <div className="record-grid">
                  <div>
                    <span>{copy("Listed / reserved quantity")}</span>
                    <strong>
                      {s(l, "kg")} / {s(l, "reservedKg")}
                      {copy(" kg ")}
                    </strong>
                  </div>
                  <div>
                    <span>{copy("Highest active eligible bid")}</span>
                    <strong>
                      {active[0]
                        ? money(s(active[0], "rate")) + copy(" /qtl")
                        : copy("No active bids")}
                    </strong>
                  </div>
                  <div>
                    <span>{copy("Latest submitted bid")}</span>
                    <strong>
                      {bids[0]
                        ? money(s(bids[0], "rate")) + copy(" /qtl")
                        : copy("No bids yet")}
                    </strong>
                  </div>
                  <div>
                    <span>{copy("Bidding deadline · IST")}</span>
                    <strong>{date(l.deadline)}</strong>
                  </div>
                  <div>
                    <span>{copy("Expected rate / quintal")}</span>
                    <strong>{copy(money(s(l, "expectedRate")))}</strong>
                  </div>
                  <div>
                    <span>{copy("Active bids")}</span>
                    <strong>{active.length}</strong>
                  </div>
                </div>
                {s(l, "category") === "residue" && (
                  <p className="muted">
                    {copy(s(l, "material"))} · {copy(s(l, "form"))}
                    {copy(" · Intended use:")} {copy(s(l, "intendedUse"))} ·{" "}
                    {copy(s(l, "contamination"))}
                  </p>
                )}
                <div className="actions">
                  {own &&
                    s(l, "fpoId") &&
                    ["draft", "open", "paused"].includes(s(l, "status")) && (
                      <button
                        className="secondary"
                        onClick={() =>
                          open({
                            title: "Request FPO quality verification",
                            action: "quality.request",
                            fixed: { lotId: s(l, "id") },
                            fields: [
                              field(
                                "reason",
                                "Reason / supporting evidence",
                                "",
                                "textarea",
                              ),
                            ],
                          })
                        }
                      >
                        {copy("Disagree with grade? Request FPO review")}
                      </button>
                    )}
                  {own &&
                    ["draft", "open", "paused"].includes(s(l, "status")) && (
                      <>
                        {s(l, "status") !== "open" && (
                          <button
                            onClick={() =>
                              open({
                                title: "Publish listing",
                                action: "lot.status",
                                fixed: { id: s(l, "id"), status: "open" },
                                fields: [],
                              })
                            }
                          >
                            {copy(" Publish ")}
                          </button>
                        )}
                        {s(l, "status") === "open" && (
                          <button
                            className="secondary"
                            onClick={() =>
                              open({
                                title: "Pause bidding",
                                action: "lot.status",
                                fixed: { id: s(l, "id"), status: "paused" },
                                fields: [],
                              })
                            }
                          >
                            {copy(" Pause ")}
                          </button>
                        )}
                        <button
                          className="danger"
                          onClick={() =>
                            open({
                              title: "Withdraw listing",
                              action: "lot.status",
                              fixed: { id: s(l, "id"), status: "withdrawn" },
                              fields: [],
                            })
                          }
                        >
                          {copy(" Withdraw listing ")}
                        </button>
                      </>
                    )}
                  {role === "buyer" && s(l, "status") === "open" && (
                    <>
                      <button
                        onClick={() =>
                          open({
                            title: "Place a competing bid",
                            action: "bid.create",
                            fixed: { lotId: s(l, "id") },
                            description:
                              "For the full " +
                              s(l, "kg") +
                              " kg lot. Minimum increment ₹1/quintal. Submitting a bid does not close the round.",
                            descriptionMr: `संपूर्ण ${s(l, "kg")} किलो शेतमालासाठी. किमान वाढ ₹1/क्विंटल आहे. बोली नोंदवल्याने बोली प्रक्रिया बंद होत नाही.`,
                            descriptionHi: `पूरी ${s(l, "kg")} किग्रा उपज के लिए। न्यूनतम बढ़ोतरी ₹1/क्विंटल है। बोली जमा करने से बोली प्रक्रिया बंद नहीं होती।`,
                            fields: [
                              field(
                                "rate",
                                "Bid rate (₹ / quintal)",
                                active[0]
                                  ? String(n(active[0], "rate") / 100 + 1)
                                  : "",
                                "decimal",
                              ),
                              field(
                                "cost",
                                "Known farmer-paid costs (₹); blank if unknown",
                                "",
                                "decimal",
                                false,
                              ),
                              select(
                                "payer",
                                "Transport payer",
                                ["seller", "buyer"],
                                "buyer",
                              ),
                              select(
                                "arranger",
                                "Transport arranger",
                                ["seller", "buyer"],
                                "buyer",
                              ),
                              field(
                                "terms",
                                "Payment / delivery terms",
                                "Payment after delivery inspection",
                                "textarea",
                              ),
                            ],
                          })
                        }
                      >
                        {copy(" Place bid ")}
                      </button>
                      <button
                        className="secondary"
                        onClick={() =>
                          open({
                            title: "Start a private lot enquiry",
                            action: "thread.create",
                            fixed: { lotId: s(l, "id") },
                            fields: [],
                          })
                        }
                      >
                        {copy(" Enquire ")}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {own && active.length > 0 && (
                <Table
                  headers={[
                    "Buyer",
                    "Rate / quintal",
                    "Gross value",
                    "Known costs",
                    "Terms",
                    "Action",
                  ]}
                >
                  {active.map((b) => (
                    <tr key={s(b, "id")}>
                      <td>{s(b, "buyerId")}</td>
                      <td>{copy(money(s(b, "rate")))}</td>
                      <td>
                        {money(totalPaise(s(l, "kg"), BigInt(s(b, "rate"))))}
                      </td>
                      <td>
                        {copy(money(s(b, "costPaise") || null))}
                        <small>
                          {!s(b, "costPaise")
                            ? copy("Net estimate incomplete")
                            : copy("Net: ") +
                              money(
                                totalPaise(s(l, "kg"), BigInt(s(b, "rate"))) -
                                  BigInt(s(b, "costPaise")),
                              )}
                        </small>
                      </td>
                      <td>
                        {copy(s(b, "terms"))}
                        <small>
                          {copy("Transport paid by ")}
                          {copy(s(b, "payer"))}
                        </small>
                      </td>
                      <td>
                        <button className="small" onClick={() => accept(b, l)}>
                          {copy(" Review & accept ")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </section>
          );
        })
      )}
    </>
  );
}
