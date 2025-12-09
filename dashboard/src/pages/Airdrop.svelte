<script lang="js">
  import { onMount } from 'svelte'
  import toast from 'svelte-french-toast'
  import baseUrl from '../config'
  import { sidebarOpen } from '../stores/sidebar'
  import { formatDateTimeLocal, toUTCDateTime } from '../utils/commonMethods'
  import { AIRDROP_STATUS } from '../../../utility/enums'

  import { getToken } from '../lib/auth'
  let tableData = []
  let additionalSupply = null
  let loading = true
  let error = null
  let showModal = false
  let selectedRecord = null
  let showDeleteModal = false
  let selectedData = ''
  let dataToDeleteId = null

  let showIntervalModal = false;
  let newAdditionalSupplyValue = additionalSupply;

  // Convert enums to arrays of string values

  const confirmDelete = (data) => {
    selectedData = data.name
    dataToDeleteId = data.id
    showDeleteModal = true
  }

  let formData = {
    name: "",
    total_supply: null,
    status: null,
    start_time: null,
    end_time: null,
  }

  async function fetchData() {
    loading = true
    try {
      const token = getToken()
      const response = await fetch(`${baseUrl}/api/admin/airdrops`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch data')
      const data = await response.json()
      tableData = data.data.seasons
      additionalSupply = data.data.additionalSupply || "0 M"
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  const openAddModal = () => {
    selectedRecord = null
    formData = {
      name: "",
      total_supply: null,
      status: null,
      start_time: null,
      end_time: null,
    }
    showModal = true
  }

  const openEditModal = (data) => {
    console.log('openEditModal', data)
    selectedRecord = data
    formData = {
      name: data.name,
      total_supply: data.total_supply,
      status: data.status,
      start_time: formatDateTimeLocal(data.start_time),
      end_time: formatDateTimeLocal(data.end_time),
    }
    showModal = true
  }

  const handleCreate = async () => {
    const token = getToken()
    const dataToSend = {
      ...formData,
      status: Number(formData.status),
      start_time: toUTCDateTime(formData.start_time),
      end_time: toUTCDateTime(formData.end_time),
    }

    const res = await fetch(`${baseUrl}/api/admin/airdrops`, {
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
      toast.success(response.message);
    } else {
      const error = await res.json()
      console.log('API Error:', error.message)
      toast.error(error.message);
    }
  }

  const handleUpdate = async () => {
    const token = getToken()
    const dataToSend = {
      ...formData,
      status: Number(formData.status),
      start_time: toUTCDateTime(formData.start_time),
      end_time: toUTCDateTime(formData.end_time),
    }
    const res = await fetch(`${baseUrl}/api/admin/airdrops/${selectedRecord.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dataToSend),
    })
    if (res.ok) {
        const response = await res.json();
        showModal = false;
        await fetchData();
        toast.success(response.message);
      } else {
        const error = await res.json();
        toast.error(error.message);
      }
  }

  const handleDeleteRecord = async () => {
    if (!dataToDeleteId) return

    const token = getToken()
    try {
      const res = await fetch(`${baseUrl}/api/admin/airdrops/${dataToDeleteId}`, {
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

  const updateInterval = async () => {
  const token = getToken();
  const res = await fetch(`${baseUrl}/api/admin/airdrops/additionalSupply`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ additionalSupply: newAdditionalSupplyValue }),
  });

  const response = await res.json();
  if (res.ok) {
    toast.success(response.message);
    additionalSupply = newAdditionalSupplyValue;
    showIntervalModal = false;
  } else {
    toast.error(response.message || "Failed to update additionalSupply");
  }
};

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
              <h5 class="m-0 font-weight-bold text-primary">Airdrop</h5>
            </div>
             <div class="">
              Additional Suppply ({additionalSupply})
              <button 
              on:click={() => {
                newAdditionalSupplyValue = additionalSupply;
                showIntervalModal = true;
              }}
              on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  newAdditionalSupplyValue = additionalSupply;
                  showIntervalModal = true;
                }
              }}
              class="link-style"
              tabindex="0"
            >
              Change
            </button>
            </div>
            <div class="">
              <button class="btn btn-primary m-0" on:click={openAddModal}>Add new season</button>
            </div>
          </div>
        </div>

        <div class="card-body table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Total Supply</th>
                <th>Claimed</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each tableData as data}
                <tr>
                  <td>{data?.name}</td>
                  <td>{data?.total_supply}</td>
                  <td>{data?.claimed}</td>
                  <td>{data?.progress != null ? data.progress + ' %' : '0 %'}</td>
                  <td>{AIRDROP_STATUS[data?.status]}</td>
                  <td>{new Date(data?.start_time).toLocaleString()}</td>
                  <td>{new Date(data?.end_time).toLocaleString()}</td>
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
        <label>Name</label>
        <input type="text" bind:value={formData.name} />

        <label>Total Supply</label>
        <input type="number" bind:value={formData.total_supply} />

        <label>Status</label>
        <select bind:value={formData.status} style="margin-right: 12px;">
          <option value={0}>{AIRDROP_STATUS[0]}</option>
          <option value={1}>{AIRDROP_STATUS[1]}</option>
        </select>

        <label>Start Time</label>
        <input type="datetime-local" bind:value={formData.start_time} />

        <label>End Time</label>
        <input type="datetime-local" bind:value={formData.end_time} />

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

  {#if showIntervalModal}
  <div class="modal-backdrop" on:click={() => (showIntervalModal = false)}></div>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <h3>Edit Additional Supply Value</h3>
    </div>
    <form on:submit|preventDefault={updateInterval} class="modal-form">
      <label>Additional Supply</label>
      <input type="test" bind:value={newAdditionalSupplyValue} />

      <button class="submit-btn" type="submit">Update</button>
    </form>
  </div>
{/if}
</div>

<style>

  .link-style {
    color: #4e73df;
    cursor: pointer;
  }

  .action-btn, .link-style{
    padding: 0 !important;
    background-color: transparent !important;
    border: none;
  }
  .action-btn:hover, .link-style{
    border: none !important;
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
    /* transition: margin-left 0.3s ease; */
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

  .container-fluid{
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .card-body {
    flex: 1 1 auto;
    min-height: 1px;
    padding: 1.25rem;
  }


</style>
