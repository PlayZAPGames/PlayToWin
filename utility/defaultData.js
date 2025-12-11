import prisma from "../prisma/db.js"

export async function insertDefaults() {
  const masterDefaults = [
    {
      key: "referralShareText",
      data1: { text: "Let’s earn more together in upcoming Airdrop! 🎁 Get 50 Gems as welcome gift 💰 Join NOW to maximize your rewards" },
    },
    {
      key: "referral",
      data1: {
        gems: { referreeReward: 30, referrerReward: 100 }, referrerDailyRewardLimit: 2000
      }
    },
    {
      key: "joinReward",
      data1: {
        gems: 20,
        cash: 0.02
      }
    },
    {
      key: "gemToPzp",
      data2: "5"
    },
    {
      key: "admins",
      data1: {
        ids: []
      }
    },
    {
      key: "maintenance",
      data1: {
        data: {
          status: false
        }
      }
    },
    {
      key: "walletWithdraw",
      data1: {
        day_limit: 500,
        min_withdraw: 300,
        processing_fee: 5,
        withdraw_maintenance: false
      }
    },
    // {
    //   key: "swap",
    //   data1: {
    //     core_to_bsc_day_limit: 300,
    //     bsc_to_core_day_limit: 1000,
    //     min_swap: 1,
    //     core_to_bsc_processing_fee: 2,
    //     bsc_to_core_processing_fee: 0,
    //     swap_maintenance: false
    //   }
    // },
    // {
    //   key: "ticketSwapLimit",
    //   data2: "500"
    // },
    // {
    //   key: "ticketMinSwap",
    //   data2: "300"
    // },
    {
      key: "DailyRewardValues",
      data1: {
        days: [
          { value: 25, currencyType: "gems" },
          { value: 50, currencyType: "gems" },
          { value: 75, currencyType: "gems" },
          { value: 100, currencyType: "gems" },
          { value: 150, currencyType: "gems" },
          { value: 200, currencyType: "gems" },
          { value: 300, currencyType: "gems" },
        ],
      }
    },
    {
      key: "spinInterval",
      data1: 12
    },
    {
      key: "weeklyPrizePool",
      data1: {
        rewards: [
          { "from": 1, "to": 1, "reward": 10 },
          { "from": 2, "to": 2, "reward": 9 },
          { "from": 3, "to": 3, "reward": 8 },
          { "from": 4, "to": 6, "reward": 7 },
          { "from": 7, "to": 10, "reward": 6 },
          { "from": 11, "to": 13, "reward": 5 },
          { "from": 14, "to": 20, "reward": 4 },
          { "from": 21, "to": 30, "reward": 3 },
          { "from": 31, "to": 40, "reward": 2 },
          { "from": 41, "to": 50, "reward": 1.5 },
          { "from": 51, "to": 60, "reward": 1 }
        ]
      }
    },
  ];

  // ✅ Insert Daily Tasks
  const dailyTasks = [
    {
      task_name: "Play & Win",
      task_desc: "Play games and earn $COIN for each win. Higher stakes games offer bigger rewards!",
      reward: 0,
      reward_range: "10-50 $COIN",
      currency_type: "gems",
      status: "Active",
      task_pfp: "https://cdn-icons-png.flaticon.com/512/919/919278.png", // Replace with actual icon if available
      task_redirect: "/games"
    },
    {
      task_name: "Invite Friends",
      task_desc: "Earn $COIN for each friend who joins using your referral code and plays their first game.",
      reward: 100,
      reward_range: null,
      currency_type: "gems",
      status: "Active",
      task_pfp: "https://cdn-icons-png.flaticon.com/512/595/595067.png", // Replace with actual icon
      task_redirect: "/invite"
    },
    {
      task_name: "Spin the Wheel",
      task_desc: "Spin the wheel once daily for a chance to win $COIN tokens and other rewards!",
      reward: 0,
      reward_range: "5-500 $COIN",
      currency_type: "gems",
      status: "Active",
      task_pfp: "https://cdn-icons-png.flaticon.com/512/1038/1038205.png", // Replace with actual icon
      task_redirect: "/spin"
    },
    {
      task_name: "Login Bonus",
      task_desc: "Log in daily to earn $COIN. Consecutive logins increase your rewards!",
      reward: 0,
      reward_range: "1-7 Days Streak",
      currency_type: "gems",
      status: "Active",
      task_pfp: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png", // Replace with actual icon
      task_redirect: "/login-bonus"
    },
    {
      task_name: "Follow on X",
      task_desc: "Follow our official X account to earn a one-time reward of 100 $COIN tokens.",
      reward: 100,
      reward_range: null,
      currency_type: "gems",
      status: "Active",
      task_pfp: "https://cdn.discordapp.com/attachments/1259807072975978560/1290548488895205376/twitter-x-icon.png",
      task_redirect: "https://x.com/PlayZap"
    },
    {
      task_name: "Join Telegram",
      task_desc: "Join our Telegram community to earn a one-time reward of 100 $COIN tokens.",
      reward: 100,
      reward_range: null,
      currency_type: "gems",
      status: "Active",
      task_pfp: "https://cdn.discordapp.com/attachments/1259807072975978560/1290548437544337450/telegram-icon.png",
      task_redirect: "https://t.me/PlayZapOfficial"
    }
  ];

  const gameDefaults = [
    {
      gameName: "Blocks",
      imageIndex: 0,
    },
    {
      gameName: "Match 3",
      imageIndex: 1,
    },
    {
      gameName: "Solitare",
      imageIndex: 2,
    }
  ];

 const tournamentBlockDefaults = [
  {
    gameName: "Blocks",
    tournaments: [
      {
        name: "Freeroll",
        prizePool: 0.09,
        players: 10,
        entryFee: 0,
        currencyType: "ads",
        adsEnabled: true,
        status: "active"
      },
      {
        name: "Cash Practice",
        prizePool: 0.11,
        players: 5,
        entryFee: 0.03,
        currencyType: "cash",
        status: "active"
      },
      {
        name: "Warm Up",
        prizePool: 0.20,
        players: 10,
        entryFee: 200,
        currencyType: "gems",
        status: "active"
      },
      {
        name: "Starter Brawl",
        prizePool: 0.14,
        players: 2,
        entryFee: 0.10,
        currencyType: "cash",
        status: "active"
      },
      {
        name: "Ascension",
        prizePool: 3.50,
        players: 5,
        entryFee: 1,
        currencyType: "cash",
        status: "active"
      }
    ]
  },

  {
    gameName: "Match 3",
    tournaments: [
      {
        name: "Freeroll",
        prizePool: 0.05,
        players: 10,
        entryFee: 0,
        currencyType: "ads",
        adsEnabled: true,
        status: "active"
      },
      {
        name: "Warm Up",
        prizePool: 0.18,
        players: 10,
        entryFee: 150,
        currencyType: "gems",
        status: "active"
      },
      {
        name: "Cash Practice",
        prizePool: 0.12,
        players: 5,
        entryFee: 0.04,
        currencyType: "cash",
        status: "active"
      },
      {
        name: "Power Duel",
        prizePool: 0.25,
        players: 5,
        entryFee: 0.20,
        currencyType: "cash",
        status: "active"
      }
    ]
  },

  {
    gameName: "Solitare",
    tournaments: [
      {
        name: "Freeroll",
        prizePool: 0.07,
        players: 10,
        entryFee: 0,
        currencyType: "ads",
        adsEnabled: true,
        status: "active"
      },
      {
        name: "Pro Warm Up",
        prizePool: 0.22,
        players: 10,
        entryFee: 200,
        currencyType: "gems",
        status: "active"
      },
      {
        name: "Cash Duel",
        prizePool: 0.30,
        players: 2,
        entryFee: 0.20,
        currencyType: "cash",
        status: "active"
      },
      {
        name: "High Stakes",
        prizePool: 5.00,
        players: 5,
        entryFee: 2,
        currencyType: "cash",
        status: "active"
      }
    ]
  }
];



  // ✅ Insert Spin Wheel Defaults
  const spinWheelDefaults = [
    {
      name: "1",
      is_disabled: false,
      perc: 50,
      gems: 50,
      cash: 0
    },
    {
      name: "2",
      is_disabled: false,
      perc: 30,
      gems: 100,
      cash: 0
    },
    {
      name: "3",
      is_disabled: false,
      perc: 8,
      gems: 200,
      cash: 0
    },
    {
      name: "4",
      is_disabled: false,
      perc: 6,
      gems: 500,
      cash: 0
    },
    {
      name: "5",
      is_disabled: false,
      perc: 3.50,
      gems: 750,
      cash: 0
    },
    {
      name: "6",
      is_disabled: false,
      perc: 1.75,
      gems: 1000,
      cash: 0
    },
    {
      name: "7",
      is_disabled: false,
      perc: 0.50,
      gems: 1500,
      cash: 0
    },
    {
      name: "8",
      is_disabled: false,
      perc: 0.25,
      gems: 2000,
      cash: 0
    }
  ];


  



  for (const item of masterDefaults) {
    const existing = await prisma.master.findUnique({
      where: { key: item.key }
    });

    // Only insert if the record doesn't exist
    if (!existing) {
      await prisma.master.create({
        data: item
      });
    }
  }

  for (const task of dailyTasks) {
    const exists = await prisma.dailyTasksValues.findFirst({
      where: {
        task_name: task.task_name,
      }
    });

    if (!exists) {
      await prisma.dailyTasksValues.create({
        data: task
      });
    }
  }

  for (const wheel of spinWheelDefaults) {
    const exists = await prisma.spin_wheels.findFirst({
      where: {
        name: wheel.name
      }
    });

    if (!exists) {
      await prisma.spin_wheels.create({
        data: wheel
      });
    }
  }


  for (const game of gameDefaults) {
    const exists = await prisma.games.findFirst({
      where: {
        gameName: game.gameName,
      },
    });

    if (!exists) {
      await prisma.games.create({
        data: game,
      });
    }
  }

  for (const gameBlock of tournamentBlockDefaults) {
  const game = await prisma.games.findFirst({
    where: { gameName: gameBlock.gameName }
  });

  if (!game) {
    console.log(`Game not found: ${gameBlock.gameName}`);
    continue;
  }

  for (const t of gameBlock.tournaments) {
    const exists = await prisma.tournamentBlock.findFirst({
      where: {
        name: t.name,
        gameId: game.id
      }
    });

    if (!exists) {
      await prisma.tournamentBlock.create({
        data: {
          ...t,
          gameId: game.id
        }
      });

      console.log(`Tournament created → ${t.name} (${gameBlock.gameName})`);
    }
  }
}


  // for (const item of storeDefaults) {
  //   const exists = await prisma.storeItem.findFirst({
  //     where: { name: item.name, type: item.type },
  //   });

  //   if (!exists) {
  //     await prisma.storeItem.create({
  //       data: {
  //         ...item,
  //         // 👇 convert plain levels array to Prisma nested create syntax
  //         levels: { create: item.levels },
  //       },
  //     });
  //     console.log(`✅ Inserted: ${item.name}`);
  //   } else {
  //     console.log(`⚠️ Already exists: ${item.name}`);
  //   }
  // }
  console.log("✅ Default master records ensured.");
}
