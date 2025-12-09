import { bot } from '../bot-handlers/bot.js';
import { getWallets, getWalletInfo } from './wallet.js';
import _connector from './connector.js';
import QRCode from 'qrcode';
import { buildUniversalKeyboard } from './utils.js';
import {
    CHAIN,
    toUserFriendlyAddress,
} from '@tonconnect/sdk';
import { SetKeyboard } from '../bot-handlers/keyboardButtons.js';
// const { pTimeout, pTimeoutException } = require('./utils');

let newConnectRequestListenersMap = new Map;
let Chain = CHAIN.TESTNET;

const handleDisconnectCommand = async function (ctx) {
    const chatId = ctx.message.chat.id;

    const connector = await _connector.getConnector(ctx);

    await connector.restoreConnection();
    if (!connector.connected) {
        await bot.telegram.sendMessage(chatId, "You didn't connect a wallet");
        return [false];
    }

    await connector.disconnect();
    // await rubyApi.UpdateCred(ctx, "disconnected")
    await bot.telegram.sendMessage(chatId, 'Wallet has been disconnected');
    return [true]
}
export { handleDisconnectCommand };

const handleShowMyWalletCommand = async function (ctx) {

    const connector = await _connector.getConnector(ctx);

    await connector.restoreConnection();
    if (!connector.connected) {
        // await bot.telegram.sendMessage(chatId, "You didn't connect a wallet");
        return [false, ""];
    }

    (await getWalletInfo(connector.wallet.device.appName))?.name ||
        connector.wallet.device.appName;

     await getWallets()
        
    return [true, toUserFriendlyAddress(
        connector.wallet.account.address,
        connector.wallet.account.chain === Chain
    )];
    // await bot.telegram.sendMessage(
    //     chatId,
    //     `Connected wallet: ${walletName}\nYour address: ${toUserFriendlyAddress(
    //         connector.wallet.account.address,
    //         connector.wallet.account.chain === CHAIN.TESTNET
    //     )}`
    // );

}

export { handleShowMyWalletCommand };

const handleConnectCommand = async function (ctx) {
    const chatId = ctx.message.chat.id;
    newConnectRequestListenersMap.get(chatId)?.();
    const connector = await _connector.getConnector(ctx, () => {
        unsubscribe();
        newConnectRequestListenersMap.delete(chatId);
        deleteMessage();
    });

    await connector.restoreConnection();

    if (connector.connected) {
        // const connectedName =
        //     (await getWalletInfo(connector.wallet.device.appName))?.name ||
        //     connector.wallet.device.appName;
        return [true, toUserFriendlyAddress(
            connector.wallet.account.address,
            connector.wallet.account.chain === Chain
        )];
    }


    const unsubscribe = connector.onStatusChange(async wallet => {
        if (wallet) {
            await deleteMessage();

            (await getWalletInfo(wallet.device.appName))?.name || wallet.device.appName;
            // await bot.telegram.sendMessage(chatId, `${walletName} wallet connected successfully`);
            SetKeyboard("Wallet", ctx)
            unsubscribe();
            newConnectRequestListenersMap.delete(chatId);

            let walletAddress = toUserFriendlyAddress(
                connector.wallet.account.address,
                connector.wallet.account.chain === Chain
            );

            // await rubyApi.UpdateCred(ctx, walletAddress)
            return [true, walletAddress];
        }
    });

    const wallets = await getWallets();

    const link = connector.connect(wallets);
    const image = await QRCode.toBuffer(link);

    const keyboard = await buildUniversalKeyboard(link, wallets);

     await ctx.replyWithPhoto(
        { source: image }, // Assuming image is a path to photo file
        {
            reply_markup: {
                inline_keyboard: [keyboard]
            }
        }
    );

    const deleteMessage = async () => {
        // if (!messageWasDeleted) {
        //     messageWasDeleted = true;
        //     await bot.telegram.deleteMessage(chatId, botMessage.message_id);
        // }
    };

    newConnectRequestListenersMap.set(chatId, async () => {
        unsubscribe();

        await deleteMessage();

        newConnectRequestListenersMap.delete(chatId);
    });
}

export { handleConnectCommand };

// let botMessage;
// let messageWasDeleted = true;
// const handleSendTXCommand = async function (ctx, amount) {

//     messageWasDeleted = false;
//     const chatId = ctx.message.chat.id;

//     const connector = await _connector.getConnector(ctx);

//     await connector.restoreConnection();
//     if (!connector.connected) {
//         await bot.telegram.sendMessage(chatId, '🔓 Connect your wallet to make a purchase');
//         SetKeyboard("Wallet", ctx)
//         return [false, "MainMenu"];
//     }

//     // let timeout =  // timeout is SECONDS
//     connector.sendTransaction({
//         validUntil: Math.round(Date.now() / 1000) + 60, // timeout is SECONDS
//         messages: [
//             {
//                 amount: amount * 1e9,
//                 address: '0QAU_T0B0J1L0TKt4JBHRPrJeYepAROxOSY0RBlqIYMiF-Kh'
//             }
//         ]
//     })
//         .then(async (data) => {
//             console.log(data)
//             await deleteMessage(chatId);
//             bot.telegram.sendMessage(chatId, `Transaction sent successfully`);
//             // rubyApi.PurchaseVBucks(true, "Shop", packId, ctx)

//         })
//         .catch(async (e) => {
//             if (e instanceof UserRejectsError) {
//                 await deleteMessage(chatId);
//                 bot.telegram.sendMessage(chatId, `You rejected the transaction`);
//                 // rubyApi.PurchaseVBucks(false, "Shop", packId, ctx)
//                 return;
//             }
//             await deleteMessage(chatId);
//             bot.telegram.sendMessage(chatId, `Unknown error happened`);
//             // rubyApi.PurchaseVBucks(false, "Shop", packId, ctx)
//             return;
//         })
//         .finally(() => connector.pauseConnection());


//     let deeplink = '';
//     const walletInfo = await getWalletInfo(connector.wallet?.device.appName);
//     if (walletInfo) {
//         deeplink = walletInfo.universalLink;
//     }

//     botMessage = await bot.telegram.sendMessage(
//         chatId,
//         `Open ${walletInfo?.name || connector.wallet?.device.appName} and confirm transaction, Please note transaction will be discarded after 60 seconds}`,
//         {
//             reply_markup: {
//                 inline_keyboard: [
//                     [
//                         {
//                             text: 'Open Wallet',
//                             url: deeplink
//                         }
//                     ]
//                 ]
//             }
//         }
//     );
// }


// const deleteMessage = async (chatId) => {
//     if (!messageWasDeleted) {
//         messageWasDeleted = true;
//         try {
//             await bot.telegram.deleteMessage(chatId, botMessage.message_id);
//         } catch {
//             console.error(`Failed to delete message with ID ${botMessage.message_id} in chat ${chatId}`);
//          }
//     }
// };
