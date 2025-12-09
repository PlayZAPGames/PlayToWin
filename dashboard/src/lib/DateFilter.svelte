<script>
  export let searchDateStart;
  export let searchDateEnd;
</script>

<div class="date-filter">
  <input type="date" id="startDate" bind:value={searchDateStart} />
  <input type="date" id="endDate" bind:value={searchDateEnd} />
  <button
    on:click={() => {
      searchDateStart = null;
      searchDateEnd = null;
    }}>Clear</button
  >
</div>
