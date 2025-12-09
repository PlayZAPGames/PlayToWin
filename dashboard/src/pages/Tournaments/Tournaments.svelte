<script lang="ts">
  import { onMount } from 'svelte'
  import Select from 'svelte-select'
  import baseUrl from '../../config'
  import { sidebarOpen } from '../../stores/sidebar'
  import {
    event_status,
    platform_type,
    select_play_type,
    entry_type,
    get_play_type,
  } from '../../../../utils/enums'

  import Paginations from '../../lib/Paginations.svelte'
  import { getToken } from '../../lib/auth'
  let data: any[] = []
  let loading = true
  let error: string | null = null
  let pagination = { total: 0, page: 1, limit: 10, totalPages: 1 }
  let showGameModal = false
  let selectedEvent: any = null
  let showDeleteModal = false
  let selectedEventName = ''
  let eventToDeleteId: any = null

  const platform_type_options = Object.entries(platform_type)
    .filter(([key]) => isNaN(Number(key)))
    .map(([label]) => ({
      label,
      value: platform_type[label as keyof typeof platform_type],
    }))

  const select_play_type_options = Object.entries(select_play_type)
    .filter(([key]) => isNaN(Number(key)))
    .map(([label]) => ({
      label,
      value: select_play_type[label as keyof typeof select_play_type],
    }))

  const select_fee_type_options = Object.entries(entry_type)
    .filter(([key]) => isNaN(Number(key)))
    .map(([label]) => ({
      label,
      value: entry_type[label as keyof typeof entry_type],
    }))

  const confirmDeleteEvent = (game) => {
    selectedEventName = game.name
    eventToDeleteId = game.id
    showDeleteModal = true
  }

  let formData = {
    name: '',
    status: 0,
    game_id: null,
  }

  let filters = {
    game_ids: [],
    match: 'null',
    play_type: 'null',
    type: 'live',
    platform_type: 'null',
    status: '0',
    fee_type: 'null',
  }

  let gameOptions: { value: number; label: string }[] = []
  let matchOptions: { id: number; name: string }[] = []

  async function fetchEvents(page = 1) {
    loading = true
    try {
      const token = getToken()
      const params = new URLSearchParams()

      // Basic pagination
      params.append('page', String(page))
      params.append('limit', String(pagination.limit))

      // Game IDs (array to comma-separated)
      const selectedGameIds = filters.game_ids?.map((item) => item.value) || []

      if (selectedGameIds.length) {
        params.append('game_ids', selectedGameIds.join(','))
      }

      // Other filters
      if (filters.match !== 'null') params.append('match', filters.match)
      if (filters.play_type !== 'null') params.append('play_type', filters.play_type)
      if (filters.type !== 'null') params.append('type', filters.type)
      if (filters.platform_type !== 'null') params.append('platform_type', filters.platform_type)
      if (filters.status !== '') params.append('status', filters.status)
      if (filters.fee_type !== 'null') params.append('fee_type', filters.fee_type)

      console.log('query', params.toString())
      const response = await fetch(`${baseUrl}/api/admin/tournaments?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch events')
      const res = await response.json()
      data = res.data

      pagination = res.pagination
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  async function fetchGameOptions() {
    try {
      const token = getToken()
      const res = await fetch(`${baseUrl}/api/admin/games-all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      // Convert to svelte-select format
      gameOptions = (data.games || []).map((game) => ({
        value: Number(game.id), // ensure it's a number
        label: game.name,
      }))
    } catch (err) {
      console.error('Failed to fetch game list', err)
    }
  }
  async function fetchMatchOptions() {
    try {
      const token = getToken()
      const res = await fetch(`${baseUrl}/api/admin/events/tournament-match-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      matchOptions = data.events || []
    } catch (err) {
      console.error('Failed to fetch matches list', err)
    }
  }

  const openAddModal = () => {
    selectedEvent = null
    formData = {
      name: '',
      status: 0,
      game_id: null,
    }
    showGameModal = true
  }

  const openEditModal = (event) => {
    selectedEvent = event
    formData = {
      name: event.name,
      status: event.status,
      game_id: event.game_id, // assuming this is the field
    }
    showGameModal = true
  }

  const handleCreateGame = async () => {
    const token = getToken()
    const res = await fetch(`${baseUrl}/api/admin/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      showGameModal = false
      await fetchEvents(pagination.page)
    }
  }

  const handleUpdateEvent = async () => {
    const token = getToken()
    const res = await fetch(`${baseUrl}/api/admin/events/${selectedEvent.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    })
    if (res.ok) {
      showGameModal = false
      await fetchEvents(pagination.page)
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDeleteId) return

    const token = getToken()
    try {
      const res = await fetch(`${baseUrl}/api/admin/events/${eventToDeleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data?.msg || 'Failed to delete game')
      } else {
        showDeleteModal = false
        await fetchEvents(pagination.page)
      }
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Something went wrong while deleting the game.')
    }
  }

  const handleSubmit = () => {
    if (selectedEvent) {
      handleUpdateEvent()
    } else {
      handleCreateGame()
    }
  }

  // href={`#/admin/tournament/${d.id}/tournament_rewards?page=${pagination.page}`}
  function goToRewards(t: any, p: any) {
    sessionStorage.setItem('selectedTournament', JSON.stringify(t?.tournament_infos[0]))
    window.location.href = `#/admin/tournament/${t.id}/tournament_rewards?page=${p}`
  }

  onMount(async () => {
    fetchEvents()
    fetchGameOptions()
    fetchMatchOptions()
  })
</script>

<!-- <div class="page-content"> -->
<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>
  {#if loading}
    <p>Loading tournaments...</p>
  {:else if error}
    <p style="color: red;">{error}</p>
  {:else}
    <div class="container-fluid">
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <div class="row justify-content-between">
            <div class="col-lg-9 pull-right btn text-left">
              <h5 class="m-0 font-weight-bold text-primary">Tournaments</h5>
            </div>
            <div class="">
              <button class="btn btn-primary m-0" on:click={openAddModal}>New Match</button>
            </div>
          </div>
        </div>
        <div class="filters">
          <div class="row">
            <div class="col-2 small game-multi-select">
              Filter by Game
              <br />
              <Select
                id="game-select"
                items={gameOptions}
                bind:value={filters.game_ids}
                multiple={true}
                placeholder="All Games"
                searchable={false}
                clearable={false}
              />
            </div>
            <div class="col small">
              Match
              <br />
              <select class="form-control form-control-sm" bind:value={filters.match}>
                <option value="null">Select all</option>
                {#each matchOptions as option}
                  <option value={option.name}>{option.name}</option>
                {/each}
              </select>
            </div>
            <div class="col-2 small">
              Play Type
              <br />
              <select bind:value={filters.play_type} style="margin-left: 12px; margin-right: 12px;">
                <option value="null">Select Type</option>
                {#each select_play_type_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            <div class="col-2 small">
              Type
              <br />
              <select bind:value={filters.type} style="margin-right: 12px;">
                <option value="live">Live</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div class="col-2 small">
              Platform Type
              <br />
              <select bind:value={filters.platform_type} style="margin-right: 12px;">
                <option value="null">Select Type</option>
                {#each platform_type_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>
          <div class="row">
            <div class="col-2 small">
              Status
              <br />
              <select bind:value={filters.status} style="margin-right: 12px;">
                <option value="0">Active</option>
                <option value="1">Inactive</option>
              </select>
            </div>

            <div class="col-2 small">
              Fee Type
              <br />
              <select bind:value={filters.fee_type} style="margin-right: 12px;">
                <option value="null">All</option>
                {#each select_fee_type_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            <div class="col-2 small">
              <br />
              <button class="btn btn-sm btn-primary" on:click={() => fetchEvents(1)}
                >Apply Filters</button
              >
            </div>
          </div>
        </div>

        <div class="card-body table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Game Name</th>
                <th>Platform</th>
                <th>Match Name</th>
                <th>Status</th>
                <th>Auto Reschedule</th>
                <th>Start/End</th>
                <th>Entry Fee</th>
                <th>Room Count</th>
                <th>Price Pool</th>
                <th>Paid to Winner</th>
                <th>Playzap %</th>
                <th>Group %</th>
                <th colspan="3" style="text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each data as d}
                <tr>
                  <td>{d?.events?.games?.name}</td>
                  <td>{platform_type[d.platform_type]}</td>
                  <td>
                    {d?.events?.name}
                    <br />
                    <span class="code">
                      Active
                      <br />
                      {get_play_type[d?.play_type]}
                    </span>
                  </td>
                  <td>
                    {event_status[d.status]}
                    <br />
                    <span class="code">
                      0 -
                      <br />
                      {d?.virtual_chains?.chains?.name}
                    </span>
                  </td>

                  <td>{d?.auto_reschedule}</td>
                  <td>{(d?.start_from, d?.end_at)}</td>
                  <td>{@html d?.entry_fees.replace(/\n/g, '<br>')}</td>
                  <td>{d?.roomCount}</td>
                  <td> {@html d?.price_pool.replace(/\n/g, '<br>')}</td>
                  <td> {@html d?.paid_to_winner}</td>
                  <td></td>
                  <td></td>

                  <!-- href={`#/admin/tournament/${d.id}/tournament_rewards?page=${pagination.page}`} -->
                  <td>
                    <a on:click={() => goToRewards(d, pagination.page)} class="btn btn-link btn-sm">
                      Reward
                    </a>
                  </td>
                  <td>
                    {#if d.play_type == '0'}
                      <a
                        class="btn btn-link btn-sm"
                        href={`#/admin/tournament/${d.id}/room/${d.rooms?.[0]?.id}/user_tournaments?page=${pagination.page}`}
                      >
                        Participants
                      </a>
                    {:else}
                      <a
                        class="btn btn-link btn-sm"
                        href={`#/admin/tournament/${d.id}/rooms?page=${pagination.page}`}
                      >
                        Rooms
                      </a>
                    {/if}
                  </td>

                  <td>
                    <div class="action-column">
                      <span class="action-btn" on:click={() => openEditModal(d)}>
                        <i class="fas fa-pen"></i>
                      </span>
                      <span class="action-btn delete" on:click={() => confirmDeleteEvent(d)}>
                        <i class="fas fa-trash-alt"></i>
                      </span>
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
                fetchEvents(p) // or fetchGames(p)
              }}
            />
          {:else}
            <div class="no-records">No records found</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  {#if showGameModal}
    <div class="modal-backdrop" on:click={() => (showGameModal = false)}></div>

    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{selectedEvent ? 'Edit Game' : 'New Game'}</h3>
      </div>
      <form on:submit|preventDefault={handleSubmit} class="modal-form">
        <label>Name</label>
        <input bind:value={formData.name} placeholder="Enter name" required />

        <label>Select Game</label>
        <select bind:value={formData.game_id} required>
          <option value="" disabled selected>Select game</option>
          <!-- {#each gameOptions as game}
            <option value={game.id}>{game.name}</option>
          {/each} -->
        </select>

        <label>Status</label>
        <select bind:value={formData.status}>
          <!-- {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each} -->
        </select>

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
        <p>
          Are you sure you want to delete <strong>{selectedEventName}</strong>?
        </p>
        <button class="submit-btn danger" on:click={handleDeleteEvent}>Yes, Delete</button>
      </div>
    </div>
  {/if}
</div>

<style>
  a {
    font-size: 12px !important;
    color: #4e73df !important;
    text-decoration: none !important;
    background-color: transparent !important;
  }

  .code {
    font-size: 87.5%;
    color: #e83e8c;
    word-wrap: break-word;
  }

  select {
    width: -webkit-fill-available;
  }

  .game-multi-select {
    margin-right: 12px;
  }

  :global(.svelte-select) {
    background-color: #e3e4e5 !important;
    margin-right: 12px !important;
  }

  :global(.svelte-select .value-container input#game-select) {
    display: none !important;
  }

  .col-2 {
    flex: 0 0 16.66667%;
    max-width: 16.66667%;
  }

  .filters {
    margin-left: 20px;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid #e3e6f0;
    text-align: left;
  }

  .submit-btn.danger {
    background-color: #e74c3c;
  }

  .action-column {
    display: flex;
    justify-content: flex-start; /* align icons to the left */
    align-items: center;
    gap: 25px;
    width: 100%;
  }

  td:last-child {
    white-space: nowrap;
    width: 1%;
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

  .col {
    flex-basis: 0;
    flex-grow: 1;
    max-width: 100%;
  }

  .form-control {
    display: block;
    margin-right: 12px;
    width: 100%;
    height: calc(1.5em + 0.75rem + 2px);
    padding: 0.375rem 0.75rem;
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #6e707e;
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
    font-size: 12px;
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
