import { bot } from '../bot-handlers/bot.js';
import { getWallets, getWalletInfo } from './wallet.js';
import _connector from './connector.js';
import QRCode from 'qrcode';
import fs from 'fs';
import { buildUniversalKeyboard, addTGReturnStrategy } from './utils.js';
import { isTelegramUrl } from '@tonconnect/sdk';
import '../bot-handlers/botQuery.js';

const walletMenuCallbacks = {
    chose_wallet: onChooseWalletClick,
    select_wallet: onWalletClick,
    universal_qr: onOpenUniversalQRClick
};

export { walletMenuCallbacks }

async function onChooseWalletClick(query) {
    console.log("CLICKED")
    const wallets = await getWallets();

    let messagId = query.update.callback_query.message.message_id
    let chatId = query.update.callback_query.message.chat.id

    await query.editMessageReplyMarkup(
        {
            inline_keyboard: [
                wallets.map(wallet => ({
                    text: wallet.name,
                    callback_data: JSON.stringify({ method: 'select_wallet', data: wallet.appName })
                })),
                [
                    {
                        text: '« Back',
                        callback_data: JSON.stringify({
                            method: 'universal_qr'
                        })
                    }
                ]
            ]
        },
        {
            message_id: messagId,
            chat_id: chatId
        }

    );
}

// this will change the QR Code of the wallet according to the selections recvd
async function editQR(message, link) {
    const fileName = 'QR-code-' + Math.round(Math.random() * 10000000000); // Generate random name for QR image 

    // Generate the QR code image file
    await QRCode.toFile(`./${fileName}`, link);

    try {
        // Edit the message media to replace the existing photo with the generated QR code
        await bot.telegram.editMessageMedia(
            message.chat.id,
            message.message_id,
            undefined, // Inline keyboard markup (if any)
            {
                type: 'photo',
                media: { source: `./${fileName}` } // Use 'source' to specify local file path
            }
        );
    } catch (error) {
        console.error('Error editing message media:', error.message);
    }

    // Remove the generated QR code file after editing the message

    await fs.rm(`./${fileName}`, (error) => {
        console.error('Error removing QR code file:', error);
    });
}



async function onOpenUniversalQRClick(query) {
    let messagId = query.update.callback_query.message.message_id
    let chatId = query.update.callback_query.message.chat.id
    let userId = query.update.callback_query.from.id
    const wallets = await getWallets();

    const connector = await _connector.getConnector(chatId, userId);


    const link = await connector.connect(wallets);
    await editQR(query.update.callback_query.message, link);

    const keyboard = await buildUniversalKeyboard(link, wallets);


    await bot.telegram.editMessageReplyMarkup(
        chatId,
        messagId,
        undefined, // Inline keyboard markup (if any)
        {
            inline_keyboard: [keyboard]
        },
    );
}

async function onWalletClick(query, data) {
    let messagId = query.update.callback_query.message.message_id
    let chatId = query.update.callback_query.message.chat.id
    let userId = query.update.callback_query.from.id
    const connector = await _connector.getConnector(chatId, userId);

    const selectedWallet = await getWalletInfo(data);
    // const selectedWallet = await getWalletInfo(data);
    if (!selectedWallet) {
        return;
    }
    let buttonLink;
    try {
            buttonLink = connector.connect({
            bridgeUrl: selectedWallet.bridgeUrl,
            universalLink: selectedWallet.universalLink
        });
    } catch (error) {
        console.log("Error connecting to wallet:", error);
        bot.telegram.sendMessage(chatId, `Wallet already connected, try ${"/my_wallet"}`);
        return;
    }

    let qrLink = buttonLink;

    if (isTelegramUrl(selectedWallet.universalLink)) {
        buttonLink = addTGReturnStrategy(buttonLink, process.env.TELEGRAM_BOT_LINK);
        qrLink = addTGReturnStrategy(qrLink, 'none');
    }

    await editQR(query.update.callback_query.message, qrLink);

    await bot.telegram.editMessageReplyMarkup(
        chatId,
        messagId,
        undefined, // Inline keyboard markup (if any)
        {
            inline_keyboard: [
                [
                    {
                        text: '« Back',
                        callback_data: JSON.stringify({ method: 'chose_wallet' })
                    },
                    {
                        text: `Open ${selectedWallet.name}`,
                        url: buttonLink
                    }
                ]
            ]
        },
    );
}


