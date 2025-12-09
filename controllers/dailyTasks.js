// import prisma from "../prisma/db.js";
// import { EpochTime } from "../libs/utils.js";
// import * as bank from "../utility/walletService.js";
// import { makeResponse, statusCodes, responseMessages } from '../helpers/index.js';
// const { SUCCESS, BAD_REQUEST, SERVER_ERROR } = statusCodes;

// async function setDailyUserTasks(userid) {
//   let taskValues = await getEarnLudy();

//   if (!taskValues || taskValues.length == 0) return "No task values found";

//   let values = [];

//   for (let i = 0; i < taskValues.length; i++) {
//     taskValues[i].isClaimed = false;
//     taskValues[i].canClaim = true;
//     taskValues[i].isLocked = false;
//     taskValues[i].isRewarded = false;
//     taskValues[i].claimedTimeStamp = 0;
//     values.push(taskValues[i]);
//   }

//   let user = await prisma.users.findUnique({
//     where: {
//       id: userid,
//     },
//   });
//   if (!user) return "User not found";

//   console.log("user", user);
//   await prisma.dailyUserTasks.upsert({
//     where: {
//       user_id: userid, // Use user_id as the unique identifier
//     },
//     update: {
//       tasks: values, // Update tasks if the record exists
//     },
//     create: {
//       user_id: userid,
//       user_name: user.username,
//       tasks: values, // Create a new record if user_id doesn't exist
//     },
//   });
// }

// async function addEarnLudy(task_name, task_desc = "", reward, reward_range, currency_type, status = "InActive", task_pfp, task_redirect, due_date = null) {
//   await prisma.dailyTasksValues.create({
//     data: {
//       task_name: task_name,
//       task_desc: task_desc,
//       reward: reward,
//       reward_range: reward_range,
//       currency_type: currency_type,
//       status: status,
//       task_pfp: task_pfp,
//       task_redirect: task_redirect,
//       due_date: due_date,
//     },
//   });
// }

// async function updateEarnLudy(id, task_name, task_desc = "", reward, reward_range, currency_type, status, task_pfp, task_redirect, due_date = null) {
//   return await prisma.dailyTasksValues.update({
//     where: { id },
//     data: {
//       task_name,
//       task_desc,
//       reward,
//       reward_range,
//       currency_type,
//       status,
//       task_pfp,
//       task_redirect,
//       due_date,
//     },
//   });
// }

// async function deleteEarnLudy(id) {
//   await prisma.dailyTasksValues.delete({
//     where: {
//       id: id,
//     },
//   });
// }

// async function getEarnLudy() {
//   let tasks = await prisma.dailyTasksValues.findMany();
//   return tasks;
// }

// function getEpochDate(epoch = Date.now()) {
//   const date = new Date(epoch * 1000);
//   return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000);
// }


// async function claimDailyLoginBonus(userid) {
//   // Fetch dailyUserTasks
//   let dailyUserTasks = await prisma.dailyUserTasks.findUnique({ where: { user_id: userid } });
//   if (!dailyUserTasks) return { msg: "No daily tasks found" };

//   // Find login bonus task
//   let task = dailyUserTasks.tasks.find(t => t.id === 4);
//   if (!task) return { msg: "Login bonus task not found" };

//   // Fetch streak rewards from master table
//   const streakRewards = await prisma.master.findUnique({ where: { key: "login_bonus" } });
//   if (!streakRewards || !streakRewards.days) return { msg: "No streak rewards found" };

//   const today = getEpochDate();
//   const lastClaim = task.lastClaimDate || 0;
//   let streakDay = task.streakDay || 1;

//   // Already claimed today
//   if (today === lastClaim) {
//     return { msg: "Already claimed today" };
//   }

//   // Check missed days
//   if (lastClaim === 0) {
//     streakDay = 1; // First claim
//   } else if (today === lastClaim + 86400) {
//     streakDay += 1; // Consecutive day
//     if (streakDay > 7) streakDay = 1; // Reset after 7
//   } else if (today > lastClaim + 86400) {
//     // Missed days → give last missed day reward, reset to 1
//     streakDay = 1;
//   }

