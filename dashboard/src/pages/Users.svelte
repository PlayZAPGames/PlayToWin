<script>
  import { onMount } from 'svelte'
  import toast from 'svelte-french-toast'
  import baseUrl from '../config'
  import { sidebarOpen } from '../stores/sidebar'
  import Paginations from '../lib/Paginations.svelte'
  import { LOGIN_TYPE, STATUS, USER_ROLE } from '../../../utility/enums.js'
  import { debounce } from 'lodash' // or write your own

  import { getToken } from '../lib/auth'
  let users = []
  let pagination = { total: 0, page: 1, limit: 10, totalPages: 1 }
  let loading = true
  let error = null
  let showModal = false
  let selectedRecord = null
  // 🔍 Filters
  let filterSlug = ''
  let filterName = ''
  let filterRole = ''
  let filterLoginType = ''
  let filterStatus = ''

  let formData = {
    username: '',
    loginType: null,
    status: null,
    role: null,
    status: null,
  }

  const status_options = STATUS.map((label, index) => ({
    label,
    value: index,
  }))

  const login_type_options = LOGIN_TYPE.map((label) => ({
    label,
    value: label,
  }))

  const role_options = USER_ROLE.map((label) => ({
    label,
    value: label,
  }))

  const openEditModal = (data) => {
    console.log('openEditModal', data)
    selectedRecord = data
    formData = {
      username: data.username,
      loginType: data.loginType,
      role: data.role,
      status: data.status,
    }
    showModal = true
  }

  const fetchData = async (page = 1) => {
    try {
      const token = getToken()

      const query = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(filterSlug && { slug: filterSlug }),
        ...(filterName && { name: filterName.trim() }),
        ...(filterRole && { role: filterRole }),
        ...(filterLoginType && { loginType: filterLoginType }),
        ...(filterStatus && { status: filterStatus }),
      })

      const response = await fetch(`${baseUrl}/api/admin/users?${query.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) throw new Error('Failed to fetch users')
      const result = await response.json()
      users = result.data.users // ✅ Extract the actual array
      pagination = result.data.pagination
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
  const handleUpdate = async () => {
    const token = getToken()
    const res = await fetch(`${baseUrl}/api/admin/users/${selectedRecord.id}`, {
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


  function viewUser(id) {
    location.hash = `/view-user/${id}`; 
  }

  const debouncedFetch = debounce(fetchData, 400)

  const handleSubmit = () => {
    if (selectedRecord) {
      handleUpdate()
    } else {
      handleCreate()
    }
  }

  onMount(() => {
    fetchData()
  })

  $: debouncedFetch() // reactive call when `filterName` changes

  // ✅ Trigger API call reactively only when filter values change
  $: if (filterSlug !== undefined) debouncedFetch()
  $: if (filterName !== undefined) debouncedFetch()
  $: if (filterRole !== undefined) debouncedFetch()
  $: if (filterLoginType !== undefined) debouncedFetch()
  $: if (filterStatus !== undefined) debouncedFetch()
</script>

<!-- <div class="page-content"> -->
<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>
  {#if loading}
    <p>Loading users...</p>
  {:else if error}
    <p style="color: red;">{error}</p>
  {:else}
    <div class="container-fluid">
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <div class="row justify-content-between">
            <div class="col-lg-9 pull-right btn text-left">
              <h5 class="m-0 font-weight-bold text-primary">Users</h5>
            </div>
            <div class="">
              <!-- <button class="btn btn-primary m-0" on:click={openAddModal}
                >New Match</button
              > -->
            </div>
          </div>
        </div>
        <div class="filters">
          <div class="row">
            <div class="col-2 small game-multi-select">
              Seach by slug
              <br />
              <input
                type="text"
                bind:value={filterSlug}
                class="w-full px-3 py-2 border rounded"
                placeholder="Search by slug"
              />
            </div>

            <div class="col-2 small game-multi-select">
              Filter by Name
              <br />
              <input
                type="text"
                bind:value={filterName}
                class="w-full px-3 py-2 border rounded"
                placeholder="Search by name"
              />
            </div>

            <div class="col-2 small">
              Role
              <br />
              <select style="margin-right: 12px;" bind:value={filterRole}>
                <option value="">Select role</option>
                {#each role_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>

            <div class="col-2 small">
              Platform Type
              <br />
              <select style="margin-right: 12px;" bind:value={filterLoginType}>
                <option value="">Select Type</option>
                {#each login_type_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
            <div class="col-2 small">
              Status
              <br />
              <select style="margin-right: 12px;" bind:value={filterStatus}>
                <option value="">Select Status</option>
                {#each status_options as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
        <div class=" card-body table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Slug</th>
                <th>Username</th>
                <th>loginType</th>
                <th>Role</th>
                <th>Status</th>
                <th>Virtual 1</th>
                <th>Virtual 2</th>
                <th>Games played</th>
                <th>Games won</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each users as user}
                <tr>
                  <td>{user.slug}</td>
                  <td>{user.username ?? '-'}</td>
                  <td>{user.loginType}</td>
                  <td>{user.role}</td>
                  <td>{STATUS[user.status]}</td>
                  <td>{user.virtual1}</td>
                  <td>{user.virtual2}</td>
                  <td>{user.gamesPlayed}</td>
                  <td>{user.gamesWon}</td>
                  <td>
                    <div class="action-column">
                      <span class="action-btn" on:click={() => viewUser(user.id)}>
                        <i class="fas fa-eye"></i>
                      </span>
                      <span class="action-btn" on:click={() => openEditModal(user)}>
                        <i class="fas fa-pen"></i>
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
  {#if showModal}
    <div class="modal-backdrop" on:click={() => (showModal = false)}></div>

    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>{selectedRecord ? 'Edit User' : 'New user'}</h3>
      </div>
      <form on:submit|preventDefault={handleSubmit} class="modal-form">
        <label>Name</label>
        <input type="text" bind:value={formData.username} />

        <!-- <label>Login Type</label>
        <select bind:value={formData.loginType} style="margin-right: 12px;">
          {#each login_type_options as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select> -->

        <label>Status</label>
        <select bind:value={formData.status} style="margin-right: 12px;">
          {#each status_options as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>

        <label>Role</label>
        <select bind:value={formData.role} style="margin-right: 12px;">
          {#each role_options as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>

        <button class="submit-btn" type="submit">Submit</button>
      </form>
    </div>
  {/if}
</div>

<style>

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

  .no-records {
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
    color: #888;
  }
</style>
