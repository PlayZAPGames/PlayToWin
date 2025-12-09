<script lang="ts">
  import axios from "axios";
  import { currencies, status, txnstatus } from "../lib/walletUtil";
  import { type TransfersData } from "../lib/types";
  import Pagination from "../lib/Pagination.svelte";
  import Address from "../lib/Address.svelte";
  import { getObjectEntries, getStatusByNumber } from "../lib/Util";
  import DateFilter from "../lib/DateFilter.svelte";
    import toast from "svelte-french-toast";

  let pageNumber = 1;
  let pageSize = 10;

  interface TransferRwardsData {
    transfer_id: string;
    draw_date: string;
    crew_id: string;
    commission_crew_id: number;
    commission_value: number;
    status: number;
    tx_hash: string;
    wallet_keys: string[];
    value_ary: number[];
    wallet_ary: number[];
    user_ids: number[];

    // chain_name: string;
    // transfers: TransfersData[];

    // user_id: number;

    value: number;
    resp: string;
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
    status: selectedStatus !== status.all ? selectedStatus : '',
    virtualId: selectedCurrency !== currencies.all ? selectedCurrency : '',
    address: searchAddress?.trim() || '',
  };

    try {
      const response = await axios.get(`/api/admin/raffle_transfer_rewards`, {
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

  async function approve(id:any, wallet_ary:any, value_ary:any, user_ids:any) {
    try {


      // alert(JSON.stringify(id));
      
      const response = await axios.post(
        `/api/admin/transfer_raffle_rewards/initiate/${id}`,{
          wallet_ary,
          value_ary,
          user_ids
      });

      toast.success(response.data?.message);
      // alert(JSON.stringify(response.data));

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
    <!-- <select bind:value={selectedCurrency}>
      <option disabled value="">Select a currency</option>
      {#each getObjectEntries(currencies) as [key, value]}
        <option {value}>{key}</option>
      {/each}
    </select> -->

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
        <th>draw date</th>
        <th>transfers</th>
        <th>value</th>
        <th>address</th>
        <th>Status</th>
        <th>commission</th>
      </tr>
      {#each tableData as item, index}
        <tr class="value">
          <td>{pageNumber * pageSize - pageSize + index + 1}</td>
          <td>{item.draw_date ?  new Date(item.draw_date).toString() : "-"}</td>
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
                  approve(item?.transfer_id, item?.wallet_ary, item?.value_ary, item?.user_ids);
                }}>Reinit</button
              >
            {:else if item.status === txnstatus.PENDING}
              <button
                on:click={() => {
                  approve(item?.transfer_id, item?.wallet_ary, item?.value_ary, item?.user_ids);
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
