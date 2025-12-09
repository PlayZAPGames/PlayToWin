<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import Dashboard from "../pages/Dashboard.svelte";
</script>

<ProtectedRoute component={Dashboard} requiredRole={["admin", "super_admin"]} />
