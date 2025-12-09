<script lang="ts">
  import { onMount } from 'svelte'
  import baseUrl from '../../config'
  import { sidebarOpen } from '../../stores/sidebar'
  import Paginations from '../../lib/Paginations.svelte'
  import { getToken } from '../../lib/auth'
  export let params: { tournament_id: string }

  let tournamentData = null
  let tableData: any[] = []
  let loading = true
  let error: string | null = null
  let pagination = { total: 0, page: 1, limit: 10, totalPages: 1 }
  let showAddModal = false
  let selectedRecord: any = null
  let showDeleteModal = false
  let dataToDeleteId: any = null
  let rewardHint = 'Enter fixed value'
  let selectedName = ''

  let validationErrors: Record<string, string> = {}

  // Convert enums to arrays of string values

  const confirmDelete = (data) => {
    selectedName = ''
    dataToDeleteId = data.id
    showDeleteModal = true
  }

  let formData = {
    tournament_id: params.tournament_id,
    reward_id: null,
    rank_from: null,
    rank_to: null,
    zpoints: 0,
    reward_type: '0',
    gems: 0,
    tickets: 0,
    tokens: 0.0,
    virtual1: 0.0,
    virtual2: 0.0,
    virtual4: 0.0,
    amount: 0.0,
    usdt: 0.0,
    tokens_sol: 0.0,
    tokens_core: 0.0,
    tokens_tezos: 0.0,
  }

  async function fetchData(page = 1) {
    console.log('tournament_id', params.tournament_id)

    loading = true
    try {
      const token = getToken()
      const response = await fetch(
        `${baseUrl}/api/admin/tournament-reward/${params.tournament_id}?page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      )
      if (!response.ok) throw new Error('Failed to fetch data')
      const data = await response.json()
      tableData = data.data
      pagination = data.pagination
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  const openAddModal = () => {
    selectedRecord = null
    formData = {
      tournament_id: params.tournament_id,
      reward_id: null,
      rank_from: null,
      rank_to: null,
      zpoints: 0,
      reward_type: '0',
      gems: 0,
      tickets: 0,
      tokens: 0.0,
      virtual1: 0.0,
      virtual2: 0.0,
      virtual4: 0.0,
      amount: 0.0,
      usdt: 0.0,
      tokens_sol: 0.0,
      tokens_core: 0.0,
      tokens_tezos: 0.0,
    }
    rewardHint = 'Enter fixed value'
    showAddModal = true
  }

  const openEditModal = (data) => {
    selectedRecord = data
    formData = {
      tournament_id: params.tournament_id,
      reward_id: data.id,
      rank_from: data.rank_from,
      rank_to: data.rank_to,
      zpoints: data.zpoints,
      reward_type: data.reward_type,
      gems: data.gems,
      tickets: data.tickets,
      tokens: data.tokens,
      virtual1: data.virtual1,
      virtual2: data.virtual2,
      virtual4: data.virtual4,
      amount: data.amount,
      usdt: data.usdt,
      tokens_sol: data.tokens_sol,
      tokens_core: data.tokens_core,
      tokens_tezos: data.tokens_tezos,
    }
    rewardHint = formData.reward_type == '0' ? 'Enter fixed value' : 'Enter value in percentage'
    showAddModal = true
  }

  const handleCreate = async () => {
    const token = getToken()
    // Convert reward_type to integer before sending
    const payload = {
      ...formData,
      reward_type: parseInt(formData.reward_type),
    }

    validationErrors = {} // reset

    const res = await fetch(`${baseUrl}/api/admin/tournament-reward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (res.status === 422) {
      for (const err of data.errors || []) {
        const match = err.match(/total\s+(\w+)/i) || err.match(/^(\w+)\s+value/i)
        if (match) {
          const field = match[1].toLowerCase()
          validationErrors[field] = err
        } else {
          validationErrors.general = err
        }
      }
      return
    }

    if (res.ok) {
      showAddModal = false
      await fetchData(pagination.page)
    } else {
      alert(data?.msg || 'Failed to create reward')
    }
  }

  const handleUpdateGame = async () => {
    const token = getToken()
    const res = await fetch(`${baseUrl}/api/admin/fairplay/${selectedRecord.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      showAddModal = false
      await fetchData(pagination.page)
    }
  }

  const handleDeleteData = async () => {
    if (!dataToDeleteId) return

    const token = getToken()
    try {
      const res = await fetch(`${baseUrl}/api/admin/tournament-reward/${dataToDeleteId}`, {
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
        await fetchData(pagination.page)
      }
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Something went wrong while deleting the data.')
    }
  }

  const handleSubmit = () => {
    if (selectedRecord) {
      handleUpdateGame()
    } else {
      handleCreate()
    }
  }

  onMount(async () => {
    const cached = sessionStorage.getItem('selectedTournament')

    if (cached) {
      tournamentData = JSON.parse(cached)
    } else {
      // fallback to API
      const token = getToken()
      const res = await fetch(`${baseUrl}/api/admin/tournament-info/${params.tournament_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      tournamentData = data.data
    }
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
              <h5 class="m-0 font-weight-bold text-primary">Tournament > Reward</h5>
            </div>
            <div class="">
              <button class="btn btn-primary m-0" on:click={openAddModal}
                >New Tournament Reward</button
              >
            </div>
          </div>
        </div>

        <div class="card-body table-wrapper">
          <div>
            <div class="row ml-2 grey-label mb-2">Winner Pool consumed:</div>
            <div class="row code ml-2 mr-2">
              Gems: {tournamentData?.gems} / {tournamentData?.gems}
            </div>
            <div class="row code ml-2 mr-2">
              Tickets: {tournamentData?.tickets} / {tournamentData?.tickets}
            </div>
            <div class="row code ml-2 mr-2">
              Tokens: {tournamentData?.tokens} / {tournamentData?.tokens}
            </div>
            <div class="row code ml-2 mr-2">
              Virtual1: {tournamentData?.virtual1} / {tournamentData?.virtual1}
            </div>
            <div class="row code ml-2 mr-2">
              Virtual2: {tournamentData?.virtual2} / {tournamentData?.virtual2}
            </div>
            <div class="row code ml-2 mr-2">
              Virtual4: {tournamentData?.virtual4} / {tournamentData?.virtual4}
            </div>
            <div class="row code ml-2 mr-2">
              Amount: {tournamentData?.amount} / {tournamentData?.amount}
            </div>
            <div class="row code ml-2 mr-2">
              Usdt: {tournamentData?.usdt} / {tournamentData?.usdt}
            </div>
            <div class="row code ml-2 mr-2">
              Tokens Solana {tournamentData?.tokens_sol} / {tournamentData?.tokens_sol}
            </div>
            <div class="row code ml-2 mr-2">
              Tokens Core {tournamentData?.tokens_core} / {tournamentData?.tokens_core}
            </div>
            <div class="row code ml-2 mr-2">
              Tokens Tezos {tournamentData?.tokens_tezos} / {tournamentData?.tokens_tezos}
            </div>
          </div>
          <table class="table-responsive">
            <thead>
              <tr>
                <th>Rank From</th>
                <th>Rank To</th>
                <th>zpoints</th>
                <th>Gems</th>
                <th>Tickets</th>
                <th>Tokens</th>
                <th>Virtual1</th>
                <th>Virtual2</th>
                <th>Virtual4</th>
                <th>Amount</th>
                <th>Usdt</th>
                <th>Tokens Solana</th>
                <th>Tokens Core</th>
                <th>Tokens Tezos</th>
                <th>Gems/User</th>
                <th>Tickets/User</th>
                <th>Tokens/User</th>
                <th>Virtual1/User</th>
                <th>Virtual2/User</th>
                <th>Virtual4/User</th>
                <th>Amount/User</th>
                <th>Usdt/User</th>
                <th>Tokens Solana/User</th>
                <th>Tokens Core/User</th>
                <th>Tokens Tezos/User</th>
                <th>TotalGems</th>
                <th>TotalTickets</th>
                <th>TotalTk</th>
                <th>TotalV1</th>
                <th>TotalV2</th>
                <th>TotalV4</th>
                <th>TotalAmount</th>
                <th>TotalUsdt</th>
                <th>TotalTokensSolana</th>
                <th>TotalTokensCore</th>
                <th>TotalTokensTezos</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each tableData as data}
                <tr>
                  <td>{data?.rank_from}</td>
                  <td>{data?.rank_to}</td>
                  <td>{data?.zpoints}</td>
                  <td>{data?.gems}</td>
                  <td>{data?.tickets}</td>
                  <td>{data?.tokens}</td>
                  <td>{data?.virtual1}</td>
                  <td>{data?.virtual2}</td>
                  <td>{data?.virtual4}</td>
                  <td>{data?.amount}</td>
                  <td>{data?.usdt}</td>
                  <td>{data?.tokens_sol}</td>
                  <td>{data?.tokens_core}</td>
                  <td>{data?.tokens_tezos}</td>
                  <td>{data?.each_gems}</td>
                  <td>{data?.each_tickets}</td>
                  <td>{data?.each_tokens}</td>
                  <td>{data?.each_virtual1}</td>
                  <td>{data?.each_virtual2}</td>
                  <td>{data?.each_virtual4}</td>
                  <td>{data?.each_amount}</td>
                  <td>{data?.each_usdt}</td>
                  <td>{data?.each_tokens_sol}</td>
                  <td>{data?.each_tokens_core}</td>
                  <td>{data?.each_tokens_tezos}</td>
                  <td>{data?.total_gems}</td>
                  <td>{data?.total_tickets}</td>
                  <td>{data?.total_tokens}</td>
                  <td>{data?.total_virtual1}</td>
                  <td>{data?.total_virtual2}</td>
                  <td>{data?.total_virtual4}</td>
                  <td>{data?.total_amount}</td>
                  <td>{data?.total_usdt}</td>
                  <td>{data?.total_tokens_sol}</td>
                  <td>{data?.total_tokens_core}</td>
                  <td>{data?.total_tokens_tezos}</td>
                  <!-- <td>{data?.}</td>
                  <td>{data?.}</td> -->

                  <td>
                    <div class="action-column">
                      <button class="action-btn" on:click={() => openEditModal(data)}>
                        <i class="fas fa-pen"></i>
                      </button>
                      <button class="action-btn delete" on:click={() => confirmDelete(data)}>
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if pagination.totalPages > 0}
            <Paginations
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => {
                pagination.page = p
                fetchData(p)
              }}
            />
          {:else}
            <div class="no-records">No records found</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  {#if showAddModal}
    <div class="modal-backdrop" on:click={() => (showAddModal = false)}></div>

    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{selectedRecord ? 'Edit Tournament Reward' : 'New Tournament Reward'}</h3>
      </div>

      <form on:submit|preventDefault={handleSubmit} class="modal-form">
        <label>Rank From</label>
        <input type="number" bind:value={formData.rank_from} required />
        {#if validationErrors.rank_from}
          <p class="form-error">{validationErrors.rank_from}</p>
        {/if}

        <label>Rank To</label>
        <input type="number" bind:value={formData.rank_to} required />
        {#if validationErrors.rank_to}
          <p class="form-error">{validationErrors.rank_to}</p>
        {/if}

        <label>ZPoints</label>
        <input type="number" bind:value={formData.zpoints} />

        <label>Gems</label>
        <input type="number" step="any" bind:value={formData.gems} />
        {#if validationErrors.gems}
          <p class="form-error">{validationErrors.gems}</p>
        {/if}

        <label>Tickets</label>
        <input type="number" step="any" bind:value={formData.tickets} />
        {#if validationErrors.tickets}
          <p class="form-error">{validationErrors.tickets}</p>
        {/if}

        <label>Tokens</label>
        <input type="number" step="any" bind:value={formData.tokens} />
        {#if validationErrors.tokens}
          <p class="form-error">{validationErrors.tokens}</p>
        {/if}

        <label>Virtual1</label>
        <input type="number" step="any" bind:value={formData.virtual1} />
        {#if validationErrors.virtual1}
          <p class="form-error">{validationErrors.virtual1}</p>
        {/if}

        <label>Virtual2</label>
        <input type="number" step="any" bind:value={formData.virtual2} />
        {#if validationErrors.virtual2}
          <p class="form-error">{validationErrors.virtual2}</p>
        {/if}

        <label>Virtual4</label>
        <input type="number" step="any" bind:value={formData.virtual4} />
        {#if validationErrors.virtual4}
          <p class="form-error">{validationErrors.virtual4}</p>
        {/if}

        <label>Amount</label>
        <input type="number" step="any" bind:value={formData.amount} />
        {#if validationErrors.amount}
          <p class="form-error">{validationErrors.amount}</p>
        {/if}

        <label>USDT</label>
        <input type="number" step="any" bind:value={formData.usdt} />
        {#if validationErrors.usdt}
          <p class="form-error">{validationErrors.usdt}</p>
        {/if}

        <label>Tokens Solana</label>
        <input type="number" step="any" bind:value={formData.tokens_sol} />
        {#if validationErrors.tokens_sol}
          <p class="form-error">{validationErrors.tokens_sol}</p>
        {/if}

        <label>Tokens Core</label>
        <input type="number" step="any" bind:value={formData.tokens_core} />
        {#if validationErrors.tokens_core}
          <p class="form-error">{validationErrors.tokens_core}</p>
        {/if}

        <label>Tokens Tezos</label>
        <input type="number" step="any" bind:value={formData.tokens_tezos} />
        {#if validationErrors.tokens_tezos}
          <p class="form-error">{validationErrors.tokens_tezos}</p>
        {/if}

        <button class="submit-btn" type="submit">Submit</button>
      </form>
    </div>
  {/if}

{#if showDeleteModal}
  <!-- Backdrop as a proper button -->
  <button
    class="modal-backdrop"
    on:click={() => (showDeleteModal = false)}
    on:keydown={(e) => e.key === 'Enter' && (showDeleteModal = false)}
    aria-label="Close confirmation modal"
  />

  <!-- Modal as a proper dialog -->
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title"
    aria-describedby="modal-description"
    class="modal"
    tabindex="-1"
  >
    <div class="modal-header">
      <h2 id="modal-title">Confirm Delete</h2>
    </div>
    <div class="modal-form">
      <p id="modal-description">
        Are you sure you want to delete <strong>{selectedName}</strong>?
      </p>
      <div class="button-group">
        <button
          class="btn secondary"
          on:click={() => (showDeleteModal = false)}
          on:keydown={(e) => e.key === 'Enter' && (showDeleteModal = false)}
        >
          Cancel
        </button>
        <button
          class="btn danger"
          on:click={handleDeleteData}
          on:keydown={(e) => e.key === 'Enter' && handleDeleteData()}
        >
          Yes, Delete
        </button>
      </div>
    </div>
  </div>
{/if}
</div>

<style>
  .form-error {
    color: red;
    font-size: 0.85rem;
    margin-top: 2px;
    text-align: left;
  }

  .mr-2 {
    margin-right: 0.5rem !important;
  }

  .mb-2 {
    margin-bottom: 0.5rem !important;
  }

  .ml-2 {
    margin-left: 0.5rem !important;
  }

  .grey-label {
    color: #858796;
    text-align: left;
  }

  .code {
    font-family:
      SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
    font-size: 87.5%;
    color: #e83e8c;
    word-wrap: break-word;
  }
  .table-responsive {
    font-size: 12px;
    display: block;
    overflow-x: auto;
  }

  .submit-btn.danger {
    background-color: #e74c3c;
  }

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

  .action-btn.delete {
    color: #e11d48;
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
  .modal-form input {
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
  .btn-primary {
    color: #fff !important;
    background-color: #4e73df !important;
    border-color: #4e73df !important;
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

  .no-records {
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
    color: #888;
  }
</style>
