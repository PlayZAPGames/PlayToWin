<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import Swap from "../pages/Swap.svelte";
</script>

<ProtectedRoute component={Swap} requiredRole={["admin", "super_admin"]} />
