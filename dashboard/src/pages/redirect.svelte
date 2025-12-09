<script lang="ts">
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";

  onMount(() => {
    push("/login");
  });
</script>

<p>Redirecting to login...</p>
