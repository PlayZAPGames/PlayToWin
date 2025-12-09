<script>
  import axios from 'axios'
  import { onMount } from 'svelte'
  import baseUrl from '../config'
  import { sidebarOpen } from '../stores/sidebar'
  import Paginations from '../lib/Paginations.svelte'
  import { status } from "../lib/walletUtil";
  import UserLink from "../lib/UserLink.svelte";
  import Address from "../lib/Address.svelte";
  import { debounce } from 'lodash' // or write your own

  import Flatpickr from 'svelte-flatpickr'
  import 'flatpickr/dist/themes/material_blue.css'

  import { getToken } from '../lib/auth'
  let tableData = []
  let pagination = { total: 0, page: 1, limit: 10, totalPages: 1 }

  let error = null

  let loading = true
  let selectedDates = []
  let showDropdown = false
  let activeSelection = 'quick' // Default to quick selection
  let flatpickrInstance = null
  let clickOutsideHandler;
  let filterstatus = '';
  let filterUserId = '';
  let filterTxId = '';
  // Core date state
  let startDate = new Date()
  let endDate = new Date()

const status_options = Object.entries(status).map(([key, value]) => ({
  label: key,  
  value: key, 
}));

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
    fetchData()
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

      fetchData()
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
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }


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

  const fetchData = async (page = 1) => {
    try {
      const token = getToken()

    const body = {
        page: String(page),
        limit: String(pagination.limit),
        startDate: formatDateLocal(startDate),
        endDate: formatDateLocal(endDate),
        status: String(filterstatus),
        userId: String(filterUserId),
        id: String(filterTxId)
    }

      const response = await axios.get(`/api/admin/requests/withdraw`, {
        params: body,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      tableData = response.data.data ; // ✅ Extract the actual array

      
      pagination = response.data.pagination
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

    async function  approve(id) {
    try {
      const token = getToken();

      console.log("Approve id", id);
      console.log("token", token);
      

      const body = {
        txnId: id,
      }

    const response = await axios.post(`/api/admin/withdrawal/approve`, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

      console.log("Approve api response", response.data);
      
      alert(JSON.stringify(response.data))

      fetchData()
    } catch (error) {
      alert(JSON.stringify(error.response.data))
    }
    // return json;
  }
  async function rejected(id) {
    try {
      const token = getToken();

      const body = {
        txnId: id,
      }
      const response = await axios.post(`/api/admin/withdrawal/reject`,body,{
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      })
      alert(JSON.stringify(response.data))

      fetchData()
    } catch (error) {
      alert(JSON.stringify(error.response.data))
    }
    // return json;
  }
  // async function success(id) {
  //   try {
  //     const response = await axios.get(`/api/admin/withdrawal/success/${id}`)
  //     alert(JSON.stringify(response.data))

  //     fetchData()
  //   } catch (error) {
  //     alert(JSON.stringify(error.response.data))
  //   }
  //   // return json;
  // }
  
  const debouncedFetch = debounce(fetchData, 400)


  onMount(async() => {
    setDefaultThisWeek()
    setupClickOutsideHandler()
    fetchData()
    

    return () => {
      if (clickOutsideHandler) {
        document.removeEventListener('click', clickOutsideHandler)
      }
    }
  })

    $: debouncedFetch() // reactive call when `filterName` changes

   $: if (filterUserId !== undefined) debouncedFetch()
   $: if (filterTxId !== undefined) debouncedFetch()
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
              <h5 class="m-0 font-weight-bold text-primary">Withdrawals</h5>
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

            <div class="col-2 small">
               Select Status
              <br />
              <select class="w-full"
                style="margin-right: 12px; min-width: 110px;"
                bind:value={filterstatus}
                on:change={() => fetchData(pagination.page)}
              >
              <option value="">Select Status</option>
                {#each status_options as option}
                  <option value={option.label}>{option.label}</option>
                {/each}
              </select>
            </div>
            <div class="col-2 small mr-12">
              Slug/Transaction id
              <br />
              <input
                type="text"
                bind:value={filterTxId}
                class="w-full px-3 py-2 border rounded"
              />
            </div>
            <div class="col-2 small">
              User id
              <br />
              <input
                type="text"
                bind:value={filterUserId}
                class="w-full px-3 py-2 border rounded"
              />
            </div>


          </div>
        </div>
        <div class=" card-body table-wrapper">
          <table>
      <tr>
        <th>id</th>
        <th>Username</th>
        <th>Amount </th>
        <th>Reciever Address / Response</th>
        <th>Tx hash/Response</th>
        <th>Status</th>
        <th>Date</th>
        <th>Actions</th>
      </tr>
      {#each tableData as item, index}
        <tr class="value">
          <td>{item.id}</td>
          <td>
            <UserLink {item} />
          </td>
          <td>
            {item.amount}
          </td>
          <td style="text-align: left;">
            <pre>

            <Address receiver={item.to_address} />
            {item.to_address.substring(0, 10) +
                '...' +
                item.to_address.substring(item.to_address.length - 10, item.to_address.length)}
            </pre>
          </td>
          <td style="text-align: left;">
            <pre style="white-space: pre-wrap">
                  {#if item.transaction_hash !== null}
                <Address
                  receiver={item.transaction_hash}
                />
                  {item.transaction_hash.substring(0, 15) +
                  '...' +
                  item.transaction_hash.substring(
                    item.transaction_hash.length - 15,
                    item.transaction_hash.length,
                  )}
              {/if}
                </pre>
          </td>
          <td>{item.status}</td>
          <td>{new Date(item.createdAt).toString()}</td>
          <td class="actions">
            {#if item.status === 'failed'}
              <button
                on:click={() => {
                  approve(item.id)
                }}>Reinit</button
              >
            {:else if item.status == 'pending'}
              <button
                on:click={() => {
                  approve(item.id)
                }}>Approve</button
              >
              <!-- <hr />
              <button
                on:click={() => {
                  success(item.id)
                }}>Success</button
              > -->
              <hr />
              <button
                on:click={() => {
                  rejected(item.id)
                }}>Reject</button
              >
            {/if}
          </td>
        </tr>
      {:else}
        <span>No data found.</span>
      {/each}
    </table>
          {#if pagination.totalPages > 0}
            <Paginations
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => {
                pagination.page = p
                fetchData(p) // or fetchGames(p)
              }}
            />
          {:else}
            <div class="no-records">No records found</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  button {
    text-align: left;
    color: #5a5c69;
    background-color: transparent;
    width: 100%;
  }
  button:hover {
    background-color: #99c8ff;
  }
  .w-full {
    width: 90%;
  }
  .game-multi-select {
    min-width: 150px;
    margin-right: 12px;
  }
  .mr-12 {
    margin-right: 12px !important;
  }
  .quick-options-dropdown {
    width: 250px;
    background: #e3e4e5;
  }

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

  td:last-child {
    white-space: nowrap;
    width: 1%;
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

  .no-records {
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
    color: #888;
  }
</style>
