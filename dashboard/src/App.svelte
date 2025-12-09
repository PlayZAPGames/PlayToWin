<script>
  import { Toaster } from 'svelte-french-toast'
  import { writable } from 'svelte/store'
  import { sidebarOpen } from './stores/sidebar'

  import Router from 'svelte-spa-router'
  import Login from './pages/Login.svelte'
  import Unauthorized from './pages/Unauthorized.svelte'
  import DashboardRoute from './routes/DashboardRoute.svelte'
  import usersRoute from './routes/usersRoute.svelte'
  import userDetailRoute from './routes/userDetailRoute.svelte'
  import settingsRoute from './routes/settingsRoute.svelte'
  import userRewardRoute from './routes/userRewardRoute.svelte'
  import leaderBoardRoute from './routes/leaderBoardRoute.svelte'
   import storeRoute from './routes/StoreRoute.svelte'
   import superPowerRoute from './routes/SuperPowerRoute.svelte'
  import SideBar from './lib/SideBar.svelte'
  import { onMount } from 'svelte'
  import RedirectToLogin from './pages/redirect.svelte'

  import Withdraw from './pages/Withdraw.svelte'
  import Swap from './pages/Swap.svelte'
  import LeaderBoardRewards from './pages/LeaderBoardRewards.svelte'
  // import Tournaments from './pages/Tournaments/Tournaments.svelte'
  // import TournamentReward from './pages/Tournaments/TournamentReward.svelte'
  // import Transfer from './pages/Transfers.svelte'
  import Games from './pages/Game.svelte'

  // import TransferReward from './pages/TransferReward.svelte'
  // import TransferRaffleReward from './pages/TransferRaffleReward.svelte'
  // import Virtuals from './pages/Virtuals.svelte'
  // import VirtualChain from './pages/VirtualChain.svelte'
  // import Events from './pages/Events.svelte'
  // import MiniGames from './pages/MiniGames.svelte'
  import Airdrop from './pages/Airdrop.svelte'
  import Spinner from './pages/Spinner.svelte'
  import EarnLudy from './pages/EarnLudy.svelte'
  import SuperPower from './pages/SuperPower.svelte'

  const navItems = [
    { name: "Dashboard", href: "/#" },
    { name: 'Users', iconClass: 'fas fa-users', href: '/#/users' },
    // { name: 'Airdrop', iconClass: 'fas fa-fw fa-tachometer-alt',href: '/#/airdrop' },
    { name: 'Leaderboard', iconClass: 'fas fa-fw fa-tachometer-alt',href: '/#/leaderboard' },
    { name: "Gameplay Rewards", iconClass: "fas fa-gamepad", href: "/#/game" },

    {
      name: "Store",iconClass: "fas fa-store",
      children: [
        { name: "Items", iconClass: "fas fa-store", href: "/#/store" },
        { name: "Powers", iconClass: "fa-brands fa-superpowers", href: "/#/super-powers" },

      ],
    },

    {
      name: "Earn Token", iconClass: "fa-duotone fa-solid fa-coins",
      children: [
        { name: "Daily Rewards", iconClass: "fas fa-gamepad", href: "/#/earn-ludy" },
        { name: "Spin Wheel", iconClass: "fa-solid fa-spinner", href: "/#/spin-wheels" },
      ],
    },
    {
      name: "Assets", iconClass: "fa-solid fa-wallet",
      children: [
        { name: "Leaderboard Rewards", iconClass: "fa-solid fa-coins", href: "/#/leaderboard-rewards" },
        { name: "Swap", iconClass: "fas fa-people-arrows", href: "/#/swap" },
        { name: "Withdrawal", iconClass: "fa-solid fa-money-bill-transfer", href: "/#/Withdraw" },
      ],
    },

    { name: 'Settings', iconClass: 'fas fa-gear', href: '/#/settings' },
    
    // { name: "User Rewards", iconClass: "fas fa-users", href: "/#/user-rewards" },
    // {
    //   name: "Games",

    //   children: [
    //     { name: "Gameplay Rewards", iconClass: "fas fa-gamepad", href: "/#/game" },
        // {
        //   name: "Match Name",
        //   iconClass: "fas fa-fw fa-tachometer-alt",
        //   href: "/#/events",
        // },
        // {
        //   name: "Live Matches",
        //   iconClass: "fas fa-fw fa-tachometer-alt",
        //   href: "/#/tournaments",
        // },
        // {
        //   name: "Mini Game",
        //   iconClass: "fas fa-headset",
        //   href: "/#/mini-games",
        // },
        // {
        //   name: "Fairplay",
        //   iconClass: "fas fa-fw fa-tachometer-alt",
        //   href: "/#/fairplays",
        // },
    //   ],
    // },

    // {
    //   name: "Assets",
    //   children: [
    //     { name: "Withdrawal", href: "/#/withdrawals" },
    //     { name: "Deposit", href: "/#/deposits" },
    //     { name: "Swap Request", href: "/#/swap_values" },
    //     { name: "Swap Vault", href: "/#/swap_vaults" },
    //     { name: "Bsc Swap Out", href: "/#/bsc_swap_outs" },
    //     { name: "User Gift Card", href: "/#/user_gifts_cards" },
    //   ],
    // },
    // {
    //   name: "Web3 Setup",
    //   children: [
    //     { name: "Chain", href: "/#/chains" },
    //     { name: "Escrow", href: "/#/crews" },
    //     { name: "Virtual", href: "/#/virtuals" },
    //     { name: "Virtual Chain", href: "/#/virtual_chains" },
    //     { name: "Swap List", href: "/#/swap_lists" },
    //   ],
    // },

    // {
    //   name: "Web3 Transactions",
    //   children: [
    //     { name: "Transfer", href: "/#/transfer" },
    //     { name: "Transfer Rewards", href: "/#/transferReward" },
    //     { name: "Transfer Raffle Rewards", href: "/#/TransferRaffleReward" },
    //   ],
    // },

    // {
    //   name: "Store",
    //   children: [
    //     { name: "Shop", href: "/#/shops" },
    //     { name: "Package", href: "/#/packages" },
    //   ],
    // },

    // {
    //   name: "Playzap Core Setup",
    //   children: [
    //     { name: "Master", href: "/#/option" },
    //     { name: "Spin Wheel", href: "/#/spin_wheels" },
    //     { name: "Daily Rewards", href: "/#/daily_rewards" },
    //     { name: "Multiple Game Level", href: "/#/multiple_gamez_levels" },
    //     { name: "Game Level", href: "/#/gamez_levels" },
    //     { name: "PLayer XP", href: "/#/playerxps" },
    //     { name: "PLayer XP Level", href: "/#/playerxp_levels" },
    //   ],
    // },

    // {
    //   name: "Utility",
    //   children: [
    //     { name: "Hall of Fame", href: "/#/boards" },
    //     { name: "Game Point Event", href: "/#/game_point_events" },
    //     { name: "Wallet Check", href: "/#/wallet_checks" },
    //     { name: "Bridge", href: "/#/bridges" },
    //     { name: "Lottery Events", href: "/#/lottery_events" },
    //     { name: "Lottery Event Slots", href: "/#/lottery_event_slots" },
    //     { name: "Lottery Tickets", href: "/#/lottery_tickets" },
    //   ],
    // },

    // {
    //   name: "Analytics",
    //   children: [
    //     { name: "Master", href: "/#/analytics_master" },
    //     { name: "Dashboard", href: "/#/analytics_dashboard" },
    //     { name: "Overview", href: "/#/analytics_overview" },
    //     { name: "Game Overviews", href: "/#/analytics_game_overviews" },
    //     { name: "Mini Games", href: "/#/analytics_mini_games" },
    //     { name: "Currency", href: "/#/analytics_currency" },
    //     { name: "Escrow", href: "/#/analytics_escrow" },
    //     { name: "User", href: "/#/analytics_user" },
    //     { name: "Played", href: "/#/analytics_played" },
    //     { name: "Tg Games", href: "/#/analytics_tg_games" },
    //     { name: "Transfer Analytics", href: "/#/analytics_transfer" },
    //   ],
    // },

    // { name: "Group", href: "/#/groups" },
    // { name: "Fetch Deposit", href: "/#/fetch_deposits" },
    // { name: "Withdraw", href: "/#/withdraw" },
    // { name: "Swap", href: "/#/swap" },
    // { name: "Transfer", href: "/#/transfer" },
    // { name: "Transfer Reward", href: "/#/transferReward" },
    // { name: "Virtuals", href: "/#/virtuals" },
    // { name: "Virtual Chain", href: "/#/virtual-chains" },
    // { name: "Tournaments", href: "/#/tournaments" },
  ]

  const hash = writable(window.location.hash)
  const updateHash = () => hash.set(window.location.hash)

  onMount(() => {
    window.addEventListener('hashchange', updateHash)
    updateHash()
    return () => window.removeEventListener('hashchange', updateHash)
  })

  const routes = {
    '/': DashboardRoute,
    '/login': Login,
    '/unauthorized': Unauthorized,
    '/users': usersRoute,
    "/view-user/:id": userDetailRoute,
    '/settings': settingsRoute,
    '/user-rewards': userRewardRoute,
    '/leaderboard': leaderBoardRoute,
    '/airdrop': Airdrop,

    '/game': Games,
    '/spin-wheels': Spinner,
    '/earn-ludy': EarnLudy,
    '/store': storeRoute,
    '/super-powers': superPowerRoute,
    // '/mini-games': MiniGames,
    // '/events': Events,
    // '/fairplays': Fairplays,

    '/leaderboard-rewards': LeaderBoardRewards,
    '/withdraw': Withdraw,
    '/swap': Swap,
    // '/tournaments': Tournaments,
    // '/transfer': Transfer,
    // '/transferReward': TransferReward,
    // '/transferRaffleReward': TransferRaffleReward,
    // '/virtuals': Virtuals,
    // '/virtual-chains': VirtualChain,

    // '/admin/tournament/:tournament_id/tournament_rewards': TournamentReward,

    '*': RedirectToLogin,

  }
