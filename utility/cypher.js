import crypto from "crypto";
const algorithm = "aes-256-cbc";
const iv = crypto.randomBytes(16);
import { Buffer } from "buffer";


function encrypt(text, secretKey) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text, secretKey) {
  console.log("text: ", text);
  let textParts = text.split(":");
  let iv = Buffer.from(textParts.shift(), "hex");
  let encryptedText = Buffer.from(textParts.join(":"), "hex");
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// function encryptRubyData(data, secretKey) {
//   try {
//     const cipher = crypto.createCipheriv(
//       "aes-256-cbc",
//       secretKey,
//       Buffer.alloc(16) // Initialization vector (IV) should be the same as decryption
//     );

//     const dataString = data.toString(); // Ensure data is in string format
//     let encryptedBuffer = cipher.update(dataString);
//     encryptedBuffer = Buffer.concat([encryptedBuffer, cipher.final()]);

//     const encryptedData = encryptedBuffer.toString("base64");
//     console.log("Encrypted:", encryptedData);
//     return encryptedData;
//   } catch (error) {
//     console.error("Encryption failed:", error.message);
//     return null;
//   }
// }

// function decryptRubyData(encryptedData, secretKey) {
//   try {
//     const encryptedBuffer = Buffer.from(encryptedData, "base64");
//     const decipher = crypto.createDecipheriv(
//       "aes-256-cbc",
//       secretKey,
//       Buffer.alloc(16)
//     );
//     let decryptedBuffer = decipher.update(encryptedBuffer);
//     decryptedBuffer = Buffer.concat([decryptedBuffer, decipher.final()]);

//     // console.log("Decrypted:", decryptedBuffer.toString());
//     // const decryptedInteger = parseInt(decryptedBuffer.toString(), 10);
//     return decryptedBuffer.toString();
//   } catch (error) {
//     console.error("Decryption failed:", error.message);
//     return null;
//   }
// }

function stringToSlug(str) {
  const encoded = Buffer.from(str).toString("base64");
  return encoded;
}

function slugToString(slug) {
  console.log(slug);
  const decoded = Buffer.from(slug, "base64").toString("utf-8");
  return decoded;
}

const slugType = Object.freeze({
  history: "tx_id",
  user_id: "uid",
  swap: "swap_id",
  withdraw: "withdraw_id",
  deposit: "deposit_id",
  transactionHash: "transactionHash",
  purchase: "purchase_id",
});

function numberToSlug(id, type = "") {
  const encoded = `${id}:${type}`;
  const buffer = Buffer.from(encoded);
  const base64Slug = buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // return base64Slug;
  return base64Slug;
}

function slugToNumber(slug, type) {
  const base64 = slug.replace(/-/g, "+").replace(/_/g, "/");
  const buffer = Buffer.from(base64, "base64");
  const decoded = buffer.toString("utf8");

  const [id, decodedType] = decoded.split(":");

  console.log(id, decodedType);

  if (decodedType !== type) {
    console.error(`Slug: Expected type ${type}, got ${decodedType}`);
    return -1;
    // throw new Error(`Slug: Expected type ${type}, got ${decodedType}`);
  }

  return parseInt(id, 10);
}

function createHash(userId) {
  // Hash the userId using SHA-256
  const hash = crypto
    .createHash("sha256")
    .update(userId.toString())
    .digest("hex");

  // Convert the hash to a 6-character alphanumeric string
  const base62 = process.env.Base62Key;
  let hashInt = BigInt("0x" + hash);
  let shortHash = "";

  while (shortHash.length < 6) {
    shortHash += base62[Number(hashInt % BigInt(62))];
    hashInt /= BigInt(62);
  }

  return shortHash;
}

export {
  encrypt,
  decrypt,
  slugType,
  numberToSlug,
  slugToNumber,
  stringToSlug,
  slugToString,
  // encryptRubyData,
  // decryptRubyData,
  createHash,
};