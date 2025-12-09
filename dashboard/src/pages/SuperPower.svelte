<script>
  import { onMount } from 'svelte'
  import baseUrl from '../config'
    import toast from 'svelte-french-toast'
  import { sidebarOpen } from '../stores/sidebar'
  import Paginations from '../lib/Paginations.svelte'

  import { STORE } from '../../../utility/enums.js'

  import { getToken } from '../lib/auth'
  let records = []
  let pagination = { total: 0, page: 1, limit: 10, totalPages: 1 }

  let error = null

  let loading = true
  // let filterCategory = 'food'
  let selectedRecord = null
  let showModal = false

  let formData = {
    name: '',
    price: 0,
    isActive: true,
  }


const openAddModal = () => {
  selectedRecord = null;
  formData = {
    name: "",
    price: 0,
    isActive: true,
  };
  showModal = true;
};

const openEditModal = (data) => {
  selectedRecord = data;
  formData = {
    name: data.name,
    // description: data.description,
    price: data.price,
    // type: data.type,
    // imageUrl: data.imageUrl,
    isActive: data.isActive,
    isDefault: data.isDefault,
  };
  showModal = true;
};


  const handleCreate = async () => {
    const token = getToken()
    const res = await fetch(`${baseUrl}/api/admin/super-power`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
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

  const handleUpdate = async () => {
    const token = getToken()
    const res = await fetch(`${baseUrl}/api/admin/super-power/${selectedRecord.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
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

  const fetchData = async (page = 1) => {
    try {
      const token = getToken()
      const response = await fetch(`${baseUrl}/api/admin/super-power`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch data')
      const result = await response.json()
      records = result.data.items // ✅ Extract the actual array
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }

  onMount(async () => {
    fetchData()
  })
</script>

<!-- <div class="page-content"> -->
<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>
  {#if loading}
    <p>Loading powers...</p>
  {:else if error}
    <p style="color: red;">{error}</p>
  {:else}
    <div class="container-fluid">
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <div class="row justify-content-between">
            <div class="col-lg-9 pull-right btn text-left">
              <h5 class="m-0 font-weight-bold text-primary">Super Powers</h5>
            </div>
            <div class="">
              <button class="btn btn-primary m-0" on:click={openAddModal}>Add new power</button>
            </div>
          </div>
        </div>
        <div class=" card-body table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Is Active</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {#each records as record}
                <tr>
                  <td>{record.name}</td>
                  <td>{record.price}</td>
                  <td>{record.isActive}</td>
                  <td>
                    <div class="action-column">
                      <button class="action-btn" on:click={() => openEditModal(record)}>
                        <i class="fas fa-pen"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if records.length === 0}
            <p class="no-records">No records found</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if showModal}
    <div class="modal-backdrop" on:click={() => (showModal = false)}></div>

    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{selectedRecord ? 'Edit Store Item' : 'New Store Item'}</h3>
      </div>
      <form
        on:submit|preventDefault={selectedRecord ? handleUpdate : handleCreate}
        class="modal-form"
      >
        <label>Name</label>
        <input type="text" bind:value={formData.name} />
 
        <label>Price</label>
        <input type="number" bind:value={formData.price} />

        <label>Is Active</label>
        <input type="checkbox" bind:checked={formData.isActive} />

        <button class="submit-btn" type="submit">Submit</button>
      </form>
    </div>
  {/if}
</div>

<style>

    .action-btn{
    padding: 0 !important;
    background-color: transparent !important;
    border: none;
  }
  .action-btn:hover{
    border: none !important;
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

    .btn-primary {
    color: #fff !important;
    background-color: #4e73df !important;
    border-color: #4e73df !important;
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
