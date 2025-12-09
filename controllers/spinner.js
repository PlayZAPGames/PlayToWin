import prisma from "../prisma/db.js";
import { updateCurrency, transactiontype } from "../utility/walletService.js";
import { makeResponse, statusCodes, responseMessages } from "../helpers/index.js";
const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;

// Cache spin configuration
let spinWheels = [];
let weightedWheelOptions = [];
let spinIntervalHours = 12; // Set to 0 for unlimited spins during testing

/**
 * Initialize spin wheel configuration
 */
async function initializeSpinWheel() {
  try {
    // Load spin interval from DB
    const intervalConfig = await prisma.master.findUnique({
      where: { key: "spinInterval" }
    });
    spinIntervalHours = intervalConfig?.data1 || 12; // Default to 0 for testing

    // Load active spin wheels
    spinWheels = await prisma.spin_wheels.findMany({
      where: { is_disabled: false },
      orderBy: { id: 'asc' }
    });

    // Create weighted probability array
    weightedWheelOptions = [];
    spinWheels.forEach(wheel => {
      const probability = wheel.perc || 0;
      for (let i = 0; i < probability * 100; i++) {
        weightedWheelOptions.push(wheel.id);
      }
    });

    // console.log(`Spin wheel initialized ${weightedWheelOptions} options`);
    console.log(`Spin wheel initialized with ${spinWheels.length} options`);
  } catch (error) {
    console.error('Spin wheel initialization failed:', error);
    throw error;
  }
}


async function refreshSpinWheelConfig() {
  try {
    
    const intervalConfig = await prisma.master.findUnique({
      where: { key: "spinInterval" }
    });
    spinIntervalHours = intervalConfig?.data1 || 12;

    const freshWheels = await prisma.spin_wheels.findMany({
      where: { is_disabled: false },
      orderBy: { id: 'asc' }
    });

    // Regenerate probability array
    const newWeightedOptions = [];
    freshWheels.forEach(wheel => {
      const probability = wheel.perc || 0;
      for (let i = 0; i < probability * 100; i++) {
        newWeightedOptions.push(wheel.id);
      }
    });

    // Atomic update to avoid race conditions
    spinWheels = freshWheels;
    weightedWheelOptions = newWeightedOptions;

    console.log('Spin wheel config reloaded');
  } catch (error) {
    console.error('Failed to refresh spin wheel:', error);
  }
} 


/**
 * Get random prize based on weighted probabilities
 */
function getRandomPrize() {
  if (weightedWheelOptions.length === 0) {
    throw new Error('Spin wheel not initialized');
  }

  const randomIndex = Math.floor(Math.random() * weightedWheelOptions.length);
  const wheelId = weightedWheelOptions[randomIndex];
  return spinWheels.find(wheel => wheel.id === wheelId);
}

/**
 * API 1: Get spin wheel configuration and user status
 */
async function getSpinWheelInfo(user_id, res) {
  try {
    // Initialize if needed
    if (spinWheels.length === 0) {
      await initializeSpinWheel();
    }

    // Get user's last spin
    const lastSpin = await prisma.user_spin_wheels.findFirst({
      where: { user_id },
      orderBy: { created_at: 'desc' }
    });

    // Calculate next available spin time
    let nextSpinTime = null;
    if (lastSpin && spinIntervalHours > 0) { // Only check interval if it's > 0
      const lastSpinTime = new Date(lastSpin.created_at);
      nextSpinTime = new Date(lastSpinTime.getTime() + (spinIntervalHours * 60 * 60 * 1000));
    }

    return makeResponse(res, SUCCESS, true, responseMessages.RECORD_FOUND, {
      wheels: spinWheels.map(wheel => ({
        id: wheel.id,
        name: wheel.name,
        rewards: {
          virtual1: wheel.virtual1,
          virtual2: wheel.virtual2
        }
      })),
      last_spin: lastSpin?.created_at || null,
      next_spin_time: nextSpinTime?.getTime() || null,
      can_spin_now: spinIntervalHours === 0 || !lastSpin || (new Date() >= (nextSpinTime || new Date()))
    });

  } catch (error) {
    console.error('Error in getSpinWheelInfo:', error);
    return makeResponse(res, SERVER_ERROR, false, responseMessages.SERVER_ERROR);
  }
}

/**
 * API 2: Process spin attempt
 */
async function processSpin(user_id, res) {
  try {
    // Initialize if needed
    if (spinWheels.length === 0) {
      await initializeSpinWheel();
    }

    // Skip time check if interval is 0 (unlimited spins)
    if (spinIntervalHours > 0) {
      const lastSpin = await prisma.user_spin_wheels.findFirst({
        where: { user_id },
        orderBy: { created_at: 'desc' }
      });

      if (lastSpin) {
        const now = new Date();
        const lastSpinTime = new Date(lastSpin.created_at);
        const nextSpinTime = new Date(lastSpinTime.getTime() + (spinIntervalHours * 60 * 60 * 1000));

        if (now < nextSpinTime) {
          const hoursRemaining = (nextSpinTime - now) / (1000 * 60 * 60);
          return makeResponse(
            res, 
            BAD_REQUEST, 
            false, 
            `Spin not available. Try again in ${Math.ceil(hoursRemaining)} hours.`,
            { next_spin_time: nextSpinTime.getTime() }
          );
        }
      }
    }

    // Process the spin
    const prize = getRandomPrize();
    const now = new Date();

    // First create the spin record
     await prisma.user_spin_wheels.create({
      data: {
        user_id,
        spin_wheel_id: prize.id,
        is_claimed: true,
        virtual1: prize.virtual1 || 0,
        virtual2: prize.virtual2 || 0,
        created_at: now,
        updated_at: now
      }
    });

    // Then update currencies separately (since updateCurrency isn't a Prisma promise)
    if (prize.virtual1) {
      await updateCurrency(
        user_id, 
        prize.virtual1, 
        'virtual1', 
        'credit', 
        transactiontype.spinWheel
      );
    }

    if (prize.virtual2) {
      await updateCurrency(
        user_id, 
        prize.virtual2, 
        'virtual2', 
        'credit', 
        transactiontype.spinWheel
      );
    }

    // Calculate next spin time (if interval is not 0)
    const nextSpinTime = spinIntervalHours > 0 
      ? new Date(now.getTime() + (spinIntervalHours * 60 * 60 * 1000))
      : null;

    return makeResponse(res, SUCCESS, true, 'Spin successful', {
      reward: {
        id: prize.id,
        name: prize.name,
        virtual1: prize.virtual1,
        virtual2: prize.virtual2
      },
      next_spin_time: nextSpinTime?.getTime() || null
    });

  } catch (error) {
    console.error('Error in processSpin:', error);
    return makeResponse(res, SERVER_ERROR, false, responseMessages.SERVER_ERROR);
  }
}




// Initialize on startup
initializeSpinWheel().catch(console.error);

export { getSpinWheelInfo , processSpin, refreshSpinWheelConfig };