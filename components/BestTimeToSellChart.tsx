"use client";
import { useMemo } from "react";
import { useLocale } from "next-intl";
import { local } from "@/lib/locale";
import { marketCopy } from "@/lib/market-copy";
import { computeBestTimeChart } from "@/lib/best-time-chart";
import type { MarketObservation } from "@/lib/mandi-csv";

/* ─── SVG Bar Chart ─── */
const BAR_GAP = 6;
const BAR_MIN_H = 4;
const CHART_H = 180;
const LABEL_H = 50;
const Y_LABEL_W = 58;
const GRID_LINES = 4;

function Bar({
  x,
  width,
  value,
  max,
  isBest,
  isWorst,
  label,
  locale,
}: {
  x: number;
  width: number;
  value: number;
  max: number;
  isBest: boolean;
  isWorst: boolean;
  label: string;
  locale: string;
}) {
  const barH = max > 0 ? Math.max((value / max) * (CHART_H - 20), BAR_MIN_H) : BAR_MIN_H;
  const y = CHART_H - barH;
  const fill = isBest ? "#236b45" : isWorst ? "#b42318" : "#5b8a72";
  const money = `₹${value.toLocaleString(locale + "-IN")}`;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={barH}
        rx={3}
        fill={fill}
        opacity={isBest || isWorst ? 1 : 0.7}
      >
        <title>{`${label}: ${money}/q`}</title>
      </rect>
      {/* Value on top of bar */}
      <text
        x={x + width / 2}
        y={y - 5}
        textAnchor="middle"
        fontSize={10}
        fill={isBest ? "#236b45" : isWorst ? "#b42318" : "#475467"}
        fontWeight={isBest || isWorst ? 700 : 400}
      >
        {money}
      </text>
      {/* Month label below */}
      <text
        x={x + width / 2}
        y={CHART_H + 16}
        textAnchor="middle"
        fontSize={11}
        fill="#475467"
        fontWeight={isBest || isWorst ? 700 : 400}
      >
        {label}
      </text>
      {/* Best / Avoid tag */}
      {isBest && (
        <text
          x={x + width / 2}
          y={CHART_H + 30}
          textAnchor="middle"
          fontSize={10}
          fill="#236b45"
          fontWeight={700}
        >
          ★ {local(locale, "SELL", "बेचें", "विका")}
        </text>
      )}
      {isWorst && (
        <text
          x={x + width / 2}
          y={CHART_H + 30}
          textAnchor="middle"
          fontSize={10}
          fill="#b42318"
          fontWeight={700}
        >
          ✕ {local(locale, "AVOID", "बचें", "टाळा")}
        </text>
      )}
    </g>
  );
}

