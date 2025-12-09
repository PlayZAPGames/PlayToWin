export const currencies = Object.freeze({
  all: null,
  PZP_EOS: 1,
  BUSD: 2,
  RLY: 3,
  BnB: 4,
  KCS: 5,
  Ticket: 6,
  PZP_BSC: 7,
  EOS: 8,
  USDT: 9,
  PZP_SOL: 10,
  PZP_CORE: 13,
  PZP_TEZOS: 14,
});

export const operations = Object.freeze({
  add: 0,
  deduct: 1,
});

// pending initiated success fail
export const status = Object.freeze({
  all: null,
  pending: 0,
  initiated: 1,
  success: 2,
  failed: 3,
  refund: 4,
  cancelled: 5,
});
export const txnstatus = Object.freeze({
  all: null,
  PENDING: 0,
  PROCESSING: 1,
  TRANSFERRED: 2,
  FAILED: 3,
});

export const transactionType = Object.freeze({
  admin: 0,
  user: 1,
  withdraw: 2,
  swap: 3,
  referral: 4,
  referred: 5,
  loginBonus: 6,
  entry: 7,
  reward: 8,
});

export const ProcessType = Object.freeze({
  DIRECT: 0,
  FREEBIE: 1,
  INITIAL_TRANSFER: 2,
  WITHDRAWAL: 3,
  DEPOSIT: 4,
  SWAP: 5,
  BSC_DEPOSIT: 6,
  BSC_WITHDRAWAL: 7,
  BSC_DIRECT: 8,
});

export const SwapMode = Object.freeze({
  all: null,
  v2tov1: 0,
  v2totokens: 1,
  bsctoeos: 2,
  eostobsc: 3,
  soltobsc: 4,
  bsctosol: 5,
  eostosol: 6,
  coretobsc: 7,
  bsctocore: 8,
  eostocore: 9,
  coretoeos: 10,
  soltocore: 11,
  coretosol: 12,
  tezostobsc: 13,
  bsctotezos: 14,
  eostotezos: 15,
  tezostoeos: 16,
  tezostosol: 17,
  soltotezos: 18,
  tezostocore: 19,
  coretotezos: 20,
});
