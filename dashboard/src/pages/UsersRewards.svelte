<script lang="ts">
  import { onMount } from "svelte";
  import baseUrl from '../config';
  import { sidebarOpen } from "../stores/sidebar";
  import toast from 'svelte-french-toast';
  import { getToken } from "../lib/auth";
  let rewards: any[] = [];
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
    const token = getToken();

      const response = await fetch(`${baseUrl}/api/admin/user-rewards`,{
         headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      }
    });
      if (!response.ok) throw new Error("Failed to fetch user rewards");
      const data = await response.json();
      rewards = data?.data?.rewards; // ✅ Extract the actual array


    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });


  async function approveReward(id: number) {
  try {
    const response = await fetch(`/api/rewards/${id}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Failed to approve reward");
    }

    toast.success("Reward approved!");
    
    // Optional: Update local reward status
    rewards = rewards.map(r =>
      r.id === id ? { ...r, status: "approved" } : r
    );
  } catch (err) {
    toast.error(err.message);
  }
}


</script>



<!-- <div class="page-content"> -->
<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>

  {#if loading}
    <p>Loading users rewards...</p>
  {:else if error}
    <p style="color: red;">{error}</p>
  {:else}
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User Name</th>
            <th>Amout</th>
            <th>Status</th>
            <th>Draw date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {#each rewards as reward}
            <tr>
              <td>{reward.id}</td>
              <td>{reward.user_name ?? '-'}</td>
              <td>{reward.amount}</td>
              <td>{reward.status}</td>
              <td>{reward.draw_date}</td>
               <td>
                {#if reward.status !== 'approved'}
                  <button on:click={() => approveReward(reward.id)} class="approve-btn">
                    Approve
                  </button>
                {:else}
                  ✅
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>


<style>


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

  th, td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  .approve-btn {
  padding: 4px 8px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.9rem;
}

.approve-btn:hover {
  background-color: #218838;
}

</style>
