<script>
  export let title = 'Title' // Default title if none provided
  export let value = '0' // Default value if none provided
  export let color = 'primary' // Default color class
</script>

<div class="col-xl-3 col-md-6 mb-4">
  <div class="card border-left-{color} shadow h-100 py-2">
    <div class="card-body">
      <div class="row no-gutters">
        <div class="col mr-2">
          <div class="text-xs font-weight-bold text-{color} text-uppercase mb-1">
            {title}
          </div>
          <div class="h5 mb-0 font-weight-bold text-gray-800">{value}</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .text-xs {
    font-size: 0.7rem;
  }

  .col-md-6,
  .col-xl-3 {
    position: relative;
    width: 100%;
    padding-right: 0.75rem;
    padding-left: 0.75rem;
  }

  .text-uppercase {
    text-transform: uppercase !important;
  }
  .no-gutters > .col {
    padding-right: 0;
    padding-left: 0;
  }

  .pt-2,
  .py-2 {
    padding-top: 0.5rem !important;
  }

  .mb-4,
  .my-4 {
    margin-bottom: 1.5rem !important;
  }

  @media (min-width: 1200px) {
    .col-xl-3 {
      flex: 0 0 22%;
      max-width: 22%;
    }
  }

  .border-left-primary {
    border-left: 0.25rem solid #4e73df !important;
  }

  .shadow {
    box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15) !important;
  }
  .card-body {
    flex: 1 1 auto;
    min-height: 1px;
    padding: 1.25rem;
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    word-wrap: break-word;
    background-color: #fff;
    background-clip: border-box;
    border: 1px solid #e3e6f0;
    border-radius: 0.35rem;
  }

  .text-primary {
    color: #4e73df !important;
  }
  .font-weight-bold {
    font-weight: 700 !important;
  }
</style>
