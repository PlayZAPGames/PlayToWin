<script>
  import { onMount } from 'svelte';
  import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
  import { Fa } from 'svelte-fa';

  let theme = localStorage.getItem('theme') || 'dark';

  const toggleTheme = () => {
    theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  };

  onMount(() => {
    document.documentElement.setAttribute('data-theme', theme);
  });
</script>

<div class="toggle-wrapper">
  <div class="toggle {theme}" on:click={toggleTheme}>
    <div class="switch">
      {#if theme === 'light'}
        <Fa icon={faSun} />
      {:else}
        <Fa icon={faMoon} />
      {/if}
    </div>
  </div>
  <!-- <div class="icon">
  </div> -->
</div>


<style>
  .toggle-wrapper {
    position : absolute;
    top: 10px;
    right: 10px;

    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
  
  .toggle {
    width: 55px;
    height: 30px;
    background: var(--color-bg-secondary);
    border-radius: 25px;
    position: relative;
    cursor: pointer;
    transition: background 0.3s;
  }

  .toggle .switch {
    width: 26px;
    height: 26px;
    background: var(--color-text);
    border-radius: 50%;
    position: absolute;
    top: 2px;
    transition: left 0.3s;

    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toggle.light .switch {
    left: 1px;
    color: #ffffff;
  }
  
  .toggle.dark .switch {
    left: 26px;
    color: #0a0a0a;
  }

  .icon {
    margin-left: 10px;
  }
</style>
