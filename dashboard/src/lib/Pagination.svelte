<script>
  export let pageNumber = 1;
  export let fetchData;
</script>

<div class="pagination">
  <button
    on:click={() => {
      pageNumber = pageNumber - 1;
      fetchData();
    }}
    disabled={pageNumber === 1}
  >
    Previous
  </button>
  <span>
    Page {pageNumber}
  </span>
  <button
    on:click={() => {
      pageNumber = pageNumber + 1;
      fetchData();
    }}
  >
    Next
  </button>
</div>
