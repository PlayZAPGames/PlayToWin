import { encodeTelegramUrlParameters, isTelegramUrl } from '@tonconnect/sdk';
import dotenv from 'dotenv';
dotenv.config();

const AT_WALLET_APP_NAME = 'telegram-wallet';

function addTGReturnStrategy(link, strategy){
    const parsed = new URL(link);
    parsed.searchParams.append('ret', strategy);
    link = parsed.toString();

    const lastParam = link.slice(link.lastIndexOf('&') + 1);
    return link.slice(0, link.lastIndexOf('&')) + '-' + encodeTelegramUrlParameters(lastParam);
}


function convertDeeplinkToUniversalLink(link, walletUniversalLink){
    const search = new URL(link).search;
    const url = new URL(walletUniversalLink);

    if (isTelegramUrl(walletUniversalLink)) {
        const startattach = 'tonconnect-' + encodeTelegramUrlParameters(search.slice(1));
        url.searchParams.append('startattach', startattach);
    } else {
        url.search = search;
    }

    return url.toString();
}


async function buildUniversalKeyboard(link,wallets){
    const atWallet = wallets.find(wallet => wallet.appName.toLowerCase() === AT_WALLET_APP_NAME);
    const atWalletLink = atWallet
        ? addTGReturnStrategy(
            convertDeeplinkToUniversalLink(link, atWallet?.universalLink),
            process.env.TELEGRAM_BOT_LINK
        )
        : undefined;

    const keyboard = [
        {
            text: 'Choose a Wallet',
            callback_data: JSON.stringify({ method: 'chose_wallet' })
        },
        {
            text: 'Open Link',
            url: `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(link)}`
        }
    ];

    if (atWalletLink) {
        keyboard.unshift({
            text: '@wallet',
            url: atWalletLink
        });
    }

    return keyboard;
}


// src/utils.js

// Symbol for timeout exception
const pTimeoutException = Symbol();


/**
 * Timeout a promise
 * @param {Promise<any>} promise - The promise to timeout
 * @param {number} time - Timeout duration in milliseconds
 * @param {any} exception - Exception to throw when timeout occurs
 * @returns {Promise<any>} - The promise with timeout
 */
function pTimeout(promise, time, exception = pTimeoutException) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_r, rej) => (timer = setTimeout(rej, time, exception)))
    ]).finally(() => clearTimeout(timer));
}


export {
    addTGReturnStrategy,
    convertDeeplinkToUniversalLink,
    buildUniversalKeyboard,
    pTimeout,
    AT_WALLET_APP_NAME,
    pTimeoutException
};

