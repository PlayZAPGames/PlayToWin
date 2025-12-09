<script>
  export let items = [];
  export let sidebarOpen; // receive the store

  import {    Gauge,
    Calendar,
    Users,
    Gamepad,
    Box,
    Settings,
    Database,
    Layers,
    // BarChart3,
    ChevronDown,
    ChevronUp
  } from "lucide-svelte";

  const iconMap = {
    gauge: Gauge,
    calendar: Calendar,
    users: Users,
    games: Gamepad,
    assets: Box,
    settings: Settings,
    transactions: Database,
    utility: Layers,
    // analytics: BarChart3
  };

  let open = false;


  let openDropdowns = new Set();

function toggleDropdown(name) {
  if (openDropdowns.has(name)) {
    openDropdowns.delete(name);
  } else {
    openDropdowns.add(name);
  }
  openDropdowns = new Set(openDropdowns); // Trigger reactivity
}
</script>

<!-- <button on:click={() => (open = !open)}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24px"
    viewBox="0 -960 960 960"
    width="24px"
    fill="#e8eaed"
    ><path
      d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"
    /></svg
  >
</button> -->





<div class="sidebar" class:open={$sidebarOpen}>

    <!-- Sidebar - Brand -->
    <!-- <a class="sidebar-brand d-flex align-items-center justify-content-center" href="index.html"> -->
    <a class="sidebar-brand d-flex align-items-center justify-content-center" href="/#">
      <div class="sidebar-brand-icon rotate-n-15">
        <i class="fas fa-laugh-wink"></i>
      </div>
      <div class="sidebar-brand-text mx-3"><sup>SURVIVAL ADMIN </sup></div>
    </a>
  
    <!-- Divider -->
    <hr class="sidebar-divider">


    <!-- Menu Items -->
    {#each items as item}
    {#if item.section}
      <div class="sidebar-heading">{item.section}</div>

    {:else if item.children}
      <div class="menu-item" on:click={() => toggleDropdown(item.name)}>
        {#if item.iconClass}
          <i class={item.iconClass}></i>
        {/if}
        <span>{item.name}</span>
        <i class={`fas fa-chevron-${openDropdowns.has(item.name) ? 'up' : 'down'} chevron`}></i>
      </div>
      {#if openDropdowns.has(item.name)}
        <div class="submenu">
          {#each item.children as child}
            <a href={child.href} class="submenu-item">
              {#if child.iconClass}
                <i class={child.iconClass}></i>
              {/if}
              <span>{child.name}</span>
            </a>
          {/each}
        </div>
      {/if}

    {:else}
      <a class="menu-item" href={item.href}>
        {#if item.iconClass}
          <i class={item.iconClass}></i>
        {/if}
        <span>{item.name}</span>
      </a>
    {/if}
  {/each}
 
</div>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="backdrop" class:open on:click={() => (open = false)}></div>

<style>

  .submenu{
    text-align: left;
  }

  .sidebar .menu-item{
    cursor: pointer;
    text-align:  left;
    display: block;
    color: rgba(255, 255, 255, 0.4);
    padding: 10px;
    text-decoration: none;
  }

  .sidebar .menu-item:hover
    {
        color: #fff;
    }

sup {
    position: relative;
    font-size: 75%;
    line-height: 0;
    vertical-align: baseline;
}

.sidebar .sidebar-brand {
    color: #fff;
}


@media (min-width: 768px) {
    .sidebar .sidebar-brand .sidebar-brand-text {
        display: inline;
    }
}

  .sidebar .sidebar-brand {
      /* height: 4.375rem; */
      text-decoration: none;
      font-size: 1rem;
      font-weight: 800;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: .05rem;
      z-index: 1;
  }
  .backdrop {
    display: none;
    position: fixed;
    top: 0;
    left: 0;

    width: 100vw;
    height: 100vh;

    background-color: rgba(0, 0, 0, 0.4);
  }

  /* button {
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 9999;
  } */
  .sidebar {
    z-index: 999;
    /* display: none; */
    position: fixed;
    top: 0;
    /* left: -100%; */
    /* transform: translateX(-100%); */

    width: 150px;
    height: 100%;
    /* background-color: var(--color-bg-secondary); */
    background-color: #4e73df;
    background-image: linear-gradient(180deg, #4e73df 10%, #224abe 100%);
    background-size: cover;
    padding: 10px;
    overflow: hidden;
  }

  .open {
    display: block;
    left: 0;
  }

  .sidebar a {
    display: block;
    /* color: var(--color-text); */
    color: rgba(255, 255, 255, 0.4);
    padding: 10px;
    text-decoration: none;
  }

  .sidebar a:hover {
    background-color: var(--color-link-hover);
  }


  /* .sidebar {
    width: 250px;
    height: 100vh;
    background-color: #4f6dd9;
    padding: 15px;
    overflow-y: auto;
    color: white;
  } */

    .sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  background-color: #4f6dd9;
  padding: 15px;
  overflow-y: auto;
  color: white;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 999;
}

  .sidebar-brand {
    color: white;
    font-weight: bold;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    text-decoration: none;
  }

  .sidebar-heading {
    font-size: 12px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 20px;
    margin-bottom: 10px;
    font-weight: bold;
  }

  .nav-link {
    display: flex;
    justify-content: space-between;
    color: white;
    padding: 10px;
    border-radius: 4px;
    text-decoration: none;
  }

  .nav-link:hover {
    background-color: #3e5ec4;
  }

  .submenu {
    margin-left: 10px;
    margin-top: 5px;
  }

  .collapse-item {
    display: block;
    padding: 6px 12px;
    font-size: 14px;
    color: white;
    text-decoration: none;
    border-radius: 4px;
  }

  .collapse-item:hover {
    background-color: #2e4db2;
  }




.sidebar.open {
  transform: translateX(0);
}


</style>