export default function BestTimeToSellChart({
  prices,
  crop,
  variety,
}: {
  prices: MarketObservation[];
  crop: string;
  variety: string;
}) {
  const locale = useLocale();
  const c = (en: string, hi: string, mr: string) => local(locale, en, hi, mr);

  const data = useMemo(
    () => computeBestTimeChart(prices, crop, variety),
    [prices, crop, variety],
  );

  if (data.months.length < 1) return null;

  const maxVal = Math.max(...data.months.map((m) => m.avgModal));
  const chartW = Math.max(data.months.length * 60, 360);
  const totalW = Y_LABEL_W + chartW + 10;
  const totalH = CHART_H + LABEL_H + 10;
  const barW = Math.min(
    (chartW - BAR_GAP * (data.months.length + 1)) / data.months.length,
    44,
  );

  // Grid line values
  const gridStep = maxVal / GRID_LINES;
  const gridLines = Array.from({ length: GRID_LINES + 1 }, (_, i) =>
    Math.round(gridStep * i),
  );

  return (
    <section className="panel" style={{ marginTop: 16 }}>
      <div className="panel-heading">
        <h2 style={{ fontSize: 16, margin: 0 }}>
          📊 {c(
            "Best time to sell",
            "बेचने का सबसे अच्छा समय",
            "विक्रीसाठी सर्वोत्तम वेळ",
          )}{" "}
          — {marketCopy(locale, crop)}
          <small style={{ fontWeight: 400, marginLeft: 8, color: "#475467" }}>
            ({marketCopy(locale, variety)})
          </small>
        </h2>
      </div>
      <div className="panel-body">
        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 14,
            fontSize: 12,
            color: "#475467",
          }}
        >
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#236b45",
                borderRadius: 2,
                marginRight: 5,
                verticalAlign: "middle",
              }}
            />
            {c("Best month (sell)", "सबसे अच्छा महीना (बेचें)", "सर्वोत्तम महिना (विका)")}
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#b42318",
                borderRadius: 2,
                marginRight: 5,
                verticalAlign: "middle",
              }}
            />
            {c("Worst month (avoid)", "सबसे खराब महीना (बचें)", "सर्वात वाईट महिना (टाळा)")}
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#5b8a72",
                borderRadius: 2,
                marginRight: 5,
                verticalAlign: "middle",
              }}
            />
            {c("Other months", "अन्य महीने", "इतर महिने")}
          </span>
        </div>

        {/* Chart */}
        <div style={{ overflowX: "auto" }}>
          <svg
            width={totalW}
            height={totalH}
            viewBox={`0 0 ${totalW} ${totalH}`}
            role="img"
            aria-label={c(
              `Monthly average price chart for ${crop}`,
              `${crop} के लिए मासिक औसत मूल्य चार्ट`,
              `${crop} साठी मासिक सरासरी भाव चार्ट`,
            )}
            style={{ display: "block" }}
          >
            {/* Y-axis grid lines and labels */}
            {gridLines.map((v) => {
              const y = maxVal > 0 ? CHART_H - (v / maxVal) * (CHART_H - 20) : CHART_H;
              return (
                <g key={v}>
                  <line
                    x1={Y_LABEL_W}
                    y1={y}
                    x2={totalW}
                    y2={y}
                    stroke="#e2e7eb"
                    strokeWidth={1}
                  />
                  <text
                    x={Y_LABEL_W - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill="#667687"
                  >
                    ₹{v.toLocaleString(locale + "-IN")}
                  </text>
                </g>
              );
            })}

            {/* X-axis baseline */}
            <line
              x1={Y_LABEL_W}
              y1={CHART_H}
              x2={totalW}
              y2={CHART_H}
              stroke="#9caab7"
              strokeWidth={1}
            />

            {/* Bars */}
            {data.months.map((m, i) => {
              const x =
                Y_LABEL_W +
                BAR_GAP +
                i * ((chartW - BAR_GAP) / data.months.length) +
                ((chartW - BAR_GAP) / data.months.length - barW) / 2;
              return (
                <Bar
                  key={m.month}
                  x={x}
                  width={barW}
                  value={m.avgModal}
                  max={maxVal}
                  isBest={m.isBest}
                  isWorst={m.isWorst}
                  label={m.label}
                  locale={locale}
                />
              );
            })}

            {/* Y-axis title */}
            <text
              x={12}
              y={CHART_H / 2}
              textAnchor="middle"
              fontSize={10}
              fill="#667687"
              transform={`rotate(-90, 12, ${CHART_H / 2})`}
            >
              {c("INR / quintal", "रुपये / क्विंटल", "रुपये / क्विंटल")}
            </text>
          </svg>
        </div>

        {/* Summary */}
        <p
          style={{
            marginTop: 14,
            fontSize: 13,
            padding: "10px 14px",
            background: "#eaf5ed",
            border: "1px solid #b9d8c2",
            borderRadius: 4,
            color: "#1c603a",
          }}
        >
          <strong>
            {c("Recommendation", "सुझाव", "शिफारस")}:
          </strong>{" "}
          {c(
            data.summary,
            data.summary, // The summary is in English; translation is best effort
            data.summary,
          )}
        </p>

        <small style={{ color: "#475467", fontSize: 11 }}>
          {c(
            "Historical comparison only. Not a future-price forecast. Confirm buyer quote before selling.",
            "केवल ऐतिहासिक तुलना। भविष्य के भाव का पूर्वानुमान नहीं। बेचने से पहले खरीदार की बोली की पुष्टि करें।",
            "केवळ ऐतिहासिक तुलना. भविष्यातील भावाचा अंदाज नाही. विक्रीपूर्वी खरेदीदाराचा भाव तपासा.",
          )}
        </small>
      </div>
    </section>
  );
}
