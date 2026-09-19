import { createReadStream } from "node:fs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { parse } from "csv-parse";
import { db, atomic, demo } from "../lib/db";
import { crops, insist, rupeesToPaise } from "../lib/domain";
const aliases: Record<string, string> = {
  chana: "gram",
  jowar: "sorghum",
  dhan: "paddy",
};
export function canonicalCrop(value: string) {
  const v = value.trim().toLowerCase();
  return aliases[v] || v;
}
export async function importPrices() {
  const uri = process.env.PRICE_CSV_URI || (demo ? "fixtures/prices.csv" : "");
  insist(
    uri && !/^https?:/.test(uri),
    "CSV_UNAVAILABLE",
    "Configure an operator-managed local CSV source.",
    503,
  );
  const sourcePath = path.resolve(uri);
  const buffer = await readFile(sourcePath);
  insist(
    buffer.length <= 20 * 1024 * 1024,
    "CSV_TOO_LARGE",
    "Split source files larger than 20 MB.",
  );
  const checksum = createHash("sha256").update(buffer).digest("hex");
  await mkdir("work/import-archive", { recursive: true });
  await writeFile(
    path.resolve("work/import-archive", checksum + ".csv"),
    buffer,
  );
  const p = await db();
  const prior = await p.importBatch.findUnique({ where: { checksum } });
  if (prior) return prior;
  const valid: {
      source: string;
      market: string;
      district: string;
      crop: string;
      variety: string;
      observedDate: Date;
      unit: string;
      minPaise: bigint;
      modalPaise: bigint;
      maxPaise: bigint;
      key: string;
    }[] = [],
    errors: { row: number; reason: string }[] = [];
  let index = 1;
  const parser = createReadStream(sourcePath).pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
      trim: true,
      max_record_size: 10000,
    }),
  );
  for await (const raw of parser) {
    index++;
    const r = raw as Record<string, string>;
    try {
      const required = [
        "source",
        "market",
        "district",
        "state",
        "commodity",
        "variety",
        "observed_date",
        "unit",
        "min_price",
        "modal_price",
        "max_price",
      ];
      insist(
        required.every((k) => k in r),
        "CSV_INVALID_ROW",
        "Required CSV header missing",
      );
      const crop = canonicalCrop(r.commodity);
      insist(
        (crops as readonly string[]).includes(crop) && r.unit === "quintal",
        "CSV_INVALID_ROW",
        "Unsupported crop or unit",
      );
      insist(
        /^\d{4}-\d{2}-\d{2}$/.test(r.observed_date) &&
          new Date(r.observed_date).toISOString().slice(0, 10) ===
            r.observed_date,
        "CSV_INVALID_ROW",
        "Invalid ISO date",
      );
      const minPaise = rupeesToPaise(r.min_price),
        modalPaise = rupeesToPaise(r.modal_price),
        maxPaise = rupeesToPaise(r.max_price);
      insist(
        minPaise > 0n &&
          minPaise <= modalPaise &&
          modalPaise <= maxPaise &&
          maxPaise < 100000000n,
        "CSV_INVALID_ROW",
        "Invalid price bounds",
      );
      insist(
        r.source && r.market && r.district,
        "CSV_INVALID_ROW",
        "Source, market and district are required",
      );
      const key = [
        r.source,
        r.market,
        r.district,
        crop,
        r.variety,
        r.observed_date,
        r.unit,
      ].join("|");
      insist(
        !valid.some((x) => x.key === key),
        "CSV_INVALID_ROW",
        "Duplicate observation in batch",
      );
      valid.push({
        key,
        source: r.source,
        market: r.market,
        district: r.district,
        crop,
        variety: r.variety,
        observedDate: new Date(r.observed_date),
        unit: r.unit,
        minPaise,
        modalPaise,
        maxPaise,
      });
    } catch (e) {
      errors.push({
        row: index,
        reason: e instanceof Error ? e.message : "Invalid row",
      });
    }
  }
  return atomic(async (tx) => {
    const existing = await tx.importBatch.findUnique({ where: { checksum } });
    if (existing) return existing;
    const batch = await tx.importBatch.create({
      data: {
        checksum,
        source: uri,
        accepted: valid.length,
        rejected: errors.length,
        errors,
      },
    });
    for (const row of valid) {
      await tx.priceObservation.upsert({
        where: { key: row.key },
        create: { ...row, batchId: batch.id },
        update: { ...row, batchId: batch.id, revision: { increment: 1 } },
      });
    }
    return batch;
  });
}
