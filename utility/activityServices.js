import prisma from "../prisma/db.js";


export async function logActivity(userId, activityType, detail = {}, walletHistoryId = null, refId = null) {
  try {
    return await prisma.activities.create({
      data: {
        userId: userId,
        activity_type: activityType,
        detail,
        wallet_history_id: walletHistoryId,
        refId: refId
      }
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
}