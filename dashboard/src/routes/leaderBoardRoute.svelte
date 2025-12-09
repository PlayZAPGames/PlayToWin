<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import LeaderBoard from "../pages/LeaderBoard.svelte";
</script>

<ProtectedRoute component={LeaderBoard} requiredRole={["admin", "super_admin"]} />
