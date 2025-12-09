<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import Settings from "../pages/MasterSettings.svelte";
</script>

<ProtectedRoute component={Settings} requiredRole={["admin", "super_admin"]} />
