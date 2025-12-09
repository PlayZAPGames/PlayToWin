<script lang="ts">
  import { onMount } from "svelte";
  import baseUrl from "../config";
  import { sidebarOpen } from "../stores/sidebar";
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

  const confirmDeleteGame = (game) => {
    console.log("game", game);
    console.log("selectedGame", selectedGame);

    selectedGameName = game.name;
    gameToDeleteId = game.id;
    showDeleteModal = true;
  };

  let formData = {
    name: "",
    commission: null,
  };

  async function fetchGames(page = 1) {
    loading = true;
    try {
      const token = getToken();
      const response = await fetch(
        `${baseUrl}/api/admin/mini-games?page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch games");
      const data = await response.json();
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
      commission: null,
    };
    showGameModal = true;
  };

  const openEditModal = (game) => {
    selectedGame = game;
    formData = {
      name: game.name,
      commission: game.commission,
    };
    showGameModal = true;
  };

  const handleCreateGame = async () => {
    const token = getToken();
    const res = await fetch(`${baseUrl}/api/admin/mini-game`, {
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
    const res = await fetch(
      `${baseUrl}/api/admin/mini-game/${selectedGame.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      },
    );
    if (res.ok) {
      showGameModal = false;
      await fetchGames(pagination.page);
    }
  };

  const handleDeleteGame = async () => {
    if (!gameToDeleteId) return;

    const token = getToken();
    try {
      const res = await fetch(
        `${baseUrl}/api/admin/mini-game/${gameToDeleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

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
                <th>Slug</th>
                <th>Name</th>
                <th>Commission</th>
                <th>Tickets</th>
                <th>Virtual2</th>
                <th>Tokens</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each games as game}
                <tr>
                  <td>{game.slug}</td>
                  <td>{game.name ?? "-"}</td>
                  <td>{game.commission}</td>

                  <td class="code">
                    Paid → {game?.tickets_paid}<br />
                    Collected → {game?.tickets_collected}<br />
                    P/L → {game?.tickets_pl}
                  </td>

                  <td class="code">
                    Paid → {game?.virtual2_paid}<br />
                    Collected → {game?.virtual2_collected}<br />
                    Commission → {game?.virtual2_commission}<br />
                    P/L → {game?.virtual2_pl}
                  </td>

                  <td class="code">
                    Paid → {game?.tokens_paid}<br />
                    Collected → {game?.tokens_collected}<br />
                    Commission → {game?.tokens_commission}<br />
                    P/L → {game?.tokens_pl}
                  </td>

                  <!-- Actions -->
                  <td>
                    <div class="action-column">
                      <span
                        class="action-btn"
                        on:click={() => openEditModal(game)}
                      >
                        <i class="fas fa-pen"></i>
                      </span>
                      <span
                        class="action-btn delete"
                        on:click={() => confirmDeleteGame(game)}
                      >
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

        <label>Commission</label>
        <input type="number" bind:value={formData.commission} />

        <button class="submit-btn" type="submit">Submit</button>
      </form>
    </div>
  {/if}
  {#if showDeleteModal}
    <div
      class="modal-backdrop"
      on:click={() => (showDeleteModal = false)}
    ></div>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Confirm Delete</h3>
      </div>
      <div class="modal-form">
        <p>
          Are you sure you want to delete <strong>{selectedGameName}</strong>?
        </p>
        <button class="submit-btn danger" on:click={handleDeleteGame}
          >Yes, Delete</button
        >
      </div>
    </div>
  {/if}
</div>

<style>
  .code {
    font-size: 87.5%;
    color: #e83e8c;
    word-wrap: break-word;
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
  .modal-form input {
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
