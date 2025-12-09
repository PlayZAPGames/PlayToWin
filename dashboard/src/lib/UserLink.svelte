<script>
  export let item;
</script>

<div class="container">
  {#if item.user_id}
    <a href="/#/view-user/{item.user_id}">
      <!-- <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        fill="#FFFFFF"
      >
        <path
          d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"
        />
      </svg> -->
      {item?.user_name ?? item.User.username}
    </a>
  {:else}
    {item.user_name}
  {/if}
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
  }
  a {
    /* width: 20px;
    height: 20px; */

    color: var(--color-link-hover);
  }
  a:hover {
    color: var(--color-text);
  }
</style>
