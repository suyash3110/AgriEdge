import QualityImageCheck from "./QualityImageCheck";
import { useCopy, useDate } from "./useCopy";
import EvidenceUpload from "./EvidenceUpload";
import type { PortalData } from "@/lib/portal-data";
import type { ActionSpec } from "./ActionDialog";
import { s, n, Badge, Empty, Table } from "./ui";
import { money } from "@/lib/domain";
import {
  field,
  records,
  reason,
  cropField,
  future,
  today,
  select,
} from "./forms";
export default function OperationsView({
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
  const role = s(data.user, "role"),
    uid = s(data.user, "id"),
    fpo = role === "fpo";
  if (section === "circles" || section === "collection")
    return (
      <>
        {fpo && section === "circles" && (
          <button
            style={{ marginBottom: 16 }}
            onClick={() =>
              open({
                title: "Open an FPO Harvest Circle",
                action: "circle.create",
                fields: [
                  records("demandId", "Buyer demand", data.demands, "crop"),
                  field("name", "Circle name"),
                  field("targetKg", "Target quantity (kg)", "", "decimal"),
                  field(
                    "minimumKg",
                    "Minimum viable quantity (kg)",
                    "",
                    "decimal",
                  ),
                  field(
                    "hub",
                    "Collection hub",
                    "Nagpur Kisan collection centre",
                  ),
                  field("deadline", "Contribution deadline", future(), "date"),
                ],
              })
            }
          >
            {copy(" ＋ Open circle ")}
          </button>
        )}
        <div className="notice info">
          {copy(
            " Pledged quantity is reserved stock. Only actual weighed and quality-accepted intake can back an aggregate sale. ",
          )}
        </div>
        {data.circles.map((c) => {
          const items = data.contributions.filter(
            (x) => s(x, "circleId") === s(c, "id"),
          );
          return (
            <section className="panel" key={s(c, "id")}>
              <div className="panel-heading">
                <h2>{copy(s(c, "name"))}</h2>
                <Badge value={s(c, "status")} />
              </div>
              <div className="panel-body">
                <p className="muted">
                  {copy(s(c, "crop"))} · {copy(s(c, "grade"))} ·{" "}
                  {copy(s(c, "hub"))}
                  {copy(" · Due")} {date(c.deadline)}
                </p>
                <div className="record-grid">
                  <div>
                    <span>{copy("Circle target")}</span>
                    <strong>
                      {s(c, "targetKg")}
                      {copy(" kg")}
                    </strong>
                  </div>
                  <div>
                    <span>
                      {fpo ? copy("Total") : copy("Your")}
                      {copy(" pledged quantity")}
                    </span>
                    <strong>
                      {items
                        .filter((x) => s(x, "status") !== "withdrawn")
                        .reduce((a, x) => a + n(x, "pledgedKg"), 0)}{" "}
                      {copy(" kg ")}
                    </strong>
                  </div>
                  <div>
                    <span>
                      {fpo ? copy("Total") : copy("Your")}
                      {copy(" accepted intake")}
                    </span>
                    <strong>
                      {items.reduce((a, x) => a + n(x, "acceptedKg"), 0)}
                      {copy(" kg ")}
                    </strong>
                  </div>
                </div>
                <p className="muted">{copy(s(c, "allocationRule"))}</p>
                <div className="actions">
                  {role === "farmer" &&
                    ["forming", "target_pledged", "collecting"].includes(
                      s(c, "status"),
                    ) && (
                      <button
                        onClick={() =>
                          open({
                            title: "Reserve a circle contribution",
                            action: "circle.join",
                            fixed: { circleId: s(c, "id") },
                            fields: [
                              records(
                                "lotId",
                                "Your source lot",
                                data.lots.filter(
                                  (l) =>
                                    s(l, "ownerId") === uid &&
                                    s(l, "crop") === s(c, "crop"),
                                ),
                                "title",
                              ),
                              field(
                                "kg",
                                "Contribution quantity (kg)",
                                "",
                                "decimal",
                              ),
                              {
                                name: "consent",
                                type: "checkbox",
                                label:
                                  "I authorize the FPO to reserve, weigh, grade and sell my accepted contribution under the displayed allocation rule.",
                              },
                            ],
                          })
                        }
                      >
                        {copy(" Join circle ")}
                      </button>
                    )}
                  {role === "farmer" && items.filter((x) => s(x, "farmerId") === uid && s(x, "status") === "requested").map((x) => (
                    <span className="actions" key={s(x, "id")}>
                      <button onClick={() => open({ title: "Accept Harvest Circle request", action: "contribution.respond", fixed: { id: s(x, "id"), decision: "accepted" }, fields: [] })}>{copy("Accept request")}</button>
                      <button className="secondary" onClick={() => open({ title: "Reject Harvest Circle request", action: "contribution.respond", fixed: { id: s(x, "id"), decision: "rejected" }, fields: [] })}>{copy("Reject")}</button>
                    </span>
                  ))}
                  {fpo &&
                    s(c, "status") === "ready" &&
                    !data.lots.some((l) => s(l, "circleId") === s(c, "id")) && (
                      <button
                        onClick={() =>
                          open({
                            title: "Create aggregate bidding lot",
                            action: "circle.aggregate",
                            fixed: { id: s(c, "id") },
                            fields: [
                              field(
                                "rate",
                                "Expected rate (₹ / quintal)",
                                "",
                                "decimal",
                              ),
                            ],
                            description:
                              "Only accepted, consented member stock forms this lot.",
                          })
                        }
                      >
                        {copy(" Prepare aggregate sale ")}
                      </button>
                    )}
                </div>
              </div>
              {items.length > 0 && (
                <Table
                  headers={[
                    "Member / source",
                    "Pledged",
                    "Received / accepted",
                    "Status",
                    "Action",
                  ]}
                >
                  {items.map((x) => (
                    <tr key={s(x, "id")}>
                      <td>
                        {s(x, "farmerId")}
                        <small>{s(x, "lotId")}</small>
                      </td>
                      <td>
                        {s(x, "pledgedKg")}
                        {copy(" kg")}
                      </td>
                      <td>
                        {s(x, "receivedKg")} / {s(x, "acceptedKg")}
                        {copy(" kg ")}
                      </td>
                      <td>
                        <Badge value={s(x, "status")} />
                      </td>
                      <td>
                        {fpo && s(x, "status") === "pledged" && (
                          <button
                            className="small"
                            onClick={() =>
                              open({
                                title: "Record actual collection intake",
                                action: "circle.intake",
                                fixed: { id: s(x, "id") },
                                fields: [
                                  field(
                                    "receivedKg",
                                    "Received weight (kg)",
                                    s(x, "pledgedKg"),
                                    "decimal",
                                  ),
                                  field(
                                    "acceptedKg",
                                    "Quality-accepted weight (kg)",
                                    "",
                                    "decimal",
                                  ),
                                  field(
                                    "grade",
                                    "Assessed grade",
                                    s(c, "grade"),
                                  ),
                                ],
                                description:
                                  "Accepted cannot exceed received or pledged weight. Incompatible grades require separate handling.",
                              })
                            }
                          >
                            {copy(" Weigh & grade ")}
                          </button>
                        )}
                        {s(x, "farmerId") === uid &&
                          s(x, "status") === "pledged" && (
                            <button
                              className="secondary small"
                              onClick={() =>
                                open({
                                  title: "Withdraw contribution",
                                  action: "contribution.withdraw",
                                  fixed: { id: s(x, "id") },
                                  fields: [],
                                })
                              }
                            >
                              {copy(" Withdraw ")}
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </Table>
              )}
            </section>
          );
        })}
        {!data.circles.length && <Empty />}
      </>
    );
  if (section === "warehouse")
    return (
      <>
        {fpo && (
          <button
            style={{ marginBottom: 16 }}
            onClick={() =>
              open({
                title: "List an FPO warehouse",
                action: "warehouse.create",
                fields: [
                  field("name", "Facility name"),
                  field("address", "Address"),
                  field("type", "Storage type", "Dry ventilated"),
                  cropField(),
                  field("capacityKg", "Capacity (kg)", "", "decimal"),
                  field("rate", "Storage charge (₹ / kg / day)", "", "decimal"),
                ],
              })
            }
          >
            {copy(" ＋ List warehouse ")}
          </button>
        )}
        <div className="notice info">
          {copy(
            " A booking request is not a confirmed slot. The FPO reviews suitability and overlapping capacity before confirmation. ",
          )}
        </div>
        <section className="panel">
          <div className="panel-heading">
            <h2>{copy("Storage directory")}</h2>
          </div>
          {data.warehouses.map((w) => (
            <article className="record-card" key={s(w, "id")}>
              <div className="record-top">
                <h3>{copy(s(w, "name"))}</h3>
                <Badge value={s(w, "type")} />
              </div>
              <p>{copy(s(w, "address"))}</p>
              <p>
                {copy(" Suitable crops:")}{" "}
                {Array.isArray(w.crops)
                  ? w.crops.map((crop) => copy(String(crop))).join(", ")
                  : ""}
              </p>
              <p>
                {copy(" Indicative capacity ")}
                {s(w, "capacityKg")}
                {copy(" kg ·")} {copy(money(s(w, "ratePaise")))}
                {copy(" / kg / day · Updated")} {date(w.updatedAt)}
              </p>
              {role === "farmer" && (
                <button
                  className="small"
                  onClick={() =>
                    open({
                      title: "Request warehouse space",
                      action: "booking.request",
                      fixed: { warehouseId: s(w, "id") },
                      fields: [
                        cropField(),
                        field("kg", "Required capacity (kg)", "", "decimal"),
                        field("startDate", "Storage start", today(), "date"),
                        field("endDate", "Storage end", future(), "date"),
                      ],
                      description:
                        "The FPO must confirm availability. A directory listing alone cannot justify waiting to sell.",
                    })
                  }
                >
                  {copy(" Request space ")}
                </button>
              )}
            </article>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>{copy("Booking requests & confirmations")}</h2>
          </div>
          <Table
            headers={[
              "Booking / owner",
              "Crop / quantity",
              "Dates",
              "Status",
              "Action",
            ]}
            empty={!data.bookings.length}
          >
            {data.bookings.map((b) => (
              <tr key={s(b, "id")}>
                <td>
                  {s(b, "id").slice(0, 8)}
                  <small>{s(b, "farmerId")}</small>
                </td>
                <td>
                  {copy(s(b, "crop"))} · {s(b, "kg")}
                  {copy(" kg ")}
                </td>
                <td>
                  {date(b.startDate)}
                  <small>
                    {copy("to ")}
                    {date(b.endDate)}
                  </small>
                </td>
                <td>
                  <Badge value={s(b, "status")} />
                  <small>{copy(s(b, "reason"))}</small>
                </td>
                <td>
                  <div className="actions">
                    {fpo &&
                      (s(b, "status") === "requested"
                        ? [
                            ["booking.confirm", "Confirm capacity"],
                            ["booking.reject", "Reject"],
                          ]
                        : s(b, "status") === "confirmed"
                          ? [["booking.checkin", "Check in"]]
                          : s(b, "status") === "checked_in"
                            ? [["booking.checkout", "Check out"]]
                            : []
                      ).map(([action, title]) => (
                        <button
                          className="small"
                          key={action}
                          onClick={() =>
                            open({
                              title,
                              action,
                              fixed: { id: s(b, "id") },
                              fields: [reason()],
                            })
                          }
                        >
                          {copy(title)}
                        </button>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </section>
      </>
    );
  if (section === "quality")
    return (
      <>
        <QualityImageCheck />
        {role === "farmer" && (
          <button
            style={{ marginBottom: 16 }}
            onClick={() =>
              open({
                title: "Request FPO quality verification",
                action: "quality.request",
                fields: [
                  records(
                    "lotId",
                    "Your lot",
                    data.lots.filter((l) => s(l, "ownerId") === uid),
                    "title",
                  ),
                  reason(),
                ],
              })
            }
          >
            {copy(" Request manual assessment ")}
          </button>
        )}
        <section className="panel">
          <Table
            headers={["Lot / method", "Assessment", "Reason", "Action"]}
            empty={!data.quality.length}
          >
            {data.quality.map((q) => (
              <tr key={s(q, "id")}>
                <td>
                  {(data.lots.find((l) => s(l, "id") === s(q, "lotId"))
                    ?.title as string) || s(q, "lotId")}
                  <small>{copy(s(q, "method"))}</small>
                  {!!data.lots.find((l) => s(l, "id") === s(q, "lotId"))
                    ?.imageAssessmentId && (
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={
                        "/api/v1/quality-image?id=" +
                        data.lots.find((l) => s(l, "id") === s(q, "lotId"))
                          ?.imageAssessmentId
                      }
                    >
                      {copy("View crop photo")}
                    </a>
                  )}
                </td>
                <td>
                  {s(q, "grade") || "Awaiting FPO review"}
                  <small>{s(q, "measurements")}</small>
                  <small>{date(q.createdAt)}</small>
                </td>
                <td>
                  {copy(s(q, "reason"))}
                  <EvidenceUpload contextId={s(q, "lotId")} />
                </td>
                <td>
                  {fpo && (
                    <button
                      className="small"
                      onClick={() =>
                        open({
                          title: "Record a manual assessment version",
                          action: "quality.review",
                          fixed: { id: s(q, "id") },
                          fields: [
                            select("grade", "Observed grade", ["A", "B", "C"]),
                            field(
                              "measurements",
                              "Measured observations and evidence",
                              "",
                              "textarea",
                            ),
                            reason(),
                          ],
                          description:
                            "This creates a new version. Earlier requests and assessments remain in history.",
                        })
                      }
                    >
                      {copy(" Record assessment ")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </section>
      </>
    );
  if (section === "inventory")
    return (
      <>
        <button
          style={{ marginBottom: 16 }}
          onClick={() =>
            open({
              title: "Record inventory loss",
              action: "inventory.loss",
              fields: [
                records(
                  "bookingId",
                  "Checked-in booking",
                  data.bookings.filter((b) => s(b, "status") === "checked_in"),
                  "id",
                ),
                field("kg", "Lost quantity (kg)", "", "decimal"),
                reason(),
              ],
            })
          }
        >
          {copy(" Record stock loss ")}
        </button>
        <section className="panel">
          <div className="panel-heading">
            <h2>{copy("Append-only stock movements")}</h2>
          </div>
          <Table
            headers={["Booking", "Owner", "Movement (kg)", "Reason", "Date"]}
            empty={!data.inventory.length}
          >
            {data.inventory.map((r) => (
              <tr key={s(r, "id")}>
                <td>{s(r, "bookingId").slice(0, 8)}</td>
                <td>{s(r, "farmerId")}</td>
                <td>{s(r, "deltaKg")}</td>
                <td>{copy(s(r, "reason"))}</td>
                <td>{date(r.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </section>
      </>
    );
  return (
    <>
      <div className="notice info">
        {copy(
          " Verification authority: admin → external roles; FPO → farmers, buyers and transporters; farmer/buyer → transporters. Evidence and issuer type are recorded. ",
        )}
      </div>
      <section className="panel">
        <Table
          headers={["Participant", "Role / area", "Status / trust", "Action"]}
          empty={!data.users.length}
        >
          {data.users.map((u) => (
            <tr key={s(u, "id")}>
              <td>{copy(s(u, "name"))}</td>
              <td>
                {copy(s(u, "role"))}
                <small>{copy(s(u, "village"))}</small>
              </td>
              <td>
                <Badge value={u.suspended ? "suspended" : s(u, "status")} />
                <small>{copy("Trust score")}: {s(u, "trustScore") || "100"}/100 · <Badge value={n(u, "trustScore") >= 60 ? "verified" : "unverified"} /></small>
              </td>
              <td>
                {s(u, "id") !== uid && s(u, "role") !== "admin" && (
                  <button
                    className="small secondary"
                    onClick={() =>
                      open({
                        title: "Record verification decision",
                        action: "verification.decide",
                        fixed: { id: s(u, "id") },
                        fields: [
                          select(
                            "decision",
                            "Decision",
                            role === "admin"
                              ? ["approved", "rejected", "revoked", "suspended"]
                              : ["approved", "rejected"],
                          ),
                          field(
                            "evidence",
                            "Evidence checklist and assessment reason",
                            "",
                            "textarea",
                          ),
                        ],
                        description:
                          "Only eligible verified issuers can approve. This is community/platform verification, not government certification.",
                      })
                    }
                  >
                    {copy(" Review ")}
                  </button>
                )}
                {role === "admin" && s(u, "id") !== uid && (
                  <button className="small" onClick={() => open({ title: "Adjust trust score", action: "trust.adjust", fixed: { id: s(u, "id") }, fields: [field("delta", "Score change (-50 to +25)", "-10", "number"), reason()] })}>{copy("Adjust trust")}</button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </section>
    </>
  );
}