//   // Get reward for the current streak day
//   const rewardConfig = streakRewards.days[streakDay - 1];
//   if (!rewardConfig) return { msg: "Invalid streak day configuration" };

//   // Credit reward
//   await bank.updateCurrency(userid, rewardConfig.value, rewardConfig.currencyType, bank.operations.credit, bank.transactiontype.taskCompletion, null);

//   // Update task
//   task.lastClaimDate = today;
//   task.streakDay = streakDay;
//   task.isClaimed = true;
//   task.isRewarded = true;

//   await prisma.dailyUserTasks.update({
//     where: { user_id: userid },
//     data: { tasks: dailyUserTasks.tasks },
//   });

//   return { msg: `Claimed ${rewardConfig.value} ${rewardConfig.currencyType} for Day ${streakDay}` };
// }




// async function getDailyUserTasks(req, res) {

//   const userid = req.userId
//   let taskValue = await getEarnLudy();  

//   if (!taskValue || taskValue.length == 0){
//     // throw new Error({code: 200, msg: "No task values added by admin yet"});
//     const err = new Error("No task values added by admin yet");
//     err.statusCode = 400;
//     throw err;
//   }


//   // Fetch daily tasks
//   let dailyTasks = await prisma.dailyUserTasks.findMany({
//     where: {
//       user_id: userid,
//     },
//   });

//   // Get the current time in epoch format
//   const currentDate = EpochTime(0);
//   // console.log("dailyTasks", dailyTasks.length ? dailyTasks[0].tasks.length : 0, dailyTasks.length);
//   // If there are no daily tasks for the user, set them first
//   if (!dailyTasks || dailyTasks.length === 0) {
//     console.log("Creating Daily Tasks");
//     await setDailyUserTasks(userid);

//     // Fetch the tasks again after setting them
//     dailyTasks = await prisma.dailyUserTasks.findMany({
//       where: {
//         user_id: userid,
//       },
//     });

//     console.log("dailyTasks after creation", dailyTasks);

//   }

//   // check if any new tasks is added in global values
//   let taskValues = await getEarnLudy();

//   if (taskValues.length > dailyTasks[0].tasks.length) {
//     taskValues.forEach((task) => {
//       if (!dailyTasks[0].tasks.find((t) => t.id == task.id)) {
//         task.isClaimed = false;
//         task.canClaim = true;
//         task.isLocked = false;
//         task.isRewarded = false;
//         task.claimedTimeStamp = 0;
//         dailyTasks[0].tasks.push(task);
//       }
//     });

//     await prisma.dailyUserTasks.update({
//       where: {
//         user_id: userid,
//       },
//       data: {
//         tasks: dailyTasks[0].tasks,
//       },
//     });
//   }

//   // Ensure dailyTasks array exists and contains at least one task
//   if (dailyTasks && dailyTasks.length > 0) {
//     // Loop through tasks and check for expiration
//     for (let i = 0; i < dailyTasks[0].tasks.length; i++) {
//       let task = dailyTasks[0].tasks[i];

//       if (task.due_date) {
//         if (currentDate > task.due_date && !task.isClaimed) {
//           task.status = "Expired";
//         }
//       }
//     }
//   }

//   return makeResponse(res, SUCCESS, true, "Daily user tasks fetched successfully", dailyTasks[0]);
// }

// async function completeTask(userid, task_id) {
//   let dailyUserTasks = await prisma.dailyUserTasks.findUnique({
//     where: {
//       user_id: userid,
//     },
//   });
//   let data = JSON.stringify(dailyUserTasks);

//   data = JSON.parse(data);

//   if (!data) {
//     return "No tasks found - completeTask";
//   }

//   let task = data.tasks.find((tsk) => tsk.id == task_id);
//   if (!task) return "Task not found";

//   // if (data.tasks[index].isClaimed) {
//   //   return "Task already claimed";
//   // }

//   // if (!data.tasks[index].canClaim) {
//   //   return "Task cannot be claimed";
//   // }

//   if (task.isLocked && !task.isClaimed) {
//     return "Task is locked";
//   }

