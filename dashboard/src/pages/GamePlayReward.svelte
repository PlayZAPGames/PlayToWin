<script lang="ts">
  import { onMount } from "svelte";
  import baseUrl from "../config";
  import { sidebarOpen } from "../stores/sidebar";
  import { platform_type, game_status, ios_status, game_tag } from "../../../utils/enums";

  import Paginations from "../lib/Paginations.svelte";
  import { getToken } from "../lib/auth";
  let games: any[] = [];
  let loading = true;
  let error: string | null = null;
  let pagination = { total: 0, page: 1, limit: 10, totalPages: 1 };
  let showGameModal = false;
  let selectedGame: any = null;
  let showDeleteModal = false;
  let selectedGameName = "";
  let gameToDeleteId: any = null;


// Convert enums to arrays of string values
const platformOptions = Object.entries(platform_type)
  .filter(([key, value]) => isNaN(Number(key)))
  .map(([label, _]) => ({
    label,
    value: platform_type[label as keyof typeof platform_type],
  }));

const statusOptions = Object.entries(game_status)
  .filter(([key]) => isNaN(Number(key)))
  .map(([label]) => ({
    label,
    value: game_status[label as keyof typeof game_status],
  }));

const iosStatusOptions = Object.entries(ios_status)
  .filter(([key]) => isNaN(Number(key)))
  .map(([label]) => ({
    label,
    value: ios_status[label as keyof typeof ios_status],
  }));

  const tagOptions = Object.entries(game_tag)
  .filter(([key]) => isNaN(Number(key)))
  .map(([label]) => ({
    label,
    value: game_tag[label as keyof typeof game_tag],
  }))

  const confirmDeleteGame = (game) => {

    console.log("game", game);
    console.log("selectedGame", selectedGame);
    
  selectedGameName = game.name;
  gameToDeleteId = game.id;
  showDeleteModal = true;

  


};



  let formData = {
    name: "",
    platform_type: 0,
    status: 0,
    ios_status: 0,
    rank: null,
    tag: null,
    points_diff: null,
  };

  async function fetchGames(page = 1) {
    loading = true;
    try {
      const token = getToken();
      const response = await fetch(
        `${baseUrl}/api/admin/games?page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
       const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to fetch games.");
      }

    games = data.games;
    pagination = data.pagination;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  const openAddModal = () => {
    selectedGame = null;
    formData = {
      name: "",
      platform_type: 0,
      status: 0,
      ios_status: 0,
      rank: null,
      tag: null,
      points_diff: null,
    };
    showGameModal = true;
  };

  const openEditModal = (game) => {
    selectedGame = game;
    formData = {
      name: game.name,
      platform_type: game.platform_type,
      status: game.status,
      ios_status: game.ios_status,
      rank: game.rank,
      tag: game.tag,
      points_diff: game.points_diff
    };
    showGameModal = true;
  };


  const handleCreateGame = async () => {
    const token = getToken();
    const res = await fetch(`${baseUrl}/api/admin/game`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      showGameModal = false;
      await fetchGames(pagination.page);
    }
  };

  const handleUpdateGame = async () => {
    const token = getToken();
    const res = await fetch(`${baseUrl}/api/admin/game/${selectedGame.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      showGameModal = false;
      await fetchGames(pagination.page);
    }
  };

  
const handleDeleteGame = async () => {
  if (!gameToDeleteId) return;

  const token = getToken();
  try {
    const res = await fetch(`${baseUrl}/api/admin/game/${gameToDeleteId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data?.msg || "Failed to delete game");
    } else {
      showDeleteModal = false;
      await fetchGames(pagination.page);
    }
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Something went wrong while deleting the game.");
  }
};


  const handleSubmit = () => {
    if (selectedGame) {
      handleUpdateGame();
    } else {
      handleCreateGame();
    }
  };

  onMount(async () => {
    fetchGames();
  });
</script>

<!-- <div class="page-content"> -->
<div
  class="page-content"
  class:sidebar-open={$sidebarOpen}
  class:sidebar-closed={!$sidebarOpen}
>
  {#if loading}
    <p>Loading games...</p>
  {:else if error}
    <p style="color: red;">{error}</p>
  {:else}
    <div class="container-fluid">
      <div class="card shadow mb-4">
        <div class="card-header py-3">
          <div class="row justify-content-between">
            <div class="col-lg-9 pull-right btn text-left">
              <h5 class="m-0 font-weight-bold text-primary">Games</h5>
            </div>
            <div class="">
              <button class="btn btn-primary m-0" on:click={openAddModal}
                >New Game</button
              >
            </div>
          </div>
        </div>

        <div class="card-body table-wrapper">
          <table>
            <thead>
              <tr>
                <!-- <th>ID</th> -->
                <th>Name</th>
                <th>Platform</th>
                <th>Status</th>
                <th>Ios Status</th>
                <th>Rank</th>
                <th>key</th>
                <th>tag</th>
                <th>Points Diff</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each games as game}
                <tr>
                  <!-- <td>{game.id}</td> -->
                  <td>{game.name ?? "-"}</td>
                  <td>{platform_type[game.platform_type]}</td>
                  <td>{game_status[game.status]}</td>
                  <td>{ios_status[game.ios_status]}</td>
                  <td>{game.rank}</td>
                  <td>{game?.key ?? ""}</td>
                  <td>{game.tag ?? ""}</td>
                  <td>{game.points_diff ?? ""}</td>
                  <td>
                    <div class="action-column">
                      <span class="action-btn" on:click={() => openEditModal(game)}>
                        <i class="fas fa-pen"></i>
                      </span>
                      <span class="action-btn delete" on:click={() => confirmDeleteGame(game)}>
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
                pagination.page = p;
                fetchGames(p);
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
        <h3>{selectedGame ? "Edit Game" : "New Game"}</h3>
      </div>
      <form on:submit|preventDefault={handleSubmit} class="modal-form">
        <label>Name</label>
        <input bind:value={formData.name} placeholder="Enter name" required />

        <label>Rank (Ordered lowest first)</label>
        <input type="number" step="0.1" bind:value={formData.rank} />

        <label>Select platform type</label>
        <select bind:value={formData.platform_type}>
          {#each platformOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>

        <label>Select status</label>
        <select bind:value={formData.status}>
          {#each statusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>


        <label>Select iOS status</label>
        <select bind:value={formData.ios_status}>
          {#each iosStatusOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>

        <label>Tag (Used to notify every 72 hours)</label>
        <select bind:value={formData.tag}>
           {#each tagOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
        </select>

        <label>Points Diff</label>
        <input type="number" bind:value={formData.points_diff} />

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
      <p>Are you sure you want to delete <strong>{selectedGameName}</strong>?</p>
      <button class="submit-btn danger" on:click={handleDeleteGame}>Yes, Delete</button>
    </div>
  </div>
{/if}
</div>

<style>

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
  .modal-header h3{
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

  .no-records {
    text-align: center;
    margin-top: 1rem;
    font-weight: 500;
    color: #888;
  }
</style>
