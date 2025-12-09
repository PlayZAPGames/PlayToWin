// import dotenv from 'dotenv';

// dotenv.config();

// const requiredEnv = (key) => {
//   if (!process.env[key]) {
//     throw new Error(`Missing required environment variable: ${key}`);
//   }
//   return process.env[key];
// };

// export const config = {
//   env: process.env.NODE_ENV || 'development',

//   server: {
//     port: process.env.PORT || 3000,
//     baseUrl: process.env.BASE_URL,
//     webhookUrl: process.env.WEBHOOK_URL,
//     tokenBaseUrl: process.env.TOKEN_BASE_URL,
//   },

//   bot: {
//     apiKey: requiredEnv('BOT_API_KEY'),
//     telegramBotLink: process.env.TELEGRAM_BOT_LINK,
//   },

//   jwt: {
//     secretKey: requiredEnv('JWT_SECRET_KEY'),
//     localKey: process.env.JWT_KEY_LOCAL,
//     stageKey: process.env.JWT_KEY_STAGE,
//     prodKey: process.env.JWT_KEY_PROD,
//     secret: process.env.JWT_SECRET,
//   },

//   encryption: {
//     encryptionKey: process.env.EncryptionKey,
//     base62Key: process.env.Base62Key,
//   },

//   api: {
//     apiKey: process.env.API_KEY,
//     callKey: process.env.API_CALL_KEY,
//   },

//   database: {
//     url: process.env.DATABASE_URL,
//     name: process.env.DATABASE,
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     password: process.env.DB_PASSWORD,
//   },

//   adminAuth: {
//     decryptedKey: process.env.ADMIN_Decrypted_Auth_KEY,
//     encryptedKey: process.env.Admin_Encrypted_Auth_Key,
//   },

//   playzap: {
//     gameUrl: requiredEnv('GAME_URL'),
//     miniAppShortname: process.env.MINI_APP_SHORTNAME,
//     loginToken: process.env.LOGIN_TOKEN,
//     thumbnailImgUrl: process.env.THUMBNAIL_IMG_URL,
//     manifestUrl: process.env.MANIFEST_URL,
//     walletsCacheTTL: parseInt(process.env.WALLETS_LIST_CAHCE_TTL_MS || '300000', 10),
//     deleteSendTxTimeout: parseInt(process.env.DELETE_SEND_TX_MESSAGE_TIMEOUT_MS || '10000', 10),
//     connectorTTL: parseInt(process.env.CONNECTOR_TTL_MS || '10000', 10),
//   },

//   blockchain: {
//     authorization: process.env.Authorization,
//     blockpuriKey: process.env.Blockpuri_Key,
//     blockpuriPapi: process.env.Blockpuri_Papi,
//     getBalanceKey: process.env.GetBalance_Key,
//     deductBalanceKey: process.env.DeductBalance_Key,
//     blockPapi: process.env.Block_papi,
//     blockpuriBaseUrl: process.env.Blockpuri_BaseUrl,
//     bridgeAddress: process.env.Bridge_Address,
//     coreContractAddress: process.env.CoreContract_Address,
//     mnemonicDev: process.env.mnemonic_DEV,
//   },

//   thirdParty: {
//     pysonUrl: process.env.PYSON_URL,
//   },
// };
