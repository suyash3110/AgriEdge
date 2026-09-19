import type { PrismaClient } from "@prisma/client";
export const demoUsers = [
  { id: "farmer-1", phone: "9000000001", name: "Ram Prasad", role: "farmer" },
  { id: "farmer-2", phone: "9000000002", name: "Savitri Devi", role: "farmer" },
  { id: "fpo-1", phone: "9000000003", name: "Nagpur Kisan FPO", role: "fpo" },
  { id: "buyer-1", phone: "9000000004", name: "Vindhya Foods", role: "buyer" },
  { id: "buyer-2", phone: "9000000005", name: "Narmada Agro", role: "buyer" },
  {
    id: "transporter-1",
    phone: "9000000006",
    name: "Ravi Transport",
    role: "transporter",
  },
  {
    id: "admin-1",
    phone: "9000000007",
    name: "Pilot Administrator",
    role: "admin",
  },
];
export async function seed(p: PrismaClient) {
  if (await p.user.count()) return;
  await p.$transaction(async (tx) => {
    for (const u of demoUsers)
      await tx.user.create({
        data: {
          ...u,
          village: "Nagpur",
          status: "approved",
          fpoId: ["farmer", "fpo"].includes(u.role) ? "fpo-1" : null,
          permissions:
            u.role === "fpo"
              ? ["verify", "collect", "warehouse", "accounts", "manage"]
              : [],
          crops: u.role === "farmer" ? ["wheat", "tomato"] : [],
        },
      });
    const now = new Date(),
      deadline = new Date(now.getTime() + 7 * 86400000);
    await tx.lot.createMany({
      data: [
        {
          id: "lot-wheat",
          ownerId: "farmer-1",
          fpoId: "fpo-1",
          title: "Wheat · Lokwan",
          crop: "wheat",
          kg: "1200",
          expectedRate: 245000n,
          grade: "Farmer declared · FAQ",
          location: "Kamptee, Nagpur",
          harvestDate: now,
          availableDate: now,
          deadline,
          status: "open",
        },
        {
          id: "lot-tomato",
          ownerId: "farmer-1",
          fpoId: "fpo-1",
          title: "Fresh tomato",
          crop: "tomato",
          kg: "450",
          expectedRate: 180000n,
          grade: "Farmer declared",
          location: "Kamptee, Nagpur",
          harvestDate: now,
          availableDate: now,
          deadline,
          status: "open",
        },
        {
          id: "lot-residue",
          ownerId: "farmer-2",
          fpoId: "fpo-1",
          title: "Paddy straw · loose",
          crop: "paddy",
          category: "residue",
          material: "straw",
          form: "loose",
          intendedUse: "Biogas processing",
          contamination: "No measured assessment",
          kg: "2000",
          expectedRate: 35000n,
          location: "Hingna, Nagpur",
          harvestDate: now,
          availableDate: now,
          deadline,
          status: "open",
        },
        {
          id: "lot-wheat-2",
          ownerId: "farmer-2",
          fpoId: "fpo-1",
          title: "Wheat · collection stock",
          crop: "wheat",
          kg: "800",
          expectedRate: 240000n,
          location: "Hingna, Nagpur",
          harvestDate: now,
          availableDate: now,
          deadline,
          status: "open",
        },
      ],
    });
    await tx.bid.createMany({
      data: [
        {
          id: "bid-1",
          lotId: "lot-wheat",
          buyerId: "buyer-1",
          rate: 247000n,
          costPaise: 120000n,
          payer: "seller",
          arranger: "seller",
          terms: "Payment after delivery inspection",
          expiresAt: deadline,
        },
        {
          id: "bid-2",
          lotId: "lot-wheat",
          buyerId: "buyer-2",
          rate: 251000n,
          costPaise: null,
          payer: "buyer",
          arranger: "buyer",
          terms: "Payment after delivery inspection",
          expiresAt: deadline,
        },
      ],
    });
    await tx.demand.create({
      data: {
        id: "demand-1",
        buyerId: "buyer-1",
        crop: "wheat",
        kg: "3000",
        grade: "FAQ",
        location: "Nagpur",
        deadline,
        terms: "Full lot; payment after inspection",
      },
    });
    await tx.circle.create({
      data: {
        id: "circle-1",
        fpoId: "fpo-1",
        demandId: "demand-1",
        name: "Nagpur wheat collection",
        crop: "wheat",
        grade: "FAQ",
        targetKg: "3000",
        minimumKg: "1000",
        hub: "Nagpur Kisan collection centre",
        deadline,
      },
    });
    await tx.warehouse.create({
      data: {
        id: "warehouse-1",
        fpoId: "fpo-1",
        name: "Nagpur Kisan dry storage",
        address: "Kamptee collection centre, Nagpur",
        crops: ["wheat", "paddy", "gram", "mustard"],
        type: "Dry, ventilated storage",
        capacityKg: "25000",
        ratePaise: 20n,
      },
    });
    await tx.vehicle.create({
      data: {
        id: "vehicle-1",
        ownerId: "transporter-1",
        registration: "DEMO-MP17-001",
        type: "Covered light goods vehicle",
        capacityKg: "5000",
      },
    });
    await tx.thread.create({
      data: {
        id: "thread-1",
        title: "Wheat lot enquiry",
        memberIds: ["farmer-1", "buyer-1"],
        contextId: "lot-wheat",
      },
    });
    await tx.message.create({
      data: {
        threadId: "thread-1",
        senderId: "buyer-1",
        body: "Please confirm the collection window for your wheat lot.",
      },
    });
    await tx.notification.create({
      data: {
        userId: "farmer-1",
        title: "Two competing bids are ready for your review.",
        href: "lots",
      },
    });
  });
}