//   if (task.due_date) {
//     if (EpochTime(0) > task.due_date) {
//       return "Task is expired";
//     }
//   }

//   if (task.isRewarded) {
//     return { msg: "Task already rewarded" };
//   }

//   if (task.isClaimed === false) {
//     console.log("Claiming task");

//     data.tasks.forEach((tsk) => {
//       if (tsk.id == task_id) {
//         tsk.isClaimed = true;
//         tsk.canClaim = false;
//         tsk.isLocked = true;
//         tsk.claimedTimeStamp = EpochTime(0);
//       }
//     });

//     await prisma.dailyUserTasks.update({
//       where: { user_id: userid },
//       data: data,
//     });
//     return {msg: "Task claimed successfully"};
//   }

//   console.log("-----task_id");
//   console.log(task_id);

//   let res = await rewardTaskCompletion(userid, task_id);

//   return res;
// }

// async function rewardTaskCompletion(userid, task_id = null) {
//   let dailyUserTasks = await prisma.dailyUserTasks.findUnique({
//     where: { user_id: userid },
//   });

//   if (!dailyUserTasks || dailyUserTasks.length === 0) {
//     return { msg: "No tasks found - rewardTaskCompletion1" };
//   }
//   let data = dailyUserTasks;

//   let task;

//   if (task_id) {
//     // Filter down to the specific task
//     task = data.tasks.find((task) => task.id == task_id);
//   }

//   if (task === undefined || task.length === 0) {
//     return { msg: "No tasks found - rewardTaskCompletion2" };
//   }

//   let isRewarded = false;

//   if (task.isClaimed && task.isRewarded == false && Date.now() / 1000 - task.claimedTimeStamp > 36000) {
//     let user = await prisma.users.findUnique({
//       where: { id: userid },
//     });
//     // try {
//     //   // Notify user on Telegram
//     //   await bot.telegram.sendMessage(Number(user.tgid), `Congratulations! You have been rewarded with ${task.reward} Gems for completing a task successfully!`);
//     // } catch (error) {
//     //   console.log(`Failed to send Telegram message: ${error}`);
//     // }

//     // Update the user's virtual currency balance
//     await bank.updateCurrency(
//       userid,
//       task.reward,
//       bank.currencies.virtual1, //gems
//       bank.operations.credit,
//       bank.transactiontype.taskCompletion,
//       null
//     );

//     // Mark the task as rewarded
//     // task.isRewarded = true;
//     isRewarded = true;
//   }

//   if (isRewarded) {
//     data.tasks.forEach((tsk) => {
//       if (tsk.id == task.id) {
//         tsk.isRewarded = true;
//       }
//     });

//     await prisma.dailyUserTasks.update({
//       where: { user_id: userid },
//       data: data,
//     });
//     return data;
//   }

//   return {
//     msg: "Either task is already rewarded or it has not verified yet. Wait for admins to review your tasks",
//   };
// }

// export {
//   setDailyUserTasks,
//   addEarnLudy,
//   getEarnLudy,
//   deleteEarnLudy,
//   completeTask,
//   getDailyUserTasks,
//   rewardTaskCompletion,
//   updateEarnLudy
// };

import prisma from "../prisma/db.js";
import { EpochTime } from "../libs/utils.js";
import * as bank from "../utility/walletService.js";
import { makeResponse, statusCodes } from '../helpers/index.js';
const { SUCCESS, BAD_REQUEST } = statusCodes;

/** ----------------- Utility Functions ----------------- **/
// function getEpochDate(epoch = Date.now()) {
//   const date = new Date(epoch); 
//   return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000);
// }
function getEpochDate() {
  return Math.floor(Date.now() / 1000 / 86400);
}

function getCycleStart(createdAtDayNumber, todayDayNumber) {
  const start = createdAtDayNumber;
  const daysSince = todayDayNumber - start;
  const cycleIndex = Math.floor(daysSince / 7);
  return start + (cycleIndex * 7);
}




