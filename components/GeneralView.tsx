import ModelEvidence from "./ModelEvidence";
import SellingGuidance from "./SellingGuidance";
import { marketCopy } from "@/lib/market-copy";
import { useLocale } from "next-intl";
import SchemeDirectory from "./SchemeDirectory";
import { useCopy, useDate } from "./useCopy";
import AuditedReview from "./AuditedReview";
import { useState, useSyncExternalStore } from "react";
import type { PortalData } from "@/lib/portal-data";
import type { ActionSpec } from "./ActionDialog";
import { s, Badge, Empty, Table } from "./ui";
import { money } from "@/lib/domain";
import { field, records, select, reason } from "./forms";
const subscribeHydration = () => () => {};
export default function GeneralView({
  data,
  section,
  open,
}: {
  data: PortalData;
  section: string;
  open: (s: ActionSpec) => void;
}) {
  const locale = useLocale();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const copy = useCopy();
  const date = useDate();
  const [search, setSearch] = useState("");
  const role = s(data.user, "role");
  if (section === "prices")
    return (
      <>
        <SellingGuidance prices={data.prices} asOf={data.asOf} />
        <div className="filter-row">
          <input
            disabled={!hydrated}
            aria-label={copy("Filter market observations")}
            placeholder={copy("Filter crop or market")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <section className="panel">
          <Table
            headers={[
              "Crop / variety",
              "Market / source",
              "Observation date",
              "Min / quintal",
              "Modal / quintal",
              "Max / quintal",
            ]}
            empty={!data.prices.length}
          >
            {data.prices
              .filter((r) =>
                (
                  s(r, "crop") +
                  " " +
                  s(r, "market") +
                  " " +
                  copy(s(r, "crop")) +
                  " " +
                  marketCopy(locale, s(r, "market"))
                )
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((r) => (
                <tr key={s(r, "id")}>
                  <td>
                    {copy(s(r, "crop"))}
                    <small>{marketCopy(locale, s(r, "variety"))}</small>
                  </td>
                  <td>
                    {marketCopy(locale, s(r, "market"))}
                    <small>{s(r, "source")}</small>
                  </td>
                  <td>
                    {date(r.observedDate)}
                    <small>
                      {new Date(data.asOf).getTime() -
                        new Date(s(r, "observedDate")).getTime() >
                      2 * 86400000
                        ? copy("Stale observation")
                        : copy("Latest available observation")}
                    </small>
                  </td>
                  <td>{r.minPaise == null ? "—" : copy(money(s(r, "minPaise")))}</td>
                  <td>
                    <strong>{copy(money(s(r, "modalPaise")))}</strong>
                  </td>
                  <td>{r.maxPaise == null ? "—" : copy(money(s(r, "maxPaise")))}</td>
                </tr>
              ))}
          </Table>
        </section>
      </>
    );
  if (section === "profile")
    return (
      <section className="panel">
        <div className="panel-heading">
          <h2>{copy("Your profile")}</h2>
          <Badge value={s(data.user, "status")} />
        </div>
        <div className="panel-body">
          <h3>{copy(s(data.user, "name"))}</h3>
          <p>
            {s(data.user, "phone")} · {copy(s(data.user, "village"))} ·{" "}
            {copy(s(data.user, "role"))}
          </p>
          {s(data.user, "status") === "pending" && (
            <button
              onClick={() =>
                open({
                  title: "Complete account onboarding",
                  action: "profile.onboard",
                  fields: [
                    field("name", "Name", s(data.user, "name")),
                    select(
                      "role",
                      "Account role",
                      ["farmer", "fpo", "buyer", "transporter"],
                      s(data.user, "role"),
                    ),
                    field("village", "Village", s(data.user, "village")),
                  ],
                })
              }
            >
              {copy(" Complete onboarding ")}
            </button>
          )}
          <p className="muted">
            {copy(
              " Account verification is separate from mobile ownership. Role or approval cannot be changed from a profile form. ",
            )}
          </p>
          <button
            onClick={() =>
              open({
                title: "Update your profile",
                action: "profile.update",
                fixed: {
                  crops: Array.isArray(data.user.crops) ? data.user.crops : [],
                },
                fields: [
                  field("name", "Full name", s(data.user, "name")),
                  field("village", "Village / area", s(data.user, "village")),
                  select(
                    "language",
                    "Preferred language",
                    ["en", "hi", "mr"],
                    s(data.user, "language"),
                  ),
                ],
              })
            }
          >
            {copy(" Edit profile ")}
          </button>
        </div>
      </section>
    );
  if (section === "messages")
    return (
      <>
        {data.threads.map((t) => (
          <section className="panel" key={s(t, "id")}>
            <div className="panel-heading">
              <h2>{copy(s(t, "title"))}</h2>
              <Badge
                value={
                  Array.isArray(t.blockedIds) && t.blockedIds.length
                    ? "blocked"
                    : "private"
                }
              />
            </div>
            <div className="panel-body">
              <p className="muted">
                {copy(" Members:")}{" "}
                {Array.isArray(t.memberIds) ? t.memberIds.join(", ") : ""}
              </p>
              <div className="actions">
                <button
                  onClick={() =>
                    open({
                      title: "Send private message",
                      action: "message.send",
                      fixed: { threadId: s(t, "id") },
                      fields: [field("body", "Message", "", "textarea")],
                    })
                  }
                >
                  {copy(" Write message ")}
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    open({
                      title: "Block this conversation",
                      action: "thread.block",
                      fixed: { id: s(t, "id") },
                      fields: [],
                    })
                  }
                >
                  {copy(" Block conversation ")}
                </button>
              </div>
            </div>
            {data.messages
              .filter((m) => s(m, "threadId") === s(t, "id"))
              .map((m) => (
                <div className="message" key={s(m, "id")}>
                  <small>
                    {s(m, "senderId")} · {date(m.createdAt)}
                  </small>
                  <p>{s(m, "body")}</p>
                  <button
                    className="secondary small"
                    onClick={() =>
                      open({
                        title: "Report message",
                        action: "message.report",
                        fixed: { id: s(m, "id") },
                        fields: [reason()],
                      })
                    }
                  >
                    {copy(" Report ")}
                  </button>
                  {s(m, "senderId") !== s(data.user, "id") && !m.readAt && (
                    <button className="small" onClick={() => open({ title: "Mark message as read", action: "message.read", fixed: { id: s(m, "id") }, fields: [] })}>
                      {copy("Mark read")}
                    </button>
                  )}
                </div>
              ))}
          </section>
        ))}
        {!data.threads.length && (
          <section className="panel">
            <Empty
              title={copy("No conversations")}
              description="A lot enquiry or accepted transaction creates an authorized private conversation."
            />
          </section>
        )}
      </>
    );
  if (section === "notifications")
    return (
      <section className="panel">
        {data.notifications.length ? (
          data.notifications.map((r) => (
            <article className="record-card" key={s(r, "id")}>
              <div className="record-top">
                <h3>{copy(s(r, "title"))}</h3>
                <Badge value={r.read ? "read" : "unread"} />
              </div>
              <p>{date(r.createdAt)}</p>
              {!r.read && (
                <button
                  className="secondary small"
                  onClick={() =>
                    open({
                      title: "Mark notice as read",
                      action: "notification.read",
                      fixed: { id: s(r, "id") },
                      fields: [],
                    })
                  }
                >
                  {copy("Mark read")}
                </button>
              )}
            </article>
          ))
        ) : (
          <Empty title="No notifications yet" />
        )}
      </section>
    );
  if (section === "disputes")
    return (
      <section className="panel">
        <Table
          headers={[
            "Transaction",
            "Issue / statement",
            "Status / outcome",
            "Action",
          ]}
          empty={!data.disputes.length}
        >
          {data.disputes.map((d) => (
            <tr key={s(d, "id")}>
              <td>{s(d, "agreementId").slice(0, 8)}</td>
              <td>
                {copy(s(d, "category"))}
                <small>{s(d, "explanation")}</small>
              </td>
              <td>
                <Badge value={s(d, "status")} />
                <small>{s(d, "outcome")}</small>
              </td>
              <td>
                {role === "admin" && s(d, "status") !== "resolved" && (
                  <button
                    onClick={() =>
                      open({
                        title: "Record dispute outcome",
                        action: "dispute.resolve",
                        fixed: { id: s(d, "id") },
                        fields: [
                          field(
                            "outcome",
                            "Decision and evidence-based reason",
                            "",
                            "textarea",
                          ),
                        ],
                      })
                    }
                  >
                    {copy(" Resolve ")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </section>
    );
  if (section === "imports")
    return (
      <>
        <button
          style={{ marginBottom: 16 }}
          onClick={() =>
            open({
              title: "Retry configured CSV source",
              action: "prices.retry",
              fields: [],
              description:
                "Reads the operator-configured source. No manual price entry or file upload is available.",
            })
          }
        >
          {copy(" Retry configured source ")}
        </button>
        <section className="panel">
          <Table
            headers={[
              "Source",
              "Imported",
              "Quarantined",
              "Date",
              "Validation details",
            ]}
            empty={!data.imports.length}
          >
            {data.imports.map((r) => (
              <tr key={s(r, "id")}>
                <td>{s(r, "source")}</td>
                <td>{s(r, "accepted")}</td>
                <td>{s(r, "rejected")}</td>
                <td>{date(r.createdAt)}</td>
                <td>{JSON.stringify(r.errors)}</td>
              </tr>
            ))}
          </Table>
        </section>
      </>
    );
  if (section === "audit")
    return (
      <section className="panel">
        <Table
          headers={["Actor", "Action", "Record", "Detail", "Date"]}
          empty={!data.audit.length}
        >
          {data.audit.map((r) => (
            <tr key={s(r, "id")}>
              <td>{s(r, "actorId")}</td>
              <td>{s(r, "action")}</td>
              <td>{s(r, "subjectId").slice(0, 8)}</td>
              <td>{copy(s(r, "detail"))}</td>
              <td>{date(r.createdAt)}</td>
            </tr>
          ))}
        </Table>
      </section>
    );
  if (section === "schemes") return <SchemeDirectory locale={locale} />;
  if (section === "assistant") return <Assistant data={data} />;
  if (section === "reported") return <AuditedReview />;
  if (section === "models") return <ModelEvidence />;
  if (section === "reports")
    return (
      <section className="panel">
        <div className="panel-heading">
          <h2>{copy("Operational snapshot")}</h2>
          <a href="/api/v1/reports" download="agriedge-transactions.csv">
            {copy(" Export transactions CSV ")}
          </a>
          <button className="secondary small" onClick={() => window.print()}>
            {copy(" Print report ")}
          </button>
        </div>
        <div className="panel-body">
          <p>
            {copy("Visible lots: ")}
            {data.counts.lots}
          </p>
          <p>
            {copy("Visible accepted agreements: ")}
            {data.counts.agreements}
          </p>
          <p>
            {copy("Unread notices: ")}
            {data.counts.notifications}
          </p>
          <p className="muted">
            {copy(
              " These figures reflect accessible records. Pilot outcome gains and model accuracy have not been measured. ",
            )}
          </p>
        </div>
      </section>
    );
  if (section === "staff")
    return (
      <section className="panel">
        <div className="panel-heading">
          <h2>{copy("FPO staff permissions")}</h2>
        </div>
        <div className="panel-body">
          <p>{copy(s(data.user, "name"))}</p>
          <p>
            {copy("Organization: ")}
            {s(data.user, "fpoId")}
          </p>
          <button
            onClick={() =>
              open({
                title: "Grant FPO staff permission",
                action: "staff.grant",
                fields: [
                  records(
                    "id",
                    "Staff account",
                    data.users.filter((u) => s(u, "role") === "fpo"),
                    "name",
                  ),
                  select("permission", "Permission", [
                    "verify",
                    "collect",
                    "warehouse",
                    "accounts",
                  ]),
                  reason(),
                ],
              })
            }
          >
            {copy(" Grant permission ")}
          </button>
          <p>
            {copy(" Granted permissions:")}{" "}
            {Array.isArray(data.user.permissions)
              ? data.user.permissions
                  .map((permission) => copy(String(permission)))
                  .join(", ")
              : copy("None")}
          </p>
          <p className="muted">
            {copy(
              " Server checks enforce verification, collection, warehouse, accounting and manager scope. ",
            )}
          </p>
        </div>
      </section>
    );
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          {section === "settings"
            ? copy("Deployment configuration")
            : copy("Reported message review")}
        </h2>
      </div>
      <div className="panel-body">
        <p className="muted">
          {section === "settings"
            ? copy(
                "Provider credentials are configured outside the application. Secrets are never displayed here. Live OTP, payment gateway, storage and ML providers require operator configuration.",
              )
            : copy(
                "Sensitive message investigation requires a separately authorized and audited review workflow. Private message content is not exposed in this general overview.",
              )}
        </p>
      </div>
    </section>
  );
}
function Assistant({ data }: { data: PortalData }) {
  const copy = useCopy();
  const date = useDate();
  const [topic, setTopic] = useState("prices"),
    [answer, setAnswer] = useState("");
  const topics = [
    "crops",
    "prices",
    "selling",
    "quality",
    "schemes",
    "warehouses",
    "Harvest Circle",
    "transport",
    "platform help",
  ];
  function respond() {
    const replies: Record<string, string> = {
      crops:
        "Trading supports wheat, paddy, maize, tomato, onion, potato, mustard, sorghum, gram and groundnut, plus residues. Source: AgriEdge product catalogue.",
      prices: data.prices.length
        ? data.prices
            .slice(0, 3)
            .map(
              (p) =>
                copy(s(p, "crop")) +
                ": " +
                money(s(p, "modalPaise")) +
                copy("/quintal;") +
                " " +
                date(p.observedDate) +
                copy("; source:") +
                " " +
                s(p, "source"),
            )
            .join("\n")
        : "No CSV observations available. I cannot provide a current price.",
      selling:
        "No forecast model is available. Collection plus delivery must fit your conservative usable-life window. Unknown condition or storage cannot justify waiting. Source: AgriEdge safety policy.",
      quality:
        "Photos cannot establish hidden moisture or chemical contamination. Request a manual FPO assessment. Source: AgriEdge quality policy.",
      schemes:
        "Open Government Schemes for official PM-KISAN, myScheme and Maharashtra links, checked 6 September 2026. Verify current eligibility and deadlines there.",
      warehouses:
        data.warehouses
          .map(
            (w) =>
              s(w, "name") +
              " — " +
              copy(s(w, "type")) +
              copy(". A request needs FPO confirmation."),
          )
          .join("\n") || "No warehouse records available.",
      "Harvest Circle":
        "Join an open FPO circle using your compatible source lot. Your pledged stock is reserved. Actual accepted weight is recorded separately. Source: AgriEdge circle policy.",
      transport:
        "Accepting a produce bid creates a linked job. The agreed arranger accepts a quote. Pickup and delivery use separate single-use OTPs. Source: AgriEdge transport policy.",
      "platform help":
        "Use the service menu to list stock, review bids, request storage and inspect transactions. Your role limits available actions. Source: AgriEdge platform guide.",
    };
    setAnswer(copy(replies[topic]));
  }
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{copy("Guided agriculture help")}</h2>
        <Badge value="rules-based" />
      </div>
      <div className="panel-body">
        <label htmlFor="topic">{copy("Choose a topic")}</label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          {topics.map((t) => (
            <option value={t} key={t}>
              {copy(t)}
            </option>
          ))}
        </select>
        {topic === "selling" && <SellingGuidance prices={data.prices} asOf={data.asOf} />}
        <button hidden={topic === "selling"} style={{ marginTop: 16 }} onClick={respond}>
          {copy(" Show guidance ")}
        </button>
        {answer && topic !== "selling" && (
          <div className="message" role="status">
            <p>{answer}</p>
          </div>
        )}
      </div>
    </section>
  );
}
