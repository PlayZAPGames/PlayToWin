import express from 'express';
import prisma  from '../../prisma/db.js';
import { makeResponse, statusCodes, responseMessages } from '../../helpers/index.js';
const { SUCCESS } = statusCodes;
import { validators } from '../../middleware/validateResource/index.js';
const router = express.Router();


router.get('/store/items', async (req, res) => {
   const { type } = req.query;
    const storeItems = await prisma.storeItem.findMany({
    include: {
      levels: {
        orderBy: { level: 'asc' }
      },
      _count: {
        select: {
          UserPurchase: true
        }
      }
    },
    orderBy: {
      id: 'asc'
    }
  });

  const items = storeItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    type: item.type,
    price: item.price,
    currencyType: item.currencyType,
    baseLevel: item.baseLevel,
    maxLevel: item.maxLevel,
    totalPurchases: item._count.UserPurchase,
    levels: item.levels.map(level => ({
      id: level.id,
      level: level.level,
      upgradeCost: level.upgradeCost,
      stats: level.stats
    })),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));
  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, {items });
});

router.post('/store', validators('ADD_STORE_ITEM'), async (req, res) => {
    const { name, description, price, type, isActive, isDefault } = req.body;
    const item = await prisma.storeItem.create({
      data: {
        name,
        description,
        price,
        type, 
        isActive: isActive ?? false,
        isDefault: isDefault ?? false,
      },
    });

  return makeResponse(res, SUCCESS, true, responseMessages.RECORD_CREATED, item );
});


router.put('/store/items/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      description,
      type,
      price,
      currencyType,
      baseLevel,
      maxLevel,
      levels
    } = req.body;

    // Check if item exists
    const existingItem = await prisma.storeItem.findUnique({
      where: { id: id }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: 'Item not found'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update basic item info
      const updatedItem = await tx.storeItem.update({
        where: { id: id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(type !== undefined && { type }),
          ...(price !== undefined && { price }),
          ...(currencyType !== undefined && { currencyType }),
          ...(baseLevel !== undefined && { baseLevel }),
          ...(maxLevel !== undefined && { maxLevel })
        }
      });

      // Update levels if provided
      if (levels && Array.isArray(levels)) {
        // Delete existing levels
        await tx.itemLevel.deleteMany({
          where: { itemId: id }
        });

        // Create new levels
        const levelPromises = levels.map(levelData =>
          tx.itemLevel.create({
            data: {
              itemId: id,
              level: levelData.level,
              upgradeCost: levelData.upgradeCost,
              stats: levelData.stats || {}
            }
          })
        );

        await Promise.all(levelPromises);
      }

      // Return updated item with levels
      return await tx.storeItem.findUnique({
        where: { id: id },
        include: {
          levels: {
            orderBy: { level: 'asc' }
          }
        }
      });
    });

    // Send success response
    return res.json({
      success: true,
      code: 200,
      message: 'Item updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update item error:', error);
    return res.status(400).json({
      success: false,
      code: 400,
      message: error.message || 'Failed to update item'
    });
  }
});

router.delete('/store/items/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    
    // Check if item exists
    const existingItem = await prisma.storeItem.findUnique({
      where: { id: itemId },
      include: {
        _count: {
          select: {
            UserPurchase: true
          }
        }
      }
    });

    if (!existingItem) {
      throw new Error('Item not found');
    }

    // Check if item has purchases (optional safety check)
    if (existingItem._count.UserPurchase > 0) {
      throw new Error('Cannot delete item that has user purchases');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete levels first (due to foreign key constraint)
      await tx.itemLevel.deleteMany({
        where: { itemId }
      });

      // Delete the item
      await tx.storeItem.delete({
        where: { id: itemId }
      });

      return {
        id: existingItem.id,
        name: existingItem.name,
        type: existingItem.type
      };
    });

    // Use your makeResponse helper
    return makeResponse(res, 200, true, 'Item deleted successfully', result);

  } catch (error) {
    console.error('Delete item error:', error);
    return makeResponse(res, 400, false, error.message);
  }
});



export default router;
