import prisma from "../prisma/db.js";
import { updateCurrency, transactiontype } from "../utility/walletService.js";


export async function purchaseItem(user, storeItemId) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch item
    const item = await tx.storeItem.findUnique({
      where: { id: storeItemId, isActive: true },
    });

    if (!item) {
      const err = new Error("Item not found or not active");
      err.statusCode = 400; // Bad Request
      throw err;
    }


    // 2. Check if already purchased
    const alreadyPurchased = await tx.userPurchase.findUnique({
      where: { userId_storeItemId: { userId: user.id, storeItemId } },
    });
    if (alreadyPurchased) {
      const err = new Error("Already purchased");
      err.statusCode = 400; // Bad Request
      throw err;
    }

    const userbalance = user.virtual1 || 0;

    if (userbalance < item.price) {
      const err = new Error(`Insufficient balance to buy this ${item.type}.`, { userbalance });
      err.statusCode = 400; // Bad Request
      throw err;
    }


    if (item.price) {
      await updateCurrency(
        user.id,
        item.price,
        'virtual1',
        'debit',
        transactiontype[item.type]
      );
    }

    // 5. Create purchase record
    const purchase = await tx.userPurchase.create({
      data: {
        userId: user.id,
        storeItemId,
      },
    });

    return purchase;
  });
}


export async function handleStoreItemAction(userId, itemId) {
  // Validate input
  if (!userId || !itemId) {
    throw new Error('Missing required parameters: userId, itemId');
  }

  // Start transaction
  return await prisma.$transaction(async (tx) => {
    // Get user with wallet
    const user = await tx.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get store item with levels
    const storeItem = await tx.storeItem.findUnique({
      where: { id: itemId },
      include: {
        levels: { 
          orderBy: { level: 'asc' },
          where: { level: { in: [1, 2, 3] } } // Ensure we get levels 1,2,3
        }
      }
    });

    if (!storeItem) {
      throw new Error('Store item not found');
    }

    if (!storeItem.levels || storeItem.levels.length === 0) {
      throw new Error('Item levels not configured');
    }

    // Get user's purchase record for this item
    const userPurchase = await tx.userPurchase.findUnique({
      where: {
        userId_itemId: {
          userId: userId,
          itemId: itemId
        }
      }
    });

    // Auto-detect action based on purchase record
    if (!userPurchase || !userPurchase.unlocked) {
      return await handleBuyItem(tx, user, storeItem, userPurchase);
    } else {
      return await handleUpgradeItem(tx, user, storeItem, userPurchase);
    }
  });
}

async function handleBuyItem(tx, user, storeItem, existingPurchase) {
  // Check if already purchased (double check)
  if (existingPurchase && existingPurchase.unlocked) {
    throw new Error('Item already purchased. Use upgrade to level up.');
  }

  // Get level 1 data for initial purchase
  const level1Data = storeItem.levels.find(level => level.level === 1);
  if (!level1Data) {
    throw new Error('Level 1 data not found for this item');
  }

  // Use level 1 upgradeCost as purchase price (common price logic)
  const purchasePrice = level1Data.upgradeCost || 0;
  
  if (purchasePrice > 0) {
    const currencyField = storeItem.currencyType || 'virtual1';
    const userBalance = user[currencyField] || 0;
    
    if (userBalance < purchasePrice) {
      throw new Error(`Insufficient ${currencyField} balance to purchase. Need ${purchasePrice}, have ${userBalance}`);
    }

    // Deduct currency for initial purchase
    await tx.users.update({
      where: { id: user.id },
      data: {
        [currencyField]: {
          decrement: purchasePrice
        }
      }
    });

    // Record transaction
    await tx.userTransactions.create({
      data: {
        user_id: user.id,
        amount: purchasePrice,
        currency: currencyField,
        operation: 'BUY_ITEM',
        transaction_type: 'store_purchase',
        status: 'completed'
      }
    });
  }

  // Create or update purchase record at LEVEL 1
  const purchaseData = {
    userId: user.id,
    itemId: storeItem.id,
    currentLevel: 1, // Start at level 1
    unlocked: true
  };

  const newPurchase = await tx.userPurchase.upsert({
    where: {
      userId_itemId: {
        userId: user.id,
        itemId: storeItem.id
      }
    },
    update: purchaseData,
    create: purchaseData,
    include: {
      StoreItem: {
        include: {
          levels: { orderBy: { level: 'asc' } }
        }
      }
    }
  });

  return {
    success: true,
    message: 'Item purchased successfully',
    action: 'buy',
    cost: purchasePrice,
    data: formatItemResponse(newPurchase.StoreItem, newPurchase)
  };
}

