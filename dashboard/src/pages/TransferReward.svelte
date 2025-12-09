<script lang="ts">
  import axios from "axios";
  import { currencies, status, txnstatus } from "../lib/walletUtil";
  import { type TransfersData } from "../lib/types";
  import Pagination from "../lib/Pagination.svelte";
  import Address from "../lib/Address.svelte";
  import { getObjectEntries, getStatusByNumber } from "../lib/Util";
  import DateFilter from "../lib/DateFilter.svelte";

  let pageNumber = 1;
  let pageSize = 10;

  interface TransferRwardsData {
    id: number;

    chain_name: string;
    game_name: string;
    tournament_name: string;
    release_time: string;

    transfers: TransfersData[];

    user_id: number;
    p_tokens: number;
    p_tokens_core: number;
    w_tokens: number;
    w_tokens_core: number;

    created_at: string;
    updated_at: string;

    value: number;
    value_ary: number[];
    wallet_keys: string[];
    commission_value: number;
    tx_hash: string;
    resp: string;
    status: number;
  }

  // Bind selected values
  let searchDateStart;
  let searchDateEnd;

  let selectedCurrency = currencies.all;
  let selectedStatus = status.all;
  let searchAddress;

  let tableData: TransferRwardsData[];

  let loading: boolean = true;
  let errorMessage: string = "";

  async function fetchData() {
    loading = true;
    errorMessage = "";

    const body = {
      page: pageNumber,
      limit: pageSize,

      startDate: searchDateStart,
      endDate: searchDateEnd,

      status: selectedStatus,
      virtualId: selectedCurrency,
      address: searchAddress,
    };

    try {
      const response = await axios.get(`/api/admin/transfer_rewards`, {
        params: body,
      });
      tableData = response.data; // Store the fetched data in tableData
    } catch (error) {
      errorMessage = "Failed to fetch data.";
      console.error(error);
    } finally {
      loading = false;
    }
  }

  async function approve(id) {
    try {
      const response = await axios.post(
        `/api/admin/transfer_rewards/initiate/${id}`
      );
      alert(JSON.stringify(response.data));

      fetchData();
    } catch (error) {
      alert(JSON.stringify(error.response.data));
    }
    // return json;
  }

  fetchData();
</script>

<div class="Container">
  <h1>Transfer Rewards</h1>
  <div class="Filters">
    <DateFilter bind:searchDateStart bind:searchDateEnd />

    <input
      type="text"
      name="address"
      id="searchAddress"
      bind:value={searchAddress}
      placeholder="Address"
    />
    <!-- Currency Dropdown -->
    <select bind:value={selectedCurrency}>
      <option disabled value="">Select a currency</option>
      {#each getObjectEntries(currencies) as [key, value]}
        <option {value}>{key}</option>
      {/each}
    </select>

    <!-- Status Dropdown -->
    <select bind:value={selectedStatus}>
      <option disabled value="">Select a status</option>
      {#each getObjectEntries(txnstatus) as [key, value]}
        <option {value}>{key}</option>
      {/each}
    </select>

    <button on:click={fetchData}>submit</button>
  </div>

  {#if loading}
    <span>LOADING...</span>
  {:else if errorMessage}
    <span>ERROR: {errorMessage}</span>
  {:else}
    <Pagination bind:pageNumber {fetchData} />

    <table>
      <tr>
        <th>#</th>
        <th>chain_name</th>
        <th>game_name</th>
        <th>tournament_name</th>
        <th>release_time</th>
        <th>transfers</th>
        <th>value</th>
        <th>address</th>
        <th>Status</th>
        <th>commission</th>
      </tr>
      {#each tableData as item, index}
        <tr class="value">
          <td>{pageNumber * pageSize - pageSize + index + 1}</td>
          <td>{item?.chain_name || "-"}</td>
          <td>{item?.game_name || "-"}</td>
          <td>{item?.tournament_name || "-"}</td>
          <td>{item.release_time ?  new Date(item.release_time).toString() : "-"}</td>
          <td style="text-align: left;">
            <pre style="white-space: pre-wrap">
              {#if item.tx_hash !== null}
                <Address
                  receiver={item?.tx_hash }
                />
                {item.tx_hash.substring(0, 15) +
                  "..." +
                  item.tx_hash.substring(
                    item.tx_hash.length - 15,
                    item.tx_hash.length
                  )}
              {:else}
                <Address receiver={item.resp} />
                {item.resp
                  ? item.resp.substring(0, 40) + "..."
                  : ""}
              {/if}
            </pre>
            {#if item.status === txnstatus.FAILED || item.status === txnstatus.PROCESSING}
              <button
                on:click={() => {
                  approve(item.id);
                }}>Reinit</button
              >
            {:else if item.status === txnstatus.PENDING}
              <button
                on:click={() => {
                  approve(item.id);
                }}>Reinit</button
              >
            {/if}
          </td>
          <td>
            {#if item.value > 0}
              {item.value.toFixed(2)}
            {:else if item.value_ary}
              {@html item.value_ary
                .map((item) => item.toFixed(2))
                .toString()
                .replaceAll(",", " <br> ")}
            {/if}
          </td>
          <td>
            {#if item.wallet_keys}
              {#each item.wallet_keys as address}
                <pre>
                  <Address receiver={address} />
                  {address
                    ? address.substring(0, 10) +
                      "..." +
                      address.substring(address.length - 10, address.length)
                    : ""}
              </pre>
              {/each}
            {/if}
          </td>
          <!-- {#if item.wallet_keys}
            {@html item.wallet_keys
              .map((item) => item)
              .toString()
              .replaceAll(",", " <br> ")}
          {/if} -->
          <td>
            {getStatusByNumber(item.status, txnstatus)}
          </td>
          <td>
            {item.commission_value}
          </td>
        </tr>
      {:else}
        <span>No data found.</span>
      {/each}
    </table>
  {/if}
</div>

<style>
  .Container {
    display: flex;
    align-items: center;
    justify-content: center;

    flex-direction: column;

    gap: 20px;
  }

</style>
