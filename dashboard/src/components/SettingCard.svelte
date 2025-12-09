 <!-- SettingCard.svelte -->
<script>
  export let title;
</script>

<div class="setting-card">
  <h2>{title}</h2>
  <div class="content">
    <slot></slot>
  </div>
</div>

<style>
  .setting-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 16px;
    margin-bottom: 16px;
    border: 1px solid #e0e0e0;
  }
  
  h2 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 1.1rem;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
  
  .content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>