</script>

<div class="app-layout">
  {#if !['#/login', '#/unauthorized'].includes($hash)}
    <div class="sidebar-container" class:sidebar-closed={!$sidebarOpen}>
      <SideBar {sidebarOpen} items={navItems} />

      <button class="sidebar-toggle" on:click={() => sidebarOpen.update((v) => !v)}>
        &#9776;
      </button>
    </div>
  {/if}

  <div class="main-view">
    <Toaster position="top-right" />
    <Router {routes} />
  </div>
</div>

<style>
  .app-layout {
    display: flex;
    min-height: 100vh;
  }

  .sidebar-container {
    position: relative;
    width: 250px;
    transition: width 0.3s ease;
  }

  .sidebar-container.sidebar-closed {
    width: 38px;
    overflow: hidden;
  }

  .sidebar-toggle {
    position: absolute;
    top: 10px;
    right: 0px;
    width: 30px;
    height: 40px;
    background-image: linear-gradient(180deg, #4e73df 10%, #224abe 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 5px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    z-index: 1000;
    display: none; /* Hide by default */
    align-items: center;
    justify-content: center;
    transition: right 0.3s ease;
  }

  /* Show toggle when sidebar is closed */
  .sidebar-container.sidebar-closed .sidebar-toggle {
    display: flex;
    right: 0px;
  }

  /* Show toggle on hover when sidebar is open */
  .sidebar-container:hover:not(.sidebar-closed) .sidebar-toggle {
    display: flex;
  }

  .main-view {
    min-width: 0px;
    flex: 1;
    /* padding: 20px; */
    transition: margin-left 0.3s ease;
  }
</style>
