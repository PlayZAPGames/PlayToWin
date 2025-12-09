<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import UserRewards from "../pages/UsersRewards.svelte";
</script>

<ProtectedRoute component={UserRewards} requiredRole={["admin", "super_admin"]} />
