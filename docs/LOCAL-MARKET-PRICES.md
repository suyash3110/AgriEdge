# Local market prices and selling guidance

The application reads the supplied mandi-prices.csv without requiring Gemini, Python, a worker process, or an open Codex conversation. The homepage, public market page, signed-in dashboards and price-related voice responses use the same market service.

## Update prices

The current installation watches the path in the private `MANDI_CSV_PATH` setting (D:\Downloads\mandi-prices.csv). Replace that file with the latest export using the same columns. A portable fallback is stored at `data/mandi-prices.csv` in the project. If the Downloads file is unavailable, update the project copy instead. Successful reads also retain a last-good copy under `work/last-good-mandi.csv`.

Reload a page to read an updated file immediately. Visible price/recommendation pages refresh every 60 seconds. No rebuild or database import is needed for CSV updates. Unsupported headers or a wholly invalid replacement do not erase the last-good source. Invalid individual rows are excluded. Accepted dates, crop/market/grade and positive INR/quintal prices are preserved; missing min/max values are not displayed as zero.

The supplied export contains 500 rows dated 25 August through 8 September 2026, attributed within the file to data.gov.in. It is a dated snapshot, not an automatically updating live feed. A source label is preserved attribution, not independent verification. Rice prices are not relabelled as paddy prices. Market grades such as FAQ are not the model's A/B/C image grades.

## Selling recommendations

Open Market Prices and use Crop selling recommendations, or use the farmer dashboard / AI Assistant selling topic. Select crop, market grade and kilograms, then enter the total transport, handling and market cost for each market. Comparison uses only the newest common observation date for that crop/grade, excluding older observations and other grades from ranking.

Gross paise = modal INR/quintal × 100 × kilograms / 100. Net = gross minus entered costs. Empty costs are explicitly treated as zero; enter actual costs before deciding. The highest calculated net is identified as the first market to compare, not a guaranteed buyer offer. Older-than-two-day data requires confirmation of today's quote. This is an offline comparison, not a trained future-price prediction or an instruction to delay perishable produce.

Price/selling questions in English, Hindi and Marathi receive a data-backed local response without waiting for Gemini or the local LLM. Other assistant questions retain the existing configured providers.

## Gemini and availability

The existing search-grounded Gemini integration remains enabled when a key is configured. It refreshes in the background, accepts sourced recent observations, and merges them with local observations. The key was retested on 15 September 2026 and Google returned HTTP 429 RESOURCE_EXHAUSTED. This provider issue does not prevent CSV prices or the local comparison from working. Network service availability is not guaranteed by a local launcher.

Double-click Start AgriEdge.cmd to start the standalone application and supervisor. Keep the PC running. The public /api/v1/market-prices endpoint returns the same current local observations and their actual dates for a quick operational check.
