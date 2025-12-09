<script lang="js">
  import { onMount } from 'svelte'
  import toast from 'svelte-french-toast'
  import baseUrl from '../config'
  import { sidebarOpen } from '../stores/sidebar'
  import { formatDateTimeLocal, toUTCDateTime } from '../utils/commonMethods'
  import { AIRDROP_STATUS, CURRENCY_TYPE, GAME_ENTRY_TYPE } from '../../../utility/enums'

  import { getToken } from '../lib/auth'
  let records = []
  let loading = true
  let error = null
  let showModal = false
  let selectedRecord = null
  let showDeleteModal = false
  let selectedData = ''
  let dataToDeleteId = null

  // Convert enums to arrays of string values

  const confirmDelete = (data) => {
    selectedData = data.gameName
    dataToDeleteId = data.id
    showDeleteModal = true
  }

  let formData = {
    gameName: '',
    entryFee: null,
    currencyType: null,
    winningCurrencyType: null,
    kills: null,
    timeBonus: null,
    bossKills: null,
    rank1: null,
    rank2: null,
    rank3: null,
    rank4: null,
  }

  $: if (formData.currencyType === 'free') {
    formData.entryFee = 0
  }

  async function fetchData() {
    loading = true
    try {
      const token = getToken()
      const response = await fetch(`${baseUrl}/api/admin/game`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch data')
      const data = await response.json()
      records = data.data
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  const openAddModal = () => {
    selectedRecord = null
    formData = {
      gameName: 'LudoRoyal',
      entryFee: null,
      currencyType: null,
      winningCurrencyType: null,
      kills: null,
      timeBonus: null,
      bossKills: null,
      rank1: null,
      rank2: null,
      rank3: null,
      rank4: null,
    }
    showModal = true
  }

  const openEditModal = (data) => {
    console.log('openEditModal', data)
    selectedRecord = data
    formData = {
      gameName: 'LudoRoyal',
      entryFee: data.entryFee,
      currencyType: data.currencyType,
      winningCurrencyType: data.winningCurrencyType,
      kills: data.kills,
      timeBonus: data.timeBonus,
      bossKills: data.bossKills,
      rank1: data.rank1,
      rank2: data.rank2,
      rank3: data.rank3,
      rank4: data.rank4,
    }
    showModal = true
  }

  const handleCreate = async () => {
    const token = getToken()
    const dataToSend = {
      ...formData,
      gameName: 'LudoRoyal',
    }

    const res = await fetch(`${baseUrl}/api/admin/game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend),
    })
    if (res.ok) {
      const response = await res.json()
      showModal = false
      await fetchData()
      console.log('Success:', response)
      toast.success(response.message)
    } else {
      const error = await res.json()
      console.log('API Error:', error.message)
      toast.error(error.message)
    }
  }

  const handleUpdate = async () => {
    const token = getToken()
    const dataToSend = {
      ...formData,
      gameName: 'LudoRoyal',
    }
    const res = await fetch(`${baseUrl}/api/admin/game/${selectedRecord.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend),
    })
    if (res.ok) {
      const response = await res.json()
      showModal = false
      await fetchData()
      toast.success(response.message)
    } else {
      const error = await res.json()
      toast.error(error.message)
    }
  }

    const handleDeleteRecord = async () => {
    if (!dataToDeleteId) return

    const token = getToken()
    try {
      const res = await fetch(`${baseUrl}/api/admin/game/${dataToDeleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data?.msg || 'Failed to delete data')
      } else {
        showDeleteModal = false
        await fetchData()
      }
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Something went wrong while deleting the data.')
    }
  }

  const handleSubmit = () => {
    if (selectedRecord) {
      handleUpdate()
    } else {
      handleCreate()
    }
  }

  onMount(async () => {
    fetchData()
  })
</script>

<!-- <div class="page-content"> -->
<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>
  {#if loading}
    <p>Loading data...</p>
  {:else if error}
    <p style="color: red;">{error}</p>
  {:else}
    <div class="container-fluid">
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <div class="row justify-content-between">
            <div class="col-lg-9 pull-right btn text-left">
              <h5 class="m-0 font-weight-bold text-primary">Game</h5>
            </div>
            <!-- <div class="">
              <button class="btn btn-primary m-0" on:click={openAddModal}>Add Game</button>
            </div> -->
          </div>
        </div>

        <div class="card-body table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Game name</th>
                <th>Entry fee</th>
                <th>Currency</th>
                <th>Winning Currency</th>
                <th>Kills</th>
                <th>Time Bonus</th>
                <th>Boss Kills</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each records as tableData}
                <tr>
                  <td>{tableData?.gameName}</td>
                  <td>{tableData?.entryFee}</td>
                  <td>{tableData?.currencyType}</td>
                  <td>{tableData?.winningCurrencyType}</td>
                  <td>{tableData?.kills}</td>
                  <td>{tableData?.timeBonus}</td>
                  <td>{tableData?.bossKills}</td>
                  <td>
                    <div class="action-column">
                      <span class="action-btn" on:click={() => openEditModal(tableData)}>
                        <i class="fas fa-pen"></i>
                      </span>
                      <!-- <span class="action-btn delete" on:click={() => confirmDelete(tableData)}>
                        <i class="fas fa-trash-alt"></i>
                      </span> -->
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
  {#if showModal}
    <div class="modal-backdrop" on:click={() => (showModal = false)}></div>

    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{selectedRecord ? 'Edit Season' : 'New Season'}</h3>
      </div>
      <form on:submit|preventDefault={handleSubmit} class="modal-form">
        <label>Game name</label>
        <input type="text" bind:value={formData.gameName} />

        <label>Entry Type</label>
        <select bind:value={formData.currencyType} style="margin-right: 12px;">
          <option value={GAME_ENTRY_TYPE[0]}>{GAME_ENTRY_TYPE[0]}</option>
          <option value={GAME_ENTRY_TYPE[1]}>{GAME_ENTRY_TYPE[1]}</option>
          <option value={GAME_ENTRY_TYPE[2]}>{GAME_ENTRY_TYPE[2]}</option>
        </select>

        <label>Entry fee </label>

        <input
          type="number"
          bind:value={formData.entryFee}
          disabled={formData.currencyType === 'free'}
        />

        <label>Winning currency type</label>
        <select bind:value={formData.winningCurrencyType} style="margin-right: 12px;">
          <option value={CURRENCY_TYPE[0]}>{CURRENCY_TYPE[0]}</option>
          <option value={CURRENCY_TYPE[1]}>{CURRENCY_TYPE[1]}</option>
        </select>

        <label>Kills</label>
        <input type="number" step="1" bind:value={formData.kills} />

        <label>Time Bonus</label>
        <input type="number" step="1" bind:value={formData.timeBonus} />

        <label>Boss Kills</label>
        <input type="number" step="1" bind:value={formData.bossKills} />

       

        <button class="submit-btn" type="submit">Submit</button>
      </form>
    </div>
  {/if}

    {#if showDeleteModal}
    <div class="modal-backdrop" on:click={() => (showDeleteModal = false)}></div>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Confirm Delete</h3>
      </div>
      <div class="modal-form">
        <p>Are you sure you want to delete <strong>{selectedData}</strong>?</p>
        <button class="submit-btn danger" on:click={handleDeleteRecord}>Yes, Delete</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .action-column {
    gap: 25px;
    display: inline-flex;
  }

  th:last-child {
    text-align: center;
  }

  td:last-child {
    white-space: nowrap;
    width: 120px;
    text-align: center;
  }

  .action-btn i {
    margin-right: 6px;
  }

  .action-btn {
    color: #4e73df;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
  }

  .action-btn i {
    margin-right: 6px;
  }

  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    z-index: 100;
    width: 420px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    scrollbar-width: none; /* Firefox */
  }
  .modal::-webkit-scrollbar {
    display: none; /* Chrome, Safari */
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99;
  }
  .modal-header {
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .modal-header h3 {
    margin: 0;
  }
  .modal input {
    height: 20px;
  }
  .modal-form label {
    text-align: left;
    font-weight: bold;
    color: #3b5bdb;
    display: block;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .modal-form input,
  .modal-form select {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    background: #f8f9fc;
    margin-bottom: 0.25rem;
  }
  .submit-btn {
    width: 100%;
    margin-top: 1rem;
    padding: 0.6rem;
    background-color: #4e73df;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

  .page-content.sidebar-closed {
    margin-left: 0;
  }

  .page-content {
    margin-left: 0;
    transition: all 0.3s ease;
    padding: 20px;
  }

  .table-wrapper {
    max-width: 100%;
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }

  th,
  td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  .card-header {
    padding: 0.75rem 1.25rem;
    margin-bottom: 0;
    background-color: #f8f9fc;
    border-bottom: 1px solid #e3e6f0;
  }

  .justify-content-between {
    justify-content: space-between !important;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    margin-right: -0.75rem;
    margin-left: -0.75rem;
  }
  .btn:not(:disabled):not(.disabled) {
    cursor: pointer;
  }

  .text-primary {
    color: #4e73df !important;
  }
  .font-weight-bold {
    font-weight: 700 !important;
  }
  .m-0 {
    margin: 0 !important;
  }

  
  h5 {
    font-size: 1.25rem;
  }

  .btn {
    display: inline-block;
    font-weight: 400;
    color: #858796;
    text-align: center;
    vertical-align: middle;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    background-color: transparent;
    border: 1px solid transparent;
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    line-height: 1.5;
    border-radius: 0.35rem;
    transition:
      color 0.15s ease-in-out,
      background-color 0.15s ease-in-out,
      border-color 0.15s ease-in-out,
      box-shadow 0.15s ease-in-out;
  }
  table {
    border-radius: 0 !important;
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid #e3e6f0 !important;
    border-radius: 0.35rem;
  }

  
  .container-fluid {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .card-body {
    flex: 1 1 auto;
    min-height: 1px;
    padding: 1.25rem;
  }


</style>
