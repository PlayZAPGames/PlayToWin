<script lang="ts">
  import axios from "axios";
  import { currencies } from "../lib/walletUtil";

  interface TournamentData {
    id: number;
    name: string;

    price_pool: number;
    price_pool_currency: number;

    entry_fee: number;
    entry_fee_currency: number;

    description: string;
    created_at: string;
  }

  let tableData: TournamentData[] = [];
  let loading: boolean = true;
  let errorMessage: string = "";

  let editModalVisible: boolean = false;

  // Bind selected values
  let selectedCurrency = currencies.all;
  let searchAddress;

  async function fetchData() {
    loading = true;
    errorMessage = "";

    const body = {
      page: 1,
      currency: selectedCurrency,
      address: searchAddress,
    };

    try {
      const response = await axios.get("/api/admin/tournaments", {
        params: body,
      });
      tableData = response.data;
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  }

  fetchData();
</script>

<div class="EditModal" hidden={!editModalVisible}>
  <h1>Edit Tournament</h1>
  <div class="EditModal__content">
    <div class="EditModal__content--left">
      <label for="name">Name</label>
      <input type="text" name="name" id="name" />
    </div>
    <div class="EditModal__content--right">
      <label for="description">Description</label>
      <input type="text" name="description" id="description" />
    </div>
  </div>
</div>

<div class="Container">
  <h1>Trournaments</h1>
  <div class="Filters">
    <button on:click={fetchData}>submit</button>
  </div>

  {#if loading}
    <span>LOADING...</span>
  {:else if errorMessage}
    <span>ERROR: {errorMessage}</span>
  {:else}
    <table>
      <tr>
        <th>#</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
      {#each tableData as item}
        <tr>
          <td>{item.id}.</td>

          <td>{item.created_at}</td>
          <td>
            <button
              on:click={() => {
                editModalVisible = true;
              }}>Edit</button
            >
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

  .EditModal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
  }
</style>
