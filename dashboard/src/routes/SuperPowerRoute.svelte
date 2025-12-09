<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import SuperPower from "../pages/SuperPower.svelte";
</script>

<ProtectedRoute component={SuperPower} requiredRole={["admin", "super_admin"]} />
