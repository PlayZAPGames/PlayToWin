import prisma from "../prisma/db.js";
import { updateCurrency } from "../utility/walletService.js";


// POST /api/superpowers/buy
// body: { superPowerId: number, quantity: number }

export async function buySuperPower(req, res) {
  const userId = req.user.id;
  const { superPowerId, quantity } = req.body;

  console.log("userID", userId);
  console.log("superPowerId", superPowerId);
  console.log("quantity", quantity);
  

  await prisma.$transaction(async (tx) => {
    const power = await tx.superPower.findUnique({ where: { id: superPowerId } });
    if (!power || !power.isActive) {
      throw new Error("Super power not available");
    }

    const cost = power.price * quantity;

    const userbalance = req.user.virtual1 || 0;

    if (userbalance < cost) {
      const err = new Error(`Insufficient balance to buy this power.`, { userbalance });
      err.statusCode = 400; // Bad Request
      throw err;
    }

    // Deduct user tokens

    if (cost) {
      await updateCurrency(
        userId,
        cost,
        'virtual1',
        'debit',
        'superPowerPurchase'
      );
    }
    // Add to inventory (upsert)
    await tx.userSuperPower.upsert({
      where: { userId_superPowerId: { userId, superPowerId } },
      create: { userId, superPowerId, quantity },
      update: { quantity: { increment: quantity } },
    });
  });

  return true;
}
// POST /api/superpowers/use
// body: { superPowerId: number }

export async function useSuperPower(req, res) {
  const userId = req.user.id;
  const { superPowerId } = req.body;

  const userPower = await prisma.userSuperPower.findUnique({
    where: { userId_superPowerId: { userId, superPowerId } },
  });

  if (!userPower || userPower.quantity <= 0) {
     const err = new Error(`No super power in inventory`);
      err.statusCode = 400; // Bad Request
      throw err;
  }

  await prisma.userSuperPower.update({
    where: { userId_superPowerId: { userId, superPowerId } },
    data: { quantity: { decrement: 1 } },
  });

  return true;
}



// GET /api/superpowers/list
export async function listSuperPowers(req, res) {
  const userId = req.user.id;

  const powers = await prisma.superPower.findMany({
    where: { isActive: true },
    orderBy: {id: 'asc'},
    include: {
      userPowers: {
        where: { userId },
        select: { quantity: true },
      },
    },
  });

  const formatted = powers.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description,
    inventory: p.userPowers[0]?.quantity ?? 0,
    icon: p.icon,
  }));

  return formatted;
}