async function handleUpgradeItem(tx, user, storeItem, userPurchase) {
  const currentLevel = userPurchase.currentLevel;
  
  // Check if max level reached
  if (currentLevel >= storeItem.maxLevel) {
    throw new Error('Item already at maximum level');
  }

  // Get next level info
  const nextLevel = storeItem.levels.find(level => level.level === currentLevel + 1);
  if (!nextLevel) {
    throw new Error(`Level ${currentLevel + 1} not found for this item`);
  }

  // Check upgrade cost
  const upgradeCost = nextLevel.upgradeCost || 0;
  
  if (upgradeCost > 0) {
    const currencyField = storeItem.currencyType || 'virtual1';
    const userBalance = user[currencyField] || 0;
    
    if (userBalance < upgradeCost) {
      throw new Error(`Insufficient ${currencyField} balance for upgrade. Need ${upgradeCost}, have ${userBalance}`);
    }

    // Deduct currency for upgrade
    await tx.users.update({
      where: { id: user.id },
      data: {
        [currencyField]: {
          decrement: upgradeCost
        }
      }
    });

    // Record upgrade transaction
    await tx.userTransactions.create({
      data: {
        user_id: user.id,
        amount: upgradeCost,
        currency: currencyField,
        operation: 'UPGRADE_ITEM',
        transaction_type: 'store_upgrade',
        status: 'completed'
      }
    });
  }

  // Update purchase record to next level
  const updatedPurchase = await tx.userPurchase.update({
    where: {
      id: userPurchase.id
    },
    data: {
      currentLevel: currentLevel + 1
    },
    include: {
      StoreItem: {
        include: {
          levels: { orderBy: { level: 'asc' } }
        }
      }
    }
  });

  return {
    success: true,
    message: `Item upgraded to level ${currentLevel + 1} successfully`,
    action: 'upgrade',
    cost: upgradeCost,
    data: formatItemResponse(updatedPurchase.StoreItem, updatedPurchase)
  };
}

function formatItemResponse(storeItem, userPurchase) {
  const currentLevelData = storeItem.levels.find(l => l.level === userPurchase.currentLevel);
  const nextLevel = userPurchase.currentLevel < storeItem.maxLevel 
    ? storeItem.levels.find(l => l.level === userPurchase.currentLevel + 1)
    : null;

  // Get level 1 cost for purchase
  const level1Data = storeItem.levels.find(l => l.level === 1);
  const purchaseCost = level1Data?.upgradeCost || 0;

  return {
    id: storeItem.id,
    name: storeItem.name,
    description: storeItem.description,
    type: storeItem.type,
    baseLevel: storeItem.baseLevel,
    maxLevel: storeItem.maxLevel,
    currentLevel: userPurchase.currentLevel,
    unlocked: userPurchase.unlocked,
    currentStats: currentLevelData?.stats,
    
    // Price information
    purchaseCost: purchaseCost, // Cost to buy (level 1 upgradeCost)
    nextUpgradeCost: nextLevel?.upgradeCost || null, // Cost for next upgrade
    currencyType: storeItem.currencyType || 'virtual1',
    
    // Action information
    canBuy: !userPurchase?.unlocked,
    canUpgrade: userPurchase.unlocked && userPurchase.currentLevel < storeItem.maxLevel,
    isMaxLevel: userPurchase.unlocked && userPurchase.currentLevel >= storeItem.maxLevel,
    
    nextLevelStats: nextLevel?.stats || null,
    
    levels: storeItem.levels.map(lvl => ({
      level: lvl.level,
      upgradeCost: lvl.upgradeCost,
      stats: lvl.stats,
    })),
  };
}

