import { db, demo } from "./db";
import { seed } from "./seed";
import { marketObservations } from "./local-market-data";
import type { User } from "@prisma/client";
import { jsonSafe } from "./domain";
export type Row = Record<string, unknown>;
export type PortalData = {
  asOf: string;
  user: Row;
  demo: boolean;
  lots: Row[];
  bids: Row[];
  agreements: Row[];
  toleranceProposals: Row[];
  demands: Row[];
  circles: Row[];
  contributions: Row[];
  warehouses: Row[];
  bookings: Row[];
  quality: Row[];
  jobs: Row[];
  quotes: Row[];
  vehicles: Row[];
  payments: Row[];
  allocations: Row[];
  threads: Row[];
  messages: Row[];
  notifications: Row[];
  disputes: Row[];
  users: Row[];
  prices: Row[];
  imports: Row[];
  audit: Row[];
  trustEvents: Row[];
  inventory: Row[];
  locations: Row[];
  counts: {
    lots: number;
    bids: number;
    agreements: number;
    notifications: number;
    messages: number;
  };
};
export async function portalData(u: User, page = 1): Promise<PortalData> {
  const p = await db();
  if (demo) await seed(p);
  const admin = u.role === "admin",
    fpo = u.role === "fpo";
  const owned = { ownerId: u.id };
  const lotWhere = admin
    ? {}
    : u.role === "buyer"
      ? { status: { in: ["open", "committed"] } }
      : fpo
        ? { OR: [owned, { fpoId: u.fpoId }] }
        : owned;
  const lots = await p.lot.findMany({
    where: lotWhere,
    orderBy: { createdAt: "desc" },
    take: 20,
    skip: (page - 1) * 20,
  });
  const lotOwners = await p.user.findMany({ where: { id: { in: [...new Set(lots.map((lot) => lot.ownerId))] } }, select: { id: true, name: true, trustScore: true } });
  const visibleLots = lots.map((lot) => {
    const owner = lotOwners.find((person) => person.id === lot.ownerId);
    return { ...lot, ownerName: owner?.name || "Farmer", ownerTrustScore: owner?.trustScore ?? 100, ownerTrustVerified: (owner?.trustScore ?? 100) >= 60 };
  });
  const eligible = await p.user.findMany({
    where: { role: "buyer", status: "approved", suspended: false },
    select: { id: true },
  });
  const bids = await p.bid.findMany({
    where: admin ? {} : { lotId: { in: lots.map((l) => l.id) } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const eligibleIds = eligible.map((x) => x.id);
  const publicBids = bids.map((b) => ({
    ...b,
    eligible: eligibleIds.includes(b.buyerId) && b.expiresAt > new Date(),
    buyerId:
      admin ||
      lots.some((l) => l.id === b.lotId && l.ownerId === u.id) ||
      b.buyerId === u.id
        ? b.buyerId
        : "Verified bidder " + b.buyerId.slice(-4),
    terms:
      u.role === "buyer" && b.buyerId !== u.id
        ? "Comparable full-lot offer"
        : b.terms,
  }));
  const agreements = await p.agreement.findMany({
    where: admin ? {} : { OR: [{ sellerId: u.id }, { buyerId: u.id }] },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  const buyerDemandIds = u.role === "buyer" ? (await p.demand.findMany({ where: { buyerId: u.id }, select: { id: true } })).map((demand) => demand.id) : [];
  const circles = await p.circle.findMany({
    where: fpo ? { fpoId: u.fpoId! } : u.role === "buyer" ? { demandId: { in: buyerDemandIds } } : {},
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  const contributions = await p.contribution.findMany({
    where: admin
      ? {}
      : fpo
        ? { circleId: { in: circles.map((x) => x.id) } }
        : u.role === "buyer"
          ? { circleId: { in: circles.map((circle) => circle.id) } }
          : { farmerId: u.id },
    take: 100,
  });
  const warehouses = await p.warehouse.findMany({ take: 20 });
  const bookings = await p.booking.findMany({
    where: admin
      ? {}
      : fpo
        ? {
            warehouseId: {
              in: warehouses
                .filter((x) => x.fpoId === u.fpoId)
                .map((x) => x.id),
            },
          }
        : { farmerId: u.id },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  const jobs = await p.transportJob.findMany({
    where: admin
      ? {}
      : u.role === "transporter"
        ? { OR: [{ status: "open" }, { transporterId: u.id }] }
        : { OR: [{ sellerId: u.id }, { buyerId: u.id }] },
    take: 20,
    orderBy: { createdAt: "desc" },
  });
  const threads = await p.thread.findMany({
    where: { memberIds: { has: u.id } },
    take: 20,
  });
  const data = {
    asOf: new Date().toISOString(),
    user: u,
    demo,
    lots: visibleLots,
    bids: publicBids,
    agreements,
    toleranceProposals: await p.toleranceProposal.findMany({ where: { agreementId: { in: agreements.map((item) => item.id) } }, orderBy: { createdAt: "desc" }, take: 100 }),
    circles,
    contributions,
    warehouses,
    bookings,
    jobs,
    threads,
    demands: await p.demand.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    quality: await p.quality.findMany({
      where: admin ? {} : fpo ? { fpoId: u.fpoId! } : { requesterId: u.id },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    quotes: await p.quote.findMany({
      where: {
        jobId: {
          in: jobs
            .filter(
              (j) =>
                admin ||
                j.sellerId === u.id ||
                j.buyerId === u.id ||
                j.transporterId === u.id,
            )
            .map((j) => j.id),
        },
      },
      take: 50,
    }),
    vehicles: await p.vehicle.findMany({
      where: admin ? {} : { ownerId: u.id },
      take: 20,
    }),
    payments: await p.paymentOrder.findMany({
      where: { agreementId: { in: agreements.map((x) => x.id) } },
      take: 20,
    }),
    allocations: await p.allocation.findMany({
      where: admin
        ? {}
        : fpo
          ? { agreementId: { in: agreements.map((x) => x.id) } }
          : { farmerId: u.id },
      take: 50,
    }),
    messages: await p.message.findMany({
      where: { threadId: { in: threads.map((x) => x.id) } },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    notifications: await p.notification.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    disputes: await p.dispute.findMany({
      where: admin ? {} : { agreementId: { in: agreements.map((x) => x.id) } },
      take: 20,
    }),
    users: await p.user.findMany({
      where: admin
        ? {}
        : fpo
          ? { fpoId: u.fpoId }
          : ["farmer", "buyer"].includes(u.role)
            ? { role: "transporter" }
            : { id: u.id },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
        suspended: true,
        village: true,
        trustScore: true,
      },
      take: 20,
    }),
    prices: await marketObservations(),
    imports: admin
      ? await p.importBatch.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
        })
      : [],
    audit: admin
      ? await p.auditEvent.findMany({
          take: 20,
          orderBy: { createdAt: "desc" },
        })
      : [],
    trustEvents: await p.trustEvent.findMany({
      where: admin ? {} : { userId: u.id },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    inventory: await p.stockMovement.findMany({
      where: admin ? {} : fpo ? { fpoId: u.fpoId! } : { farmerId: u.id },
      take: 20,
    }),
    locations: await p.locationPing.findMany({
      where: {
        jobId: {
          in: jobs
            .filter(
              (j) =>
                j.sellerId === u.id ||
                j.buyerId === u.id ||
                j.transporterId === u.id,
            )
            .map((j) => j.id),
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    counts: {
      lots: await p.lot.count({ where: lotWhere }),
      bids: publicBids.filter((b) => b.status === "active" && b.eligible)
        .length,
      agreements: agreements.length,
      notifications: await p.notification.count({
        where: { userId: u.id, read: false },
      }),
      messages: await p.message.count({
        where: { threadId: { in: threads.map((x) => x.id) }, senderId: { not: u.id }, readAt: null },
      }),
    },
  };
  if (fpo) {
    if (!u.permissions.includes("verify") && !u.permissions.includes("manage")) {
      data.quality = [];
      data.users = [];
    } else if (!u.permissions.includes("verify")) {
      data.quality = [];
    }
    if (!u.permissions.includes("warehouse")) {
      data.bookings = [];
      data.inventory = [];
    }
    if (!u.permissions.includes("collect") && !u.permissions.includes("manage"))
      data.contributions = [];
    if (!u.permissions.includes("accounts")) {
      data.payments = [];
      data.allocations = [];
      data.agreements = [];
    }
    if (!u.permissions.includes("manage")) {
      data.lots = [];
      data.bids = [];
    }
  }
  return jsonSafe(data) as PortalData;
}