/** ----------------- Daily Tasks Setup ----------------- **/
async function setDailyUserTasks(userid) {
  let taskValues = await getEarnLudy();
  if (!taskValues || taskValues.length === 0) return "No task values found";

  let values = [];
  for (let task of taskValues) {
    task.isClaimed = false;
    task.canClaim = true;
    task.isLocked = false;
    task.isRewarded = false;
    task.claimedTimeStamp = 0;

     task.createdAt = new Date(); 

    // Extra fields for login bonus
    if (task.id === 4) {
      task.streakDay = 1;
      task.lastClaimDate = 0;
    }

    values.push(task);
  }

  let user = await prisma.users.findUnique({ where: { id: userid } });
  if (!user) return "User not found";

  await prisma.dailyUserTasks.upsert({
    where: { user_id: userid },
    update: { tasks: values },
    create: { user_id: userid, user_name: user.username, tasks: values },
  });
}

async function addEarnLudy(task_name, task_desc = "", reward, reward_range, currency_type, status = "InActive", task_pfp, task_redirect, due_date = null) {
  await prisma.dailyTasksValues.create({
    data: { task_name, task_desc, reward, reward_range, currency_type, status, task_pfp, task_redirect, due_date },
  });
}

async function updateEarnLudy(id, task_name, task_desc = "", reward, reward_range, currency_type, status, task_pfp, task_redirect, due_date = null) {
  return await prisma.dailyTasksValues.update({
    where: { id },
    data: { task_name, task_desc, reward, reward_range, currency_type, status, task_pfp, task_redirect, due_date },
  });
}

async function deleteEarnLudy(id) {
  await prisma.dailyTasksValues.delete({ where: { id } });
}

async function getEarnLudy() {
  return await prisma.dailyTasksValues.findMany({ orderBy: { id: 'asc' } });
}

/** ----------------- Daily Login Bonus ----------------- **/
// async function claimDailyLoginBonus(userid) {
//   const today = getEpochDate(); // Midnight timestamp for today

//   return await prisma.$transaction(async (tx) => {
//     // Fetch streak rewards
//     const streakRewards = await tx.master.findUnique({ where: { key: "DailyRewardValues" } });
//     if (!streakRewards || !streakRewards.data1) return { msg: "No streak rewards found" };

//     // Fetch user tasks
//     let dailyUserTasks = await tx.dailyUserTasks.findUnique({ where: { user_id: userid } });
//     if (!dailyUserTasks) return { msg: "No daily tasks found" };

//     let task = dailyUserTasks.tasks.find(t => t.id === 4); // Login Bonus task
//     if (!task) return { msg: "Login bonus task not found" };

//     const lastClaim = task.lastClaimDate || 0;
//     let streakDay = task.streakDay || 1;

//     // Prevent multiple claims in the same calendar day
//     if (today === lastClaim) {
//       return { msg: "Already claimed today" };
//     }

//     // Calculate streak
//    if (lastClaim === 0) {
//       streakDay = 1; // First claim
//     } else if (today === lastClaim) {
//       return { msg: "Already claimed today" };
//     } else {
//       // Always move to next streak day regardless of gap
//       streakDay = (task.streakDay || 1) + 1;
//       if (streakDay > 7) streakDay = 1;
//     }

//     const rewardConfig = streakRewards.data1.days[streakDay - 1];
//     if (!rewardConfig) return { msg: "Invalid streak day configuration" };

//     // Update task
//     task.lastClaimDate = today;
//     task.streakDay = streakDay;
//     task.isClaimed = true;
//     task.isRewarded = true;

//     await tx.dailyUserTasks.update({
//       where: { user_id: userid },
//       data: { tasks: dailyUserTasks.tasks }
//     });

//     // Credit reward
//     await bank.updateCurrency(userid, rewardConfig.value, rewardConfig.currencyType, bank.operations.credit, bank.transactiontype.taskCompletion, null);

//     return { msg: `Claimed ${rewardConfig.value} ${rewardConfig.currencyType} for Day ${streakDay}` };
//   });
// }

// async function claimDailyLoginBonus(userid) {
//   const todayEpochDay = getEpochDate(); // current day count

//   return await prisma.$transaction(async (tx) => {
//     const streakRewards = await tx.master.findUnique({ where: { key: "DailyRewardValues" } });
//     if (!streakRewards || !streakRewards.data1) return { msg: "No streak rewards found" };

