<!-- ProtectedRoute.svelte file -->
<script lang="ts">
  import { PlayerRole } from "../../../utility/enums";
  import { push } from "svelte-spa-router";
  import { user, isAuthenticated } from "../stores/authStore";
  export let component: any;
  export let requiredRole: string | string[] | null = null;
  export let params = {};
  let isAuthorized = false;
  //for development i set true
  // let isAuthorized = true;


    const RoleNames = Object.fromEntries(
    Object.entries(PlayerRole).map(([key, value]) => [value, key])
  );


 $: {

    //  const userRole = RoleNames[3];
     const userRole = RoleNames[$user?.player];


    console.log("$user", userRole);
    
    if (!$isAuthenticated || !$user) {

      // while development Commented this
      push("/login");
    } else if (
      requiredRole &&
      (Array.isArray(requiredRole)
        ? !requiredRole.includes(userRole)
        : userRole !== requiredRole)
    ) {
      // while development Commented this
      isAuthorized = false;

      push("/unauthorized");
    } else {
      isAuthorized = true;
    }
  }

</script>

{#if isAuthorized}
  <svelte:component this={component} {params}/>
{:else}
  <p>Redirecting...</p>
{/if}
