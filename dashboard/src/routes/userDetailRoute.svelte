<script lang="ts">
  import ProtectedRoute from "../components/ProtectedRoute.svelte";
  import UserDetail from "../pages/UserDetail.svelte";
  export let params: any; 
</script>

<ProtectedRoute component={UserDetail} requiredRole={["admin", "super_admin"]} {params}/>