//     let dailyUserTasks = await tx.dailyUserTasks.findUnique({ where: { user_id: userid } });
//     if (!dailyUserTasks) return { msg: "No daily tasks found" };

//     const tasks = dailyUserTasks.tasks || [];
//     const taskIndex = tasks.findIndex(t => t.id === 4); // Login Bonus

//     if (taskIndex === -1) return { msg: "Login bonus task not found" };

//     const task = tasks[taskIndex];

//     // Safe date conversion
//     const createdAt = new Date(task.createdAt);
//     if (isNaN(createdAt.getTime())) {
//       return { msg: "Invalid createdAt date" };
//     }

//     const createdAtEpochDay = Math.floor(createdAt.getTime() / 1000 / 86400);
//     const lastClaimEpochDay = task.lastClaimDate || 0;
//     let streakDay = task.streakDay || 0;

//     console.log("todayEpochDay:", todayEpochDay);
//     console.log("createdAtEpochDay:", createdAtEpochDay);
//     console.log("lastClaimEpochDay:", lastClaimEpochDay);

//     // ❗ Block same-day claim
//     if (todayEpochDay === createdAtEpochDay) {
//       return { msg: "You can claim from the next day after activation." };
//     }

//     // Prevent claiming twice on the same day
//     if (lastClaimEpochDay === todayEpochDay) {
//       return { msg: "Already claimed today" };
//     }

//     const currentCycleStart = getCycleStart(createdAtEpochDay, todayEpochDay);
//     const lastClaimCycleStart = getCycleStart(createdAtEpochDay, lastClaimEpochDay);

//     // Determine streak day
//     if (lastClaimEpochDay === 0 || currentCycleStart > lastClaimCycleStart) {
//       streakDay = 1; // new cycle or first time
//     } else {
//       streakDay += 1;
//       if (streakDay > 7) streakDay = 1;
//     }

//     const rewardConfig = streakRewards.data1.days[streakDay - 1];
//     if (!rewardConfig) return { msg: "Invalid streak reward configuration." };

//     // ✅ Update the task object safely
//     tasks[taskIndex] = {
//       ...task,
//       lastClaimDate: todayEpochDay,
//       streakDay: streakDay,
//       isClaimed: true,
//       isRewarded: true,
//     };

//     // Update database
//     await tx.dailyUserTasks.update({
//       where: { user_id: userid },
//       data: { tasks }
//     });

//     await bank.updateCurrency(
//       userid,
//       rewardConfig.value,
//       rewardConfig.currencyType,
//       bank.operations.credit,
//       bank.transactiontype.taskCompletion,
//       null
//     );

//     return { msg: `Claimed ${rewardConfig.value} ${rewardConfig.currencyType} for Day ${streakDay}` };
//   });
// }




/** ----------------- Fetch User Daily Tasks ----------------- **/
async function getDailyUserTasks(req, res) {
  const userid = req.userId;
  let adminTasks = await getEarnLudy(); // Admin-defined tasks

  if (!adminTasks || adminTasks.length === 0) {
    const err = new Error("No task values added by admin yet");
    err.statusCode = 400;
    throw err;
  }

  let dailyTasks = await prisma.dailyUserTasks.findMany({
    where: { user_id: userid }
  });
  const currentDate = EpochTime(0);

  // If no daily tasks exist for the user, create them
  if (!dailyTasks || dailyTasks.length === 0) {
    await setDailyUserTasks(userid);
    dailyTasks = await prisma.dailyUserTasks.findMany({
      where: { user_id: userid }
    });
  }

  let userTaskList = dailyTasks[0].tasks;

  // 1️⃣ Add missing tasks from admin list (newly created tasks)
  adminTasks.forEach(adminTask => {
    if (!userTaskList.find(t => t.id == adminTask.id)) {
      const newTask = {
        ...adminTask,
        isClaimed: false,
        canClaim: true,
        isLocked: false,
        isRewarded: false,
        claimedTimeStamp: Number(0),
        createdAt: new Date()
      };
      if (adminTask.id === 4) { // login bonus streak
        newTask.streakDay = 1;
        newTask.lastClaimDate = 0;
      }
      userTaskList.push(newTask);
    }
  });

  // 2️⃣ Sync admin-updated static fields without resetting claim data
  userTaskList = userTaskList.map(userTask => {
    const adminTask = adminTasks.find(a => a.id == userTask.id);
    if (adminTask) {
      return {
        ...userTask, // keep claim state & dynamic user data
        task_name: adminTask.task_name,
        task_desc: adminTask.task_desc,
        reward: adminTask.reward,
        reward_range: adminTask.reward_range,
        currency_type: adminTask.currency_type,
        task_pfp: adminTask.task_pfp,
        task_redirect: adminTask.task_redirect,
        updatedAt: adminTask.updatedAt // keep admin's updated time
      };
    }
    return userTask;
  });

  // 3️⃣ Mark expired tasks
  for (let task of userTaskList) {
    if (task.due_date && currentDate > task.due_date && !task.isClaimed) {
      task.status = "Expired";
    }
  }

  // Save updates back
  await prisma.dailyUserTasks.update({
    where: { user_id: userid },
    data: { tasks: userTaskList }
  });

  return makeResponse(res, SUCCESS, true, "Daily user tasks fetched successfully", {
    ...dailyTasks[0],
    tasks: userTaskList
  });
}

