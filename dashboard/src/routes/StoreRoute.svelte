<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import Store from "../pages/Store.svelte";
</script>

<ProtectedRoute component={Store} requiredRole={["admin", "super_admin"]} />