export async function listStoreItems(userId) {
  const storeItems = await prisma.storeItem.findMany({
    include: {
      // levels: { 
      //   orderBy: { level: 'asc' },
      //   where: { level: { in: [1, 2, 3] } }
      // },
      UserPurchase: {
        where: { userId },
        select: { 
          id: true,
          currentLevel: true, 
          unlocked: true 
        },
      },
    },
  });

  const response = storeItems.map(item => {
    const userPurchase = item.UserPurchase[0];
    const isPurchased = userPurchase?.unlocked || false;
    const currentLevel = userPurchase?.currentLevel || 1;

    // const level1Data = item.levels.find(l => l.level === 1);
    // const nextLevel = isPurchased && currentLevel < item.maxLevel 
    //   ? item.levels.find(l => l.level === currentLevel + 1)
    //   : null;

    // Purchase cost is level 1 upgradeCost
    // const purchaseCost = level1Data?.upgradeCost || 0;
    
    // Auto-detect suggested action and cost
    // let suggestedAction = 'buy';
    // let suggestedCost = purchaseCost;
    
    // if (isPurchased) {
    //   if (currentLevel < item.maxLevel) {
    //     suggestedAction = 'upgrade';
    //     suggestedCost = nextLevel?.upgradeCost || 0;
    //   } else {
    //     suggestedAction = 'max_level';
    //     suggestedCost = 0;
    //   }
    // }

    return {
      id: item.id,
      name: item.name,
      // description: item.description,
      type: item.type,
      // baseLevel: item.baseLevel,
      // maxLevel: item.maxLevel,
      currentLevel: currentLevel,
      unlocked: isPurchased,
      // currentStats: item.levels.find(l => l.level === currentLevel)?.stats,
      
      // Price information (all from levels table)
      // purchaseCost: purchaseCost, // Cost to buy = level 1 upgradeCost
      // nextUpgradeCost: nextLevel?.upgradeCost || null, // Cost for next level
      // currencyType: item.currencyType || 'virtual1',
      
      // Action information
      // suggestedAction: suggestedAction,
      // suggestedCost: suggestedCost,
      
      // Detailed flags
      // canBuy: !isPurchased,
      // canUpgrade: isPurchased && currentLevel < item.maxLevel,
      // isMaxLevel: isPurchased && currentLevel >= item.maxLevel,
      
      // nextLevelStats: nextLevel?.stats || null,
      
      // levels: item.levels.map(lvl => ({
      //   level: lvl.level,
      //   upgradeCost: lvl.upgradeCost,
      //   stats: lvl.stats,
      // })),
    };
  });

  return response;
}


export async function getItemDetail(userId, itemId) {
  if (!userId || !itemId) {
    throw new Error('Missing required parameters: userId, itemId');
  }

  const itemDetails = await prisma.storeItem.findUnique({
    where: { id: itemId },
    include: {
      levels: { 
        orderBy: { level: 'asc' }
      },
      UserPurchase: {
        where: { userId },
        select: { 
          id: true,
          currentLevel: true, 
          unlocked: true 
        },
      },
    },
  });

  if (!itemDetails) {
    throw new Error('Item not found');
  }

  const userPurchase = itemDetails.UserPurchase[0];
  const isPurchased = userPurchase?.unlocked || false;
  const currentLevel = userPurchase?.currentLevel || 1;

  // Get level 1 data for purchase cost
  const level1Data = itemDetails.levels.find(l => l.level === 1);
  
  // Get next level data for upgrade info
  const nextLevel = isPurchased && currentLevel < itemDetails.maxLevel 
    ? itemDetails.levels.find(l => l.level === currentLevel + 1)
    : null;

  // Current level stats
  const currentLevelData = itemDetails.levels.find(l => l.level === currentLevel);

  // Auto-detect suggested action
  let suggestedAction = 'buy';
  let suggestedCost = level1Data?.upgradeCost || 0;
  
  if (isPurchased) {
    if (currentLevel < itemDetails.maxLevel) {
      suggestedAction = 'upgrade';
      suggestedCost = nextLevel?.upgradeCost || 0;
    } else {
      suggestedAction = 'max_level';
      suggestedCost = 0;
    }
  }

  return {
    id: itemDetails.id,
    name: itemDetails.name,
    description: itemDetails.description,
    type: itemDetails.type,
    // baseLevel: itemDetails.baseLevel,
    maxLevel: itemDetails.maxLevel,
    currentLevel: currentLevel,
    unlocked: isPurchased,
    
    // Current stats
    currentStats: currentLevelData?.stats || {},
    
    // Price information
    purchaseCost: level1Data?.upgradeCost || 0,
    nextUpgradeCost: nextLevel?.upgradeCost || null,
    currencyType: itemDetails.currencyType || 'virtual1',
    
    // Action information
    suggestedAction: suggestedAction,
    suggestedCost: suggestedCost,
    
    // Status flags
    canBuy: !isPurchased,
    canUpgrade: isPurchased && currentLevel < itemDetails.maxLevel,
    isMaxLevel: isPurchased && currentLevel >= itemDetails.maxLevel,
    
    // Next level info (if available)
    nextLevelStats: nextLevel?.stats || null,
    nextLevel: nextLevel?.level || null,
    
    // All levels with detailed information
    // levels: itemDetails.levels.map(lvl => ({
    //   level: lvl.level,
    //   upgradeCost: lvl.upgradeCost,
    //   stats: lvl.stats,
    //   isCurrentLevel: lvl.level === currentLevel,
    //   isUnlocked: isPurchased && lvl.level <= currentLevel,
    // })),
  };
}