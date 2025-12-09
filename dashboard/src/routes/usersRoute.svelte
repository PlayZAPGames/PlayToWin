<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import Users from "../pages/Users.svelte";
</script>

<ProtectedRoute component={Users} requiredRole={["admin", "super_admin"]} />