/** ----------------- Complete Tasks ----------------- **/
async function completeTask(userid, task_id) {
  if (task_id === 4) {
    return "Follow the login streak process instead of completing a task";
    // return await claimDailyLoginBonus(userid);
  }

  let dailyUserTasks = await prisma.dailyUserTasks.findUnique({ where: { user_id: userid } });
  if (!dailyUserTasks) return "No tasks found - completeTask";

  let data = JSON.parse(JSON.stringify(dailyUserTasks));
  let task = data.tasks.find(tsk => tsk.id == task_id);
  if (!task) return "Task not found";

  if (task.isLocked && !task.isClaimed) return "Task is locked";
  if (task.due_date && EpochTime(0) > task.due_date) return "Task is expired";
  if (task.isRewarded) return { msg: "Task already rewarded" };

  if (!task.isClaimed) {
    data.tasks.forEach(tsk => {
      if (tsk.id == task_id) {
        tsk.isClaimed = true;
        tsk.canClaim = false;
        tsk.isLocked = true;
        tsk.claimedTimeStamp = EpochTime(0);
      }
    });

    await prisma.dailyUserTasks.update({ where: { user_id: userid }, data: data });
    return { msg: "Task claimed successfully" };
  }

  return await rewardTaskCompletion(userid, task_id);
}

/** ----------------- Reward After Verification ----------------- **/
async function rewardTaskCompletion(userid, task_id = null) {
  let dailyUserTasks = await prisma.dailyUserTasks.findUnique({ where: { user_id: userid } });
  if (!dailyUserTasks) return { msg: "No tasks found - rewardTaskCompletion1" };

  let task = task_id ? dailyUserTasks.tasks.find(t => t.id == task_id) : null;
  if (!task) return { msg: "No tasks found - rewardTaskCompletion2" };

  let isRewarded = false;
  if (task.isClaimed && !task.isRewarded && Date.now() / 1000 - task.claimedTimeStamp > 36000) {
    await bank.updateCurrency(userid, task.reward, bank.currencies.virtual1, bank.operations.credit, bank.transactiontype.taskCompletion, null);
    isRewarded = true;
  }

  if (isRewarded) {
    dailyUserTasks.tasks.forEach(tsk => {
      if (tsk.id == task.id) tsk.isRewarded = true;
    });
    await prisma.dailyUserTasks.update({ where: { user_id: userid }, data: dailyUserTasks });
    return dailyUserTasks;
  }

  return { msg: "Either task is already rewarded or it has not verified yet. Wait for admins to review your tasks" };
}

/** ----------------- Exports ----------------- **/
export {
  setDailyUserTasks,
  addEarnLudy,
  getEarnLudy,
  deleteEarnLudy,
  completeTask,
  getDailyUserTasks,
  rewardTaskCompletion,
  updateEarnLudy
};
