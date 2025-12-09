<script lang="ts">
  export let currentPage: number = 1;
  export let totalPages: number = 1;
  export let onPageChange: (page: number) => void;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 2);
        i <= Math.min(totalPages - 1, currentPage + 2);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };
</script>

<div class="pagination">
  <button on:click={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
    ←
  </button>

  {#each getPageNumbers() as page}
    {#if page === "..."}
      <span class="dots">...</span>
    {:else}
      <button
        class:selected={page === currentPage}
        on:click={() => onPageChange(page)}
      >
        {page}
      </button>
    {/if}
  {/each}

  <button on:click={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
    →
  </button>
</div>

<style>
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-top: 1rem;
  }

  button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    border-radius: 6px;
    min-width: 38px;
    font-size: 14px;
    color: #1e40af;
  }

  button.selected {
    background-color: #3b82f6;
    color: white;
    font-weight: 600;
    border: 1px solid transparent;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .dots {
    padding: 0 8px;
    color: #aaa;
    font-weight: bold;
    font-size: 16px;
  }
</style>
