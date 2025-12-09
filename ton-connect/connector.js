import { TonConnect } from '@tonconnect/sdk';
import TonConnectStorage from './storage.js';
import userData from '../utility/userData.js';
import dotenv from 'dotenv';
dotenv.config();


/**
 * @typedef {Object} StoredConnectorData
 * @property {TonConnect} connector - The TonConnect instance.
 * @property {ReturnType<typeof setTimeout>} timeout - The timeout returned by setTimeout.
 * @property {((connector: TonConnect) => void)[]} onConnectorExpired - Array of functions to be called when the connector expires.
 */

// Usage example:
// Define the StoredConnectorData object
// const storedConnectorData = {
//   connector: TonConnect,
//   timeout: ReturnType<typeof setTimeout>,
//   onConnectorExpired: ((connector) => void)]
// };

const connectors = new Map();

export default async function getConnector(ctx, onConnectorExpired) {
  let storedItem;
  let chatId = ctx.message.chat.id;
  if (connectors.has(chatId)) {
    storedItem = connectors.get(chatId);
    clearTimeout(storedItem.timeout);
  } else {
    let token = await userData.UserAuth(ctx);
    storedItem = {
      connector: new TonConnect({
        manifestUrl: process.env.MANIFEST_URL,
        storage: new TonConnectStorage(ctx, token)
      }),
      onConnectorExpired: []
    };
  }

  if (onConnectorExpired) {
    storedItem.onConnectorExpired.push(onConnectorExpired);
  }

  storedItem.timeout = setTimeout(() => {
    if (connectors.has(chatId)) {
      const storedItem = connectors.get(chatId);
      storedItem.connector.pauseConnection();
      storedItem.onConnectorExpired.forEach(callback => callback(storedItem.connector));
      connectors.delete(chatId);
    }
  }, Number(process.env.CONNECTOR_TTL_MS));

  connectors.set(chatId, storedItem);
  return storedItem.connector;
}