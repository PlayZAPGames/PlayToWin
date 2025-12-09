import dotenv from 'dotenv';
dotenv.config();
import userData from '../utility/userData.js';

// const storage = new Map(); // temporary storage implementation. We will replace it with the redis later

let baseUrl = process.env.BASE_URL;

class TonConnectStorage {
  constructor(ctx, token) {
    this.ctx = ctx;
    this.token = token;
  }

  getKey(key) {
    return this.ctx.toString() + key; // we will simply have different keys prefixes for different users
  }
  getToken(){
    return this.token;
  }

  async removeItem(key) {
    console.log("removeItem: ", this.token)

    try {
      // Make a POST request to the API endpoint
      const response = await fetch(`${baseUrl}/api/tg_wallet_storages/${this.getKey(key)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Telegram': 100,
          'Authorization': await userData.UserAuth(this.ctx)
        },
      });
      // Parse the JSON response
      let data = await response.json();
      console.log('Response:', data);
      if (data.status == 2)
        data = null
      return data;
    } catch (error) {
      console.log("---->delete Item: error", error.message)
      return null;
    }
  }

  async setItem(key, value) {
    console.log("setItem: ", this.token)

    try {
      // Define the data to be sent in the request body
      const postData = {
        tg_wallet_storage: {
          key: this.getKey(key),
          value: value
        }
      };

      // Make a POST request to the API endpoint
      const response = await fetch(`${baseUrl}/api/tg_wallet_storages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Telegram': 100,
          'Authorization': await userData.UserAuth(this.ctx)
        },
        body: JSON.stringify(postData)
      });

      // Parse the JSON response
      const data = await response.json();
      console.log('Response:', data);

    } catch (error) {
      console.error('Error:', error.message);
    }
  }

  async getItem(key) {
    try {
      // Make a POST request to the API endpoint
      const response = await fetch(`${baseUrl}/api/tg_wallet_storages/${this.getKey(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Telegram': 100,
          'Authorization': await userData.UserAuth(this.ctx)
        },
      });
      // Parse the JSON response
      const data = await response.json();
      let value = JSON.parse(data.data.value);

      if (data.status == 2)
        return null
      else
      {
        console.log(value)
        return value;
      }
    } catch (error) {
      console.log("---->get Item1: error" + error.message)
      return null;
    }
  }
}

export default TonConnectStorage;