<script lang="ts">
  import axios from "axios";
  import { currencies, status } from "../lib/walletUtil";
  import Pagination from "../lib/Pagination.svelte";
  import Address from "../lib/Address.svelte";
  import { getObjectEntries, getStatusByNumber } from "../lib/Util";

  let pageNumber = 1;
  let pageSize = 10;

  interface WithdrawalData {
    id: number;
    wallet_id: number;
    wallet_history_id: number;
    token_type: string;
    value: number;
    status: number;
    tx_hash: string;
    created_at: string;
    updated_at: string;
    transaction_type: 0;
    crew_id: number;
    resp: string;
    linkable_type: string;
    linkable_id: number;
    chain_id: string;
    request_at: string;
    virtual_id: number;
    wallet_ary: number[];
    value_ary: number[];
    call_type: number;
    commission_crew_id: number;
    commission_value: number;
    detail: string;
  }

  // Bind selected values
  let selectedCurrency = currencies.all;
  let selectedStatus = status.all;
  let searchAddress;

  let tableData: WithdrawalData[];

  let loading: boolean = true;
  let errorMessage: string = "";

  async function fetchData() {
    loading = true;
    errorMessage = "";

    const body = {
      page: pageNumber,
      limit: pageSize,

      status: selectedStatus,
      virtualId: selectedCurrency,
      address: searchAddress,
    };

    try {
      const response = await axios.get(`/api/admin/transfers`, {
        params: body,
      });
      tableData = response.data.data; // Store the fetched data in tableData
    } catch (error) {
      errorMessage = "Failed to fetch data.";
      console.error(error);
    } finally {
      loading = false;
    }
  }

  //   async function approve(id) {
  //     try {
  //       const response = await axios.get(`/api/admin/withdrawal/approve/${id}`);
  //       alert(response.data);
  //     } catch (error) {
  //       alert(JSON.stringify(error.response.data));
  //     }
  //     // return json;
  //   }

  fetchData();
</script>

<div class="Container">
  <h1>Transfers</h1>
  <div class="Filters">
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
      {#each getObjectEntries(status) as [key, value]}
        <option {value}>{key}</option>
      {/each}
    </select>

    <button on:click={fetchData}>submit</button>
  </div>

  <Pagination bind:pageNumber {fetchData} />

  {#if loading}
    <span>LOADING...</span>
  {:else if errorMessage}
    <span>ERROR: {errorMessage}</span>
  {:else}
    <table>
      <tr>
        <th>#</th>
        <th>Type</th>
        <th>Chain</th>
        <th>Amount</th>
        <th>Commission</th>
        <th>Status</th>
        <th>Hash</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
      {#each tableData as item, index}
        <tr class="value">
          <td>{pageNumber * pageSize - pageSize + index + 1}</td>
          <td>{item.linkable_type || "not set"}</td>
          <td>{item.chain_id}</td>
          <td>
            {#if item.value > 0}
              {item.value.toFixed(2)}
            {:else}
              {@html item.value_ary
                .map((item) => item.toFixed(2))
                .toString()
                .replaceAll(",", " <br> ")}
            {/if}
          </td>
          <td>{item.commission_value}</td>
          <td>{getStatusByNumber(item.status, status)}</td>
          <td>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            {#if item.tx_hash}
              <pre style="white-space: pre-wrap">
                <Address receiver={item.tx_hash} />
              {item.tx_hash.substring(0, 20) + "..."}
            </pre>
            {:else}
              {"not set"}
            {/if}

            <!-- <pre style="white-space: pre-wrap; text-align:left"></pre> -->
          </td>
          <td>
            {new Date(item.created_at).toString()}
          </td>
          <td>
            <!-- {#if item.status === status.pending || item.status === status.failed}
              <button
                on:click={() => {
                  approve(item.id);
                }}>Approve</button
              >
            {/if} -->
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
