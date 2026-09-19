import { useCopy } from "./useCopy";
import type { PortalData } from "@/lib/portal-data";
import type { ActionSpec } from "./ActionDialog";
import { s, Badge, Empty, Table } from "./ui";
import { money } from "@/lib/domain";
import { field, records } from "./forms";
export default function TransportView({
  data,
  section,
  open,
  notify,
}: {
  data: PortalData;
  section: string;
  open: (s: ActionSpec) => void;
  notify: (s: string) => void;
}) {
  const copy = useCopy();
  const uid = s(data.user, "id"),
    role = s(data.user, "role");
  async function gps(jobId: string) {
    if (!navigator.geolocation) {
      notify(copy("GPS unavailable on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const res = await fetch("/api/v1/actions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "transport.location",
              payload: {
                jobId,
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
                accuracy: p.coords.accuracy,
                consent: true,
              },
            }),
          });
          await res.json();
          notify(
            res.ok
              ? copy("Location shared at") +
                  " " +
                  new Date().toLocaleTimeString() +
                  copy(". Sharing only runs while this page is active.")
              : copy(
                  "Location could not be shared. Check your job assignment and try again.",
                ),
          );
        } catch {
          notify(
            copy(
              "GPS update could not be sent. Last known location may be stale.",
            ),
          );
        }
      },
      () =>
        notify(
          copy(
            "GPS permission denied or location unavailable. No location was shared.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }
  if (section === "vehicles")
    return (
      <>
        <button
          style={{ marginBottom: 16 }}
          onClick={() =>
            open({
              title: "Register vehicle",
              action: "vehicle.create",
              fields: [
                field("registration", "Vehicle registration"),
                field("type", "Vehicle type"),
                field("capacityKg", "Measured capacity (kg)", "", "decimal"),
              ],
            })
          }
        >
          {copy(" ＋ Add vehicle ")}
        </button>
        <section className="panel">
          <Table
            headers={["Registration", "Vehicle", "Capacity"]}
            empty={!data.vehicles.length}
          >
            {data.vehicles.map((v) => (
              <tr key={s(v, "id")}>
                <td>{s(v, "registration")}</td>
                <td>{copy(s(v, "type"))}</td>
                <td>
                  {s(v, "capacityKg")}
                  {copy(" kg")}
                </td>
              </tr>
            ))}
          </Table>
        </section>
      </>
    );
  const jobs = data.jobs.filter((j) =>
    section === "jobs" || section === "earnings"
      ? s(j, "transporterId") === uid
      : true,
  );
  return (
    <>
      {section === "earnings" && (
        <div className="notice">
          {copy(
            " Transport charges are a separate payable to the agreed payer. No bank settlement is inferred from a completed delivery. ",
          )}
        </div>
      )}
      {jobs.length ? (
        jobs.map((j) => {
          const assigned = s(j, "transporterId") === uid,
            pickup = s(j, "sellerId") === uid,
            delivery = s(j, "buyerId") === uid,
            arranger =
              (s(j, "arranger") === "seller"
                ? s(j, "sellerId")
                : s(j, "buyerId")) === uid;
          const location = data.locations.find(
            (l) => s(l, "jobId") === s(j, "id"),
          );
          return (
            <section className="panel" key={s(j, "id")}>
              <div className="panel-heading">
                <h2>
                  {copy("Transport request · ")}
                  {s(j, "id").slice(0, 8)}
                </h2>
                <Badge value={s(j, "status")} />
              </div>
              <div className="panel-body">
                <div className="record-grid">
                  <div>
                    <span>{copy("Pickup → destination")}</span>
                    <strong>
                      {s(j, "pickup")} → {s(j, "destination")}
                    </strong>
                  </div>
                  <div>
                    <span>{copy("Quantity / accepted quote")}</span>
                    <strong>
                      {s(j, "kg")}
                      {copy(" kg · ")}
                      {copy(money(s(j, "quotePaise") || null))}
                    </strong>
                  </div>
                  <div>
                    <span>{copy("Arranger / payer")}</span>
                    <strong>
                      {copy(s(j, "arranger"))} / {copy(s(j, "payer"))}
                    </strong>
                  </div>
                </div>
                <p className="muted">
                  {location
                    ? copy("Last known GPS: ") +
                      s(location, "latitude") +
                      ", " +
                      s(location, "longitude") +
                      copy(" · accuracy ") +
                      s(location, "accuracy") +
                      " m · " +
                      new Date(s(location, "createdAt")).toLocaleString() +
                      (new Date(data.asOf).getTime() -
                        new Date(s(location, "createdAt")).getTime() >
                      120000
                        ? " · STALE"
                        : "")
                    : copy("GPS unavailable — no shared location received.")}
                </p>
                <div className="actions">
                  {role === "transporter" && s(j, "status") === "open" && (
                    <button
                      onClick={() =>
                        open({
                          title: "Quote for full transport job",
                          action: "transport.quote",
                          fixed: { jobId: s(j, "id") },
                          fields: [
                            records(
                              "vehicleId",
                              "Your vehicle",
                              data.vehicles,
                              "registration",
                            ),
                            field(
                              "amount",
                              "Transport charge (₹)",
                              "",
                              "decimal",
                            ),
                            field(
                              "terms",
                              "Schedule and cancellation terms",
                              "",
                              "textarea",
                            ),
                          ],
                        })
                      }
                    >
                      {copy(" Submit quote ")}
                    </button>
                  )}
                  {pickup && s(j, "status") === "assigned" && (
                    <button
                      onClick={() =>
                        open({
                          title: "Request pickup handover OTP",
                          action: "checkpoint.request",
                          fixed: { jobId: s(j, "id"), purpose: "pickup" },
                          fields: [],
                          description:
                            "The releasing party receives this code. Share it with the assigned transporter only at pickup.",
                        })
                      }
                    >
                      {copy(" Get pickup OTP ")}
                    </button>
                  )}
                  {delivery &&
                    ["picked_up", "in_transit"].includes(s(j, "status")) && (
                      <button
                        onClick={() =>
                          open({
                            title: "Request delivery handover OTP",
                            action: "checkpoint.request",
                            fixed: { jobId: s(j, "id"), purpose: "delivery" },
                            fields: [],
                            description:
                              "This delivery code is distinct from the pickup code.",
                          })
                        }
                      >
                        {copy(" Get delivery OTP ")}
                      </button>
                    )}
                  {assigned &&
                    ["assigned", "picked_up", "in_transit"].includes(
                      s(j, "status"),
                    ) && (
                      <>
                        <button
                          onClick={() =>
                            open({
                              title:
                                s(j, "status") === "assigned"
                                  ? "Verify pickup"
                                  : "Verify delivery",
                              action: "checkpoint.verify",
                              fixed: {
                                jobId: s(j, "id"),
                                purpose:
                                  s(j, "status") === "assigned"
                                    ? "pickup"
                                    : "delivery",
                              },
                              fields: [
                                field("code", "6-digit handover OTP"),
                                field(
                                  "evidence",
                                  "Weight slip / handover evidence reference",
                                  "",
                                  "textarea",
                                ),
                              ],
                            })
                          }
                        >
                          {copy(" Verify")}{" "}
                          {s(j, "status") === "assigned"
                            ? copy("pickup")
                            : copy("delivery")}
                        </button>
                        <button
                          className="secondary"
                          onClick={() => void gps(s(j, "id"))}
                        >
                          {copy(" Consent & share current GPS ")}
                        </button>
                      </>
                    )}
                </div>
                {assigned && (
                  <p className="muted" style={{ marginTop: 12 }}>
                    {copy(
                      " Location is shared with the transaction parties during your active assignment. This button sends one update; background tracking is not guaranteed. ",
                    )}
                  </p>
                )}
              </div>
              {arranger && (
                <Table
                  headers={["Transporter", "Quote", "Terms", "Action"]}
                  empty={
                    !data.quotes.filter((q) => s(q, "jobId") === s(j, "id"))
                      .length
                  }
                >
                  {data.quotes
                    .filter((q) => s(q, "jobId") === s(j, "id"))
                    .map((q) => (
                      <tr key={s(q, "id")}>
                        <td>{s(q, "transporterId")}</td>
                        <td>{copy(money(s(q, "amountPaise")))}</td>
                        <td>{copy(s(q, "terms"))}</td>
                        <td>
                          {s(j, "status") === "open" && (
                            <button
                              className="small"
                              onClick={() =>
                                open({
                                  title: "Accept transport quote",
                                  action: "transport.assign",
                                  fixed: { id: s(q, "id") },
                                  fields: [],
                                  descriptionMr: `${copy(money(s(q, "amountPaise")))} चा भरणा ${s(j, "payer") === "buyer" ? "खरेदीदार" : "विक्रेता"} करेल. यात वाहन आणि वाहतूकदार एकत्र नियुक्त होतील.`,
                                  descriptionHi: `${copy(money(s(q, "amountPaise")))} का भुगतान ${s(j, "payer") === "buyer" ? "खरीदार" : "विक्रेता"} करेगा। इस स्वीकृति में वाहन और परिवहनकर्ता एक साथ नियुक्त होंगे।`,
                                  description:
                                    money(s(q, "amountPaise")) +
                                    " payable by " +
                                    s(j, "payer") +
                                    ". This atomically assigns the vehicle and transporter.",
                                })
                              }
                            >
                              {copy(" Accept quote ")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </Table>
              )}
            </section>
          );
        })
      ) : (
        <section className="panel">
          <Empty
            title="No transport jobs yet"
            description="Accepting a produce bid creates a linked transport request."
          />
        </section>
      )}
    </>
  );
}
