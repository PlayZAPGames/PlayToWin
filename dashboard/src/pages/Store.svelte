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
  let filterCategory = 'weapon'
  let selectedRecord = null
  let showModal = false

  let formData = {
    name: '',
    description: '',
    price: null,
    currencyType: 'virtual1',
    type: 'weapon',
    baseLevel: 1,
    maxLevel: 3,
    levels: [
      { level: 1, upgradeCost: 0, stats: {} },
      { level: 2, upgradeCost: 0, stats: {} },
      { level: 3, upgradeCost: 0, stats: {} }
    ]
  }

  const store_options = STORE.map((label) => ({
    label: label.toUpperCase(),
    value: label,
  }))

  const currency_options = [
    { label: 'Virtual 1', value: 'virtual1' },
    { label: 'Virtual 2', value: 'virtual2' }
  ]

  const openAddModal = () => {
    selectedRecord = null;
    formData = {
      name: "",
      description: "",
      price: null,
      currencyType: "virtual1",
      type: "weapon",
      baseLevel: 1,
      maxLevel: 3,
      levels: [
        { level: 1, upgradeCost: 0, stats: {} },
        { level: 2, upgradeCost: 0, stats: {} },
        { level: 3, upgradeCost: 0, stats: {} }
      ]
    };
    showModal = true;
  };

  const openEditModal = (data) => {
    selectedRecord = data;
    formData = {
      name: data.name,
      description: data.description,
      price: data.price,
      currencyType: data.currencyType,
      type: data.type,
      baseLevel: data.baseLevel,
      maxLevel: data.maxLevel,
      levels: data.levels.map(level => ({
        level: level.level,
        upgradeCost: level.upgradeCost,
        stats: level.stats
      }))
    };
    showModal = true;
  };

  const handleCreate = async () => {
    const token = getToken()
    const res = await fetch(`${baseUrl}/api/admin/store/items`, {
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
    const res = await fetch(`${baseUrl}/api/admin/store/items/${selectedRecord.id}`, {
      method: 'PUT',
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

  const handleDelete = async (itemId, itemName) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
      return
    }

    try {
      const token = getToken()
      const res = await fetch(`${baseUrl}/api/admin/store/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const response = await res.json()
        await fetchData()
        toast.success(response.message)
      } else {
        const error = await res.json()
        toast.error(error.message)
      }
    } catch (err) {
      toast.error('Failed to delete item')
    }
  }

  const fetchData = async (page = 1) => {
    try {
      loading = true
      const token = getToken()
      const response = await fetch(`${baseUrl}/api/admin/store/items`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch data')
      const result = await response.json()
      records = result.data.items
    } catch (err) {
      error = err.message
      toast.error(err.message)
    } finally {
      loading = false
    }
  }

  const updateLevelCost = (index, value) => {
    formData.levels[index].upgradeCost = parseInt(value) || 0
  }

  const updateLevelStat = (levelIndex, statKey, value) => {
    formData.levels[levelIndex].stats[statKey] = value
  }


  onMount(async () => {
    fetchData()
  })
</script>

<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>
  {#if loading}
    <p>Loading store items...</p>
  {:else if error}
    <p style="color: red;">{error}</p>
  {:else}
    <div class="container-fluid">
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <div class="row justify-content-between">
            <div class="col-lg-9 pull-right btn text-left">
              <h5 class="m-0 font-weight-bold text-primary">Store Items Management</h5>
            </div>
            <div class="">
              <button class="btn btn-primary m-0" on:click={openAddModal}>Add New Item</button>
            </div>
          </div>
        </div>
        <div class="filters">
          <div class="row m-20 text-left">
            <div class="col-2 small">
              Filter by Type
              <br />
              <select
                style="margin-right: 12px; min-width: 110px;"
                bind:value={filterCategory}
                on:change={() => fetchData()}
              >
                {#each store_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        <div class="card-body table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <!-- <th>Price</th> -->
                <th>Currency</th>
                <th>Levels</th>
                <th>Purchases</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each records.filter(record => !filterCategory || record.type === filterCategory) as record}
                <tr>
                  <td>{record.id}</td>
                  <td>
                    <strong>{record.name}</strong>
                    {#if record.description}
                      <br />
                      <small style="color: #666;">{record.description}</small>
                    {/if}
                  </td>
                  <td>{record.type}</td>
                  <!-- <td>{record.price ?? 'N/A'}</td> -->
                  <td>{record.currencyType}</td>
                  <td>
                    {record.baseLevel} → {record.maxLevel}
                    <br />
                    <small>{record.levels.length} levels</small>
                  </td>
                  <td>{record.totalPurchases}</td>
                  <td>
                    <!-- <div class="action-column">
                      <button class="action-btn" on:click={() => openEditModal(record)} title="Edit">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="action-btn delete-btn" on:click={() => handleDelete(record.id, record.name)} title="Delete">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div> -->

                      <div class="action-column">
                      <span class="action-btn" on:click={() => openEditModal(record)}>
                        <i class="fas fa-pen"></i>
                      </span>
                      <span class="action-btn delete-btn" on:click={() => handleDelete(record.id, record.name)}>
                        <i class="fas fa-trash-alt"></i>
                      </span>
                    </div>

                    
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          {#if records.length === 0}
            <p class="no-records">No store items found</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if showModal}
    <div class="modal-backdrop" on:click={() => (showModal = false)}></div>

    <div class="modal large-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{selectedRecord ? 'Edit Store Item' : 'Create New Store Item'}</h3>
        <button class="close-btn" on:click={() => (showModal = false)}>×</button>
      </div>
      <form
        on:submit|preventDefault={selectedRecord ? handleUpdate : handleCreate}
        class="modal-form"
      >
        <div class="form-section">
          <h4>Basic Information</h4>
          
          <label>Name *</label>
          <input type="text" bind:value={formData.name} required />

          <label>Description</label>
          <textarea bind:value={formData.description} rows="3"></textarea>

          <!-- <label>Type *</label>
          <select bind:value={formData.type} required>
            {#each store_options as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select> -->

          <!-- <div class="row">
            <div class="col-6">
              <label>Base Level</label>
              <input type="number" bind:value={formData.baseLevel} min="1" max="10" />
            </div>
            <div class="col-6">
              <label>Max Level</label>
              <input type="number" bind:value={formData.maxLevel} min="1" max="10" />
            </div>
          </div> -->

          <!-- <div class="row">
            <div class="col-6">
              <label>Price</label>
              <input type="number" bind:value={formData.price} placeholder="Optional" />
            </div>
            <div class="col-6">
              <label>Currency Type</label>
              <select bind:value={formData.currencyType}>
                {#each currency_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div> -->
        </div>

        <div class="form-section">
          <h4>Level Configuration</h4>
          {#each formData.levels as level, index}
            <div class="level-section">
              <h5>Level {level.level}</h5>
              
              <label>Upgrade Cost</label>
              <input 
                type="number" 
                bind:value={level.upgradeCost}
                on:input={(e) => updateLevelCost(index, e.target.value)}
                min="0" 
              />

              <label class="text-center">Stats</label>
              <div class="stats-grid">
                {#each Object.entries(level.stats) as [key, value]}
                  <div class="stat-row">
                    <label class="label">{key}</label>
                    <input 
                      type="text" 
                      value={value} 
                      placeholder="Value"
                      on:input={(e) => updateLevelStat(index, key, e.target.value)}
                    />
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>




        <div class="form-actions">
          <button type="button" class="cancel-btn" on:click={() => (showModal = false)}>Cancel</button>
          <button class="submit-btn" type="submit">
            {selectedRecord ? 'Update Item' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  {/if}
</div>

<style>
  .action-btn.delete {
    color: #e11d48;
  }
  .large-modal {
    width: 600px;
    max-width: 95vw;
  }

  .form-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }

  .form-section h4 {
    margin: 0 0 1rem 0;
    color: #4e73df;
    font-size: 1.1rem;
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

  .level-section {
    background: #f8f9fa;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    border-left: 4px solid #4e73df;
  }

  .level-section h5 {
    margin: 0 0 0.75rem 0;
    color: #333;
  }

  .stats-grid {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .stat-row {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.5rem;
    align-items: center;
  }



  .text-center{
    text-align: center !important;
  }

  .label{
    color: #666;
  }
  .row {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .col-6 {
    flex: 1;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .cancel-btn {
    flex: 1;
    padding: 0.6rem;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .submit-btn {
    flex: 2;
    padding: 0.6rem;
    background-color: #4e73df;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .delete-btn {
    color: #dc3545 !important;
    margin-left: 0.5rem;
  }

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
    scrollbar-width: none;
  }
  .modal::-webkit-scrollbar {
    display: none;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99;
  }
  
  .modal input, .modal select, .modal textarea {
    width: 100%;
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    background: #f8f9fc;
    margin-bottom: 0.75rem;
    box-sizing: border-box;
    color: black;
  }

  .modal-form label {
    text-align: left;
    font-weight: bold;
    color: #3b5bdb;
    display: block;
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .btn-primary {
    color: #fff !important;
    background-color: #4e73df !important;
    border-color: #4e73df !important;
  }

  /* Rest of your existing styles remain the same */
  :global(.flatpickr-wrapper .flatpickr-input) {
    width: 250px !important;
    box-sizing: border-box;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
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