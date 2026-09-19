import { useCopy } from "./useCopy";
import EvidenceUpload from "./EvidenceUpload";
import type { PortalData } from "@/lib/portal-data";
import type { ActionSpec } from "./ActionDialog";
import { s, Badge, Empty, Table } from "./ui";
import { money } from "@/lib/domain";
import { reason, field } from "./forms";
import TolerancePanel from "./TolerancePanel";
export default function TransactionsView({
  data,
  open,
}: {
  data: PortalData;
  open: (s: ActionSpec) => void;
}) {
  const copy = useCopy();
  const uid = s(data.user, "id");
  return (
    <>
      {data.agreements.map((a) => {
        const buyer = s(a, "buyerId") === uid,
          order = data.payments.find((p) => s(p, "agreementId") === s(a, "id"));
        return (
          <section className="panel" key={s(a, "id")}>
            <div className="panel-heading">
              <h2>
                {copy("Agreement · ")}
                {s(a, "id").slice(0, 8)}
              </h2>
              <button
                className="secondary small"
                onClick={() => window.print()}
              >
                {copy(" Print statement ")}
              </button>
            </div>
            <div className="panel-body">
              <TolerancePanel agreement={a} proposals={data.toleranceProposals.filter((p) => s(p, "agreementId") === s(a, "id"))} uid={uid} locked={!!order || s(a, "payment") !== "unpaid" || ![s(a, "sellerId"), s(a, "buyerId")].includes(uid)} open={open} />
              <div className="record-grid">
                <div>
                  <span>{copy("Produce amount")}</span>
                  <strong>{copy(money(s(a, "totalPaise")))}</strong>
                </div>
                <div>
                  <span>{copy("Frozen quantity / rate")}</span>
                  <strong>
                    {s(a, "kg")}
                    {copy(" kg · ")}
                    {copy(money(s(a, "rate")))}
                    {copy("/qtl ")}
                  </strong>
                </div>
                <div>
                  <span>{copy("Known farmer-paid costs")}</span>
                  <strong>{copy(money(s(a, "costPaise") || null))}</strong>
                </div>
                <div>
                  <span>{copy("Fulfilment")}</span>
                  <Badge value={s(a, "fulfilment")} />
                </div>
                <div>
                  <span>{copy("Payment capture")}</span>
                  <Badge value={s(a, "payment")} />
                </div>
                <div>
                  <span>{copy("Recipient bank settlement")}</span>
                  <Badge value={s(a, "settlement")} />
                </div>
              </div>
              <p className="muted">
                {copy(" Seller ")}
                {s(a, "sellerId")}
                {copy(" · Buyer ")}
                {s(a, "buyerId")} · {copy(s(a, "terms"))}
              </p>
              <p className="muted">
                {copy(" Transport arranger: ")}
                {copy(s(a, "arranger"))}
                {copy(" · payer: ")}
                {copy(s(a, "payer"))}.
              </p>
              <div className="actions">
                {buyer && s(a, "fulfilment") === "delivered" && (
                  <button
                    onClick={() =>
                      open({
                        title: "Record buyer quality inspection",
                        action: "agreement.inspect",
                        fixed: { id: s(a, "id") },
                        fields: [reason()],
                        description:
                          "Delivery OTP confirms handover. This records the separate quality acceptance.",
                      })
                    }
                  >
                    {copy(" Accept delivery quality ")}
                  </button>
                )}
                {buyer && s(a, "fulfilment") === "inspected" && !order && (
                  <button
                    onClick={() =>
                      open({
                        title: "Create sandbox payment order",
                        action: "payment.order",
                        fixed: { id: s(a, "id") },
                        fields: [],
                        descriptionMr: `सर्वरने ठरवलेली रक्कम: ${copy(money(s(a, "totalPaise")))}। भरणा प्रदाता ठरलेला नाही; ही स्थानिक चाचणी भरणा प्रणाली आहे.`,
                        descriptionHi: `सर्वर द्वारा निर्धारित राशि: ${copy(money(s(a, "totalPaise")))}। भुगतान प्रदाता तय नहीं है: यह स्थानीय प्रदर्शन भुगतान प्रणाली है।`,
                        description:
                          "Server amount: " +
                          money(s(a, "totalPaise")) +
                          ". Provider not selected: this uses the clearly labelled local payment simulator.",
                      })
                    }
                  >
                    {copy(" Create payment order ")}
                  </button>
                )}
                {buyer && order && s(order, "status") === "pending" && (
                  <button
                    onClick={() =>
                      open({
                        title: "Simulate sandbox payment capture",
                        action: "payment.demo",
                        fixed: { id: s(order, "id") },
                        fields: [
                          {
                            name: "confirm",
                            label:
                              "I understand this is a mock payment event. No UPI payment or real money transfer occurs.",
                            type: "checkbox",
                          },
                        ],
                        submit: "Simulate capture",
                        descriptionMr: `${copy(money(s(order, "amountPaise")))} · चाचणी आदेश ${s(order, "id")}`,
                        descriptionHi: `${copy(money(s(order, "amountPaise")))} · प्रदर्शन आदेश ${s(order, "id")}`,
                        description:
                          money(s(order, "amountPaise")) +
                          " · sandbox order " +
                          s(order, "id"),
                      })
                    }
                  >
                    {copy(" Simulate sandbox payment ")}
                  </button>
                )}
                <button
                  className="secondary"
                  onClick={() =>
                    open({
                      title: "Open a transaction dispute",
                      action: "dispute.open",
                      fixed: { agreementId: s(a, "id") },
                      fields: [
                        field(
                          "category",
                          "Category (quality, quantity, payment, transport)",
                        ),
                        field(
                          "explanation",
                          "Explain the issue and evidence",
                          "",
                          "textarea",
                        ),
                      ],
                    })
                  }
                >
                  {copy(" Report an issue ")}
                </button>
              </div>
              <EvidenceUpload contextId={s(a, "id")} />
            </div>
          </section>
        );
      })}
      {!data.agreements.length && (
        <section className="panel">
          <Empty
            title={copy("No accepted transactions")}
            description="A seller must accept a valid bid before an agreement, transport job or payment order is created."
          />
        </section>
      )}
      {data.allocations.length > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <h2>{copy("Member allocations")}</h2>
          </div>
          <Table headers={["Member", "Amount", "State"]}>
            {data.allocations.map((r) => (
              <tr key={s(r, "id")}>
                <td>{s(r, "farmerId")}</td>
                <td>{copy(money(s(r, "amountPaise")))}</td>
                <td>
                  <Badge value={s(r, "status")} />
                  <small>{copy("Allocation is not bank settlement.")}</small>
                </td>
              </tr>
            ))}
          </Table>
        </section>
      )}
    </>
  );
}
