<script>
  import { onMount } from 'svelte'
  import { getToken } from '../lib/auth'
  import toast from 'svelte-french-toast'
  import baseUrl from '../config'
  import { sidebarOpen } from '../stores/sidebar'
  import { STATUS } from '../../../utility/enums'
  import Flatpickr from 'svelte-flatpickr'
  import 'flatpickr/dist/themes/material_blue.css'

  import StatsCard from './Components/StatsCard.svelte'

  let data = null
  let loading = true
  let selectedDates = []
  let showDropdown = false
  let activeSelection = 'quick' // Default to quick selection
  let flatpickrInstance = null
  let clickOutsideHandler

  // Core date state
  let startDate = new Date()
  let endDate = new Date()

  function formatDate(date) {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })
  }

  // Set default to "This Week"
  function setDefaultThisWeek() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    startDate = new Date(today)
    startDate.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6) // End of week (Saturday)
  }

  // Handle quick ranges
  function selectQuickRange(type) {
    activeSelection = 'quick'
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (type) {
      case 'today':
        startDate = new Date(today)
        endDate = new Date(today)
        break
      case 'thisWeek':
        setDefaultThisWeek()
        break
      case 'thisMonth':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        break
      case 'last7':
        startDate = new Date(today)
        startDate.setDate(today.getDate() - 6)
        endDate = new Date(today)
        break
    }

    selectedDates = []
    showDropdown = false
    fetchUserData()
  }

  // Handle custom date range
  function handleCustomChange(dates) {    
    if (dates && dates.length === 2) {
      activeSelection = 'custom'
      startDate = new Date(dates[0])
      endDate = new Date(dates[1])

      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)

      if (flatpickrInstance) {
        flatpickrInstance.altInput.value = `${formatDate(startDate)} - ${formatDate(endDate)}`
      }

      fetchUserData()
    }
  }

  // Close dropdown when clicking outside
  function setupClickOutsideHandler() {
    clickOutsideHandler = (e) => {
      if (!e.target.closest('.quick-options-container')) {
        showDropdown = false
      }
    }
    document.addEventListener('click', clickOutsideHandler)
  }

  function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}



  // Call API with selected range
  async function fetchUserData() {
    const token = getToken()
    try {
      const res = await fetch(
        `${baseUrl}/api/admin/dashboard?startDate=${formatDateLocal(startDate)}&endDate=${formatDateLocal(endDate)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      )
      const result = await res.json()
      data = result.data
    } catch (error) {
      console.error('Failed to fetch user', error)
      toast.error('Failed to fetch data')
    } finally {
      loading = false
    }
  }

  // Destructure the data for easier access
  $: usersData = data?.users || {}
  $: gamesData = data?.games || {}
  $: currencyData = data?.currency || {}

  // Flatpickr options
  const flatpickrOptions = {
    mode: 'range',
    dateFormat: 'Y-m-d',
    // altFormat: 'F j, Y',
    altInput: true,
    altFormat: 'd M y', // e.g. "01 Jun 2025"
    conjunction: ' - ',
    showMonths: 2,
    defaultDate: [startDate, endDate],
    onChange: (selectedDates) => {
      handleCustomChange(selectedDates)
    },
  }

  onMount(() => {
    setDefaultThisWeek()
    setupClickOutsideHandler()
    fetchUserData()

    return () => {
      if (clickOutsideHandler) {
        document.removeEventListener('click', clickOutsideHandler)
      }
    }
  })
</script>

<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>
  {#if loading}
    <p>Loading data...</p>
  {:else if data}
    <div class="container-fluid">
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <div class="row justify-content-between">
            <div class="col-lg-9 pull-right btn text-left">
              <h5 class="m-0 font-weight-bold text-primary">Dashboard</h5>
            </div>
          </div>
        </div>

        <div class="filters">
          <div class="row m-20 text-left">
            <!-- Quick Option Input -->
            <div class="col-2 h-0 small game-multi-select quick-options-container">
              Quick Options
              <br />
              <input
                type="text"
                readonly
                value={activeSelection === 'quick'
                  ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                  : 'Select Quick Range'}
                class="border p-2 w-full cursor-pointer"
                on:click={() => (showDropdown = !showDropdown)}
              />

              {#if showDropdown}
                <div class="flex flex-col mt-2 quick-options-dropdown">
                  <button class="p-2 hover:bg-gray-100" on:click={() => selectQuickRange('today')}
                    >Today</button
                  >
                  <button
                    class="p-2 hover:bg-gray-100"
                    on:click={() => selectQuickRange('thisWeek')}>This Week</button
                  >
                  <button
                    class="p-2 hover:bg-gray-100"
                    on:click={() => selectQuickRange('thisMonth')}>This Month</button
                  >
                  <button class="p-2 hover:bg-gray-100" on:click={() => selectQuickRange('last7')}
                    >Last 7 Days</button
                  >
                </div>
              {/if}
            </div>

            <!-- Custom Range Picker -->
            <div class="col-2 small game-multi-select">
              Custom Range
              <br />
              <div class="p-2 flatpickr-wrapper">
                <Flatpickr
                  options={flatpickrOptions}
                  bind:value={selectedDates}
                  bind:flatpickr={flatpickrInstance}
                />
              </div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h2>User Details</h2>
          <div class="row text-left">
            <!-- Users Section -->
            {#if usersData && Object.keys(usersData).length > 0}
              <StatsCard title="Total Users" value={usersData.totalUsers} />
              <StatsCard title="Active Users" value={usersData.activeUsers} />
              <StatsCard title="Inactive Users" value={usersData.inactiveUsers} />
              <StatsCard title="Super Users" value={usersData.superUsers} />
              <StatsCard title="Blocked Users" value={usersData.blockedUsers} />
            {/if}
          </div>

          <h2>Games</h2>
          <!-- Games Section -->
          {#if gamesData && Object.keys(gamesData).length > 0}
            <StatsCard title="Total Games Played" value={gamesData.totalGamesPlayed} />
          {/if}

          <!-- <h2>User Details</h2> -->
          <!-- Currency Section -->
          <!-- {#if currencyData && Object.keys(currencyData).length > 0}
              <StatsCard title="Total Virtual Currency 1" value={currencyData.totalVirtual1} />
              <StatsCard title="Total Virtual Currency 2" value={currencyData.totalVirtual2} />
            {/if} -->
        </div>
      </div>
    </div>
  {:else}
    <p>Record not found.</p>
  {/if}
</div>

<style>
  /* Use :global so Svelte's scoping doesn't prevent the rule from matching the dynamically created altInput */
  :global(.flatpickr-wrapper .flatpickr-input) {
    width: 250px !important;
    box-sizing: border-box;
    white-space: nowrap; /* don't wrap the range text */
    overflow: hidden;
    text-overflow: ellipsis; /* show ... if it overflows */
  }
  .text-left {
    text-align: left;
  }

  .m-20 {
    margin: 20px !important;
  }
  .h-0 {
    height: 0px;
    z-index: 9;
  }

  /* :global(.flatpickr-alt-input) {
    text-align: left;
    font-family: inherit;
    cursor: pointer;
    border: 1px solid #ced4da;
    padding: 0.375rem 0.75rem;
    border-radius: 0.25rem;
    width: 100%;
    background-color: white;
  } */

  .w-full {
    width: 90%;
  }

  /* Existing styles for your page */
  .page-content {
    transition: margin-left 0.3s ease;
    padding: 20px;
    min-height: 100vh;
    background-color: #f8f9fc;
  }

  .sidebar-open {
    margin-left: 250px;
  }

  .sidebar-closed {
    margin-left: 0;
  }

  .container-fluid {
    padding: 0;
  }

  .info-section {
    background: white;
    padding: 15px;
    border-radius: 5px;
    margin-bottom: 20px;
    box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15);
  }

  .card {
    border-radius: 0.35rem;
  }

  .text-primary {
    color: #4e73df !important;
  }

  .shadow {
    box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.1) !important;
  }

  .mb-4 {
    margin-bottom: 1.5rem !important;
  }

  .text-primary {
    color: #4e73df !important;
  }
  .font-weight-bold {
    font-weight: 700 !important;
  }
  .text-left {
    text-align: left;
  }

  .font-weight-bold {
    font-weight: 700 !important;
  }

  .mb-4 {
    margin-bottom: 1.5rem !important;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    margin-right: -0.75rem;
    margin-left: -0.75rem;
  }

  .info-section {
    font-family:
      Nunito,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      Roboto,
      'Helvetica Neue',
      Arial,
      sans-serif,
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Color Emoji';
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
    color: #858796;
    text-align: left;
  }

  /* :global(.svelte-select) {
    background-color: #e3e4e5 !important;
    margin-right: 12px !important;
  } */

  :global(.svelte-select .value-container input#game-select) {
    /* display: none !important; */
  }

  .page-content.sidebar-closed {
    margin-left: 0;
  }

  .page-content {
    margin-left: 0;
    transition: all 0.3s ease;
    padding: 20px;
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

  .card-header {
    padding: 0.75rem 1.25rem;
    margin-bottom: 0;
    background-color: #f8f9fc;
    border-bottom: 1px solid #e3e6f0;
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid #e3e6f0;
    border-radius: 0.35rem;
  }
  .justify-content-between {
    justify-content: space-between !important;
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

  .container-fluid {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .game-multi-select {
    min-width: 250px;
    margin-right: 12px;
  }
  .quick-options-dropdown {
    width: 250px;
    background: #e3e4e5;
  }
  button {
    text-align: left;
    color: #5a5c69;
    background-color: transparent;
    width: 100%;
  }
  button:hover {
    background-color: #99c8ff;
  }
</style>
