<script lang="ts">
  import axios from "axios";
  import Withdraw from "./Withdraw.svelte";
  import { getStatusByNumber } from "../lib/Util";
  import { ProcessType } from "../lib/walletUtil";

  let tableData: VirtualData[] = []; // Stores fetched table data
  let loading = false; // Loading state for table refresh
  let errorMessage = ""; // Error state for failed fetches

  interface VirtualData {
    chain_key: string;
    chain_name: string;

    chain_reward_key: string;
    chain_reward_name: string;

    credit_amount: number;

    commission_crew_key: string;

    crew_key: string;
    crew_name: string;

    default: boolean;
    name: string;
    process_type: number;

    reward_crew_key: string;
    reward_crew_name: string;
  }

  // Bind selected values
  let searchDateStart;
  let searchDateEnd;

  let selectedStatus;
  let searchAddress;
  let searchPublicSlug;
  let searchName;
  let pageNumber = 1;
  let pageSize = 10;

  let modal;
  let editminWithdraw;
  let editmaxWithdraw;
  let editfee1;
  let editfee2;
  let editautoWithdrawLimit;
  let editMaintainance;
  let editWithdrawStatus;

  let editVirtualData: VirtualData;

  async function fetchData() {
    loading = true;
    errorMessage = "";

    try {
      const response = await axios.get(`/api/admin/virtual_chains`, {
        params: {
          page: pageNumber,
          limit: pageSize,
          startDate: searchDateStart,
          endDate: searchDateEnd,
          status: selectedStatus,
          address: searchAddress,
          publicSlug: searchPublicSlug,
          name: searchName,
        },
        headers: {},
      });
      tableData = response.data.data; // Store the fetched data in tableData

      // tableData = tableData.filter(
      //   (item) => item.currency_type === 6 || item.currency_type == 12
      // );
    } catch (error) {
      errorMessage = error.message;
    }
    loading = false;
  }

  async function editVirtual() {
    try {
      // const response = await axios.put(
      //   `/api/admin/virtuals/${editVirtualData.id}`,
      //   {
      //     deposit: editMaintainance,
      //     withdraw: editWithdrawStatus,
      //     fee1: editfee1,
      //     fee2: editfee2,
      //     min_withdraw: editminWithdraw,
      //     auto_withdraw_limit: editautoWithdrawLimit,
      //   },
      //   {}
      // );

      // alert(JSON.stringify(response.data));

      modal.close();
      fetchData();
    } catch (error) {
      errorMessage = error.message;
    }
  }

  fetchData();

  // onMount(() => {
  //   if (modal) modal.showModal();
  // });
</script>

<div class="Container">
  <h1>Virtual Chain</h1>
  {#if errorMessage}
    <p>{errorMessage}</p>
  {/if}
  {#if loading}
    <p>Loading...</p>
  {:else}
    <table>
      <tr>
        <th>Type</th>
        <th>Currency</th>
        <th>Address</th>
        <th>Comm Address</th>
        <th>Chain</th>
        <th>Credit Amount</th>
        <th>Default</th>
      </tr>
      {#each tableData as item, index}
        <tr class="value">
          <td>{getStatusByNumber(item.process_type, ProcessType)}</td>
          <td>{item.name}</td>
          <td style="text-align: left;">
            {item.crew_name}
            <br />
            {item.crew_key}
            <hr />
            R:
            {item.reward_crew_name}
            <br />
            {item.reward_crew_key}
          </td>
          <td style="text-align: left;">
            Commision:
            <br />
            {item.commission_crew_key}
          </td>
          <td style="text-align: left;">
            {item.chain_name}
            <br />
            {item.chain_key}
            <hr />
            R: {item.chain_reward_name}
            <br />
            {item.chain_reward_key}
          </td>
          <td>{item.credit_amount}</td>
          <td>{item.default}</td>
          <td>
            <button
              on:click={() => {
                editVirtualData = item;

                // editminWithdraw = item.min_withdraw;
                // editmaxWithdraw = item.day_limit;
                // editfee1 = item.fee1;
                // editfee2 = item.fee2;
                // editautoWithdrawLimit = item.auto_withdraw_limit;
                // editMaintainance = item.deposit;
                // editWithdrawStatus = item.withdraw;

                // editAmount;
                if (modal) modal.showModal();
              }}>Edit</button
            >
          </td>
        </tr>
      {/each}
    </table>
  {/if}
</div>
<dialog bind:this={modal}>
  <div class="inputs">
    <label for="maintainance">Maintainance</label>
    <input
      type="checkbox"
      name="maintainance"
      id="maintainance"
      bind:checked={editMaintainance}
      placeholder="maintainance"
    />
    <label for="withdraw">Withdraw</label>
    <input
      type="checkbox"
      name="withdraw"
      id="withdraw"
      bind:checked={editWithdrawStatus}
      placeholder="withdraw"
    />
  </div>
  <div class="inputs">
    <label for="min_withdraw"> min</label>
    <input
      type="text"
      name="min_withdraw"
      id="min_withdraw"
      bind:value={editminWithdraw}
      placeholder="min_withdraw"
    />
  </div>
  <div class="inputs">
    <label for="max_withdraw"> max</label>
    <input
      type="text"
      name="max_withdraw"
      id="max_withdraw"
      bind:value={editmaxWithdraw}
      placeholder="max_withdraw"
    />
  </div>
  <div class="inputs">
    <label for="auto_withdraw_limit"> auto withdraw limit</label>
    <input
      type="text"
      name="auto_withdraw_limit"
      id="auto_withdraw_limit"
      bind:value={editautoWithdrawLimit}
      placeholder="auto_withdraw_limit"
    />
  </div>
  <div class="inputs">
    <label for="fee_withdraw">Withdrawal fee</label>
    <input
      type="text"
      name="fee_withdraw"
      id="fee_withdraw"
      bind:value={editfee1}
      placeholder="fee_withdraw"
    />
  </div>

  <div class="inputs">
    <label for="fee_swap">Swap fee</label>
    <input
      type="text"
      name="fee_swap"
      id="fee_swap"
      bind:value={editfee2}
      placeholder="fee_swap"
    />
  </div>

  <div class="Buttons">
    <button
      on:click={() => {
        editVirtual();
      }}>Save</button
    >
    <button on:click={() => modal.close()}>x</button>
  </div>
</dialog>

<style>
  .Container {
    display: flex;
    align-items: center;
    justify-content: center;

    flex-direction: column;

    gap: 20px;
  }
  dialog {
    padding: 20px;
    border-radius: 10px;
  }
  dialog {
    /* width: 85%; */
    /* height: 150px; */

    overflow: visible;

    background-color: var(--color-bg-primary);
    border: none;
    border-radius: 10px;
    /* padding: 10px; */

    text-align: center;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }
  dialog[open] {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;

    gap: 10px;
  }

  dialog .inputs {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
</style>
