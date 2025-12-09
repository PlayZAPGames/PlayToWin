<script>
  import { onMount } from 'svelte'
  import { getToken } from '../lib/auth'
  import toast from 'svelte-french-toast'
  import baseUrl from '../config'
  import { sidebarOpen } from '../stores/sidebar'
  import { STATUS } from '../../../utility/enums'
  import StatsCard from './Components/StatsCard.svelte'
  import Paginations from '../lib/Paginations.svelte'
  import { timeAgo } from '../utils/commonMethods'

  export let params // Provided by the router
  let user = null
  let loading = true

    // Activities
  let activities = []
  let pagination = { page: 1, totalPages: 0, limit: 2, total: 0 }


    async function fetchUser(page = 1) {
    const token = getToken()
    try {
      const res = await fetch(
        `${baseUrl}/api/admin/users/${params.id}?page=${page}&limit=${pagination.limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
      const json = await res.json()
      user = json.data

      // extract activities
      if (user?.activities) {
        activities = user.activities.records || []
        pagination = {
          page: user.activities.pagination.page,
          totalPages: user.activities.pagination.totalPages,
          limit: user.activities.pagination.limit,
          total: user.activities.pagination.total
        }
      }
    } catch (error) {
      console.error('Failed to fetch user', error)
      toast.error('Error loading user data')
    } finally {
      loading = false
    }
  }

  onMount(async () => {

     fetchUser(1)
    // console.log('parms', params)

    // const userId = params.id
    // const token = getToken()

    // try {
    //   // const res = await fetch(`/api/admin/users/${userId}`); // Adjust URL as needed

    //   const res = await fetch(`${baseUrl}/api/admin/users/${userId}`, {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${token}`,
    //     },
    //   })
    //   const data = await res.json()
    //   user = data.data
    // } catch (error) {
    //   console.error('Failed to fetch user', error)
    // } finally {
    //   loading = false
    // }
  })
</script>

<!-- <div class="page-content"> -->
<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>
  {#if loading}
    <p>Loading users...</p>
  {:else if user}
    <div class="container-fluid">
      <div class="user-box">
        <h2>User Details</h2>
        {#if user.imageUrl}
          <p>
            <img
              src={user.imageUrl}
              alt="User profile"
              style="max-height: 100px; max-width: 100px; object-fit: contain; border-radius: 4px;"
            />
          </p>
        {/if}
        <p>ID: {user.id}</p>
        <p>Username: {user.username}</p>
        <p>Slug: {user.slug}</p>
        <p>Social Id: {user.socialId}</p>
        <p>Wallet address : {user.Wallets.pzpEvmWallet}</p>
        <p>Login type: {user.loginType}</p>
        <p>Role: {user.role}</p>
        <p>Status: {STATUS[user.status]}</p>
        <p>Is Blocked: {user.isBlocked ? 'Yes' : 'No'}</p>
        <!-- Add more fields as needed -->
      </div>
      <div class="row text-left">

        <StatsCard title="Virtual1" value={user.virtual1} />
        <StatsCard title="Virtual2" value={user.virtual2} />
        <StatsCard title="Referral Earnings" value={user.referralEarnings} />
        <StatsCard title="Games Played" value={user.gamesPlayed} />
        <StatsCard title="Game Won" value={user.gamesWon} />


      </div>

      <div class="row text-left">
  <h3>Activity</h3>

  {#if loading}
    <p>Loading activity log...</p>
  {:else if activities.length > 0}
    {#each activities as activity}
      <div class="w-100 mb-2">
        <div class="card border-left-primary shadow h-100 py-2 m-top-10">
          <div class="card-body">
            <div class="row no-gutters">
              <div class="col mr-2">
                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                  {activity.activity_type}
                </div>
                <div class="h6 mb-0 font-weight-bold text-gray-800">
                  { JSON.stringify(activity.detail) || 'No details available'}
                  <!-- {#if activity.detail.amount}
                    {activity.detail.operation === 'credit' ? '+' : '-'}
                    {activity.detail.amount} {activity.detail.currency}
                  {:else if activity.detail.message}
                    {activity.detail.message}
                  {:else}
                    (No details)
                  {/if} -->
                </div>
                <div class="text-right">
                  {timeAgo(activity.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/each}

    <!-- Pagination -->
    {#if pagination.totalPages > 1}
    <div class="text-center w-100">
      <Paginations
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => fetchUser(p)}
      />
      </div>

    {/if}

  {:else}
    <div class="no-records">No activity found</div>
  {/if}
</div>



    </div>
  {:else}
    <p>User not found.</p>
  {/if}
</div>

<style>
  .m-top-10 {
    margin-top: 10px;
  }
  .text-right{
    text-align: right;
  }
  .text-center {
    text-align: center;
  }


  .w-100 {
    width: 100% !important;
  }
  .text-xs {
    font-size: 0.7rem;
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

  .col-md-6,
  .col-xl-3 {
    position: relative;
    width: 100%;
    padding-right: 0.75rem;
    padding-left: 0.75rem;
  }
  .mr-2 {
    margin-right: 0.5rem !important;
  }
  .col {
    flex-basis: 0;
    flex-grow: 1;
    max-width: 100%;
  }

  .text-uppercase {
    text-transform: uppercase !important;
  }
  .no-gutters > .col {
    padding-right: 0;
    padding-left: 0;
  }
  .font-weight-bold {
    font-weight: 700 !important;
  }
  .py-2 {
    padding-top: 0.5rem !important;
  }

  .mb-4 {
    margin-bottom: 1.5rem !important;
  }

  @media (min-width: 1200px) {
    .col-xl-3 {
      flex: 0 0 22%;
      max-width: 22%;
    }
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    margin-right: -0.75rem;
    margin-left: -0.75rem;
  }

  .no-gutters {
    margin-right: 0;
    margin-left: 0;
  }

  .border-left-primary {
    border-left: 0.25rem solid #4e73df !important;
  }

  .shadow {
    box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15) !important;
  }
  .card-body {
    flex: 1 1 auto;
    min-height: 1px;
    padding: 1.25rem;
  }
  .user-box {
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
  :global(.svelte-select) {
    background-color: #e3e4e5 !important;
    margin-right: 12px !important;
  }

  :global(.svelte-select .value-container input#game-select) {
    display: none !important;
  }
  .col {
    flex-basis: 0;
    flex-grow: 1;
    max-width: 100%;
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
</style>
