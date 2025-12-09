<script>
  import { sidebarOpen } from "../stores/sidebar";
  import { onMount } from 'svelte'
  import JsonEditor from './JsonEditor.svelte'
  import SettingCard from '../components/SettingCard.svelte' // Add your actual path
  import baseUrl from '../config' // Adjust the path as per your config file
  import { getToken } from '../lib/auth'

  let settings = {}
  let loading = true
  let errors = {}
  let successMessage = ''
  let error = ''

  const fetchSettings = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${baseUrl}/api/admin/settings`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch settings')

      const result = await response.json()
      settings =  result.data.settings
 

      console.log('settings', settings)
    } catch (err) {
      error = err.message
      errors.global = err.message
    } finally {
      loading = false
    }
  }

  const updateSetting = async (key, value) => {
    try {
      const token = getToken()
      const res = await fetch(`${baseUrl}/api/admin/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value }),
      })

      if (!res.ok) {
        const errResp = await res.json()
        errors[key] = errResp.error || 'Update failed'
        return
      }

      errors[key] = null
      settings[key] = value
      successMessage = `${key} updated successfully`
    } catch (e) {
      errors[key] = 'Network error'
    }
  }

  onMount(fetchSettings)

  const isComplexSetting = (key) => typeof settings[key] === 'object' && settings[key] !== null
</script>
<div class="page-content" class:sidebar-open={$sidebarOpen} class:sidebar-closed={!$sidebarOpen}>

  <h1>System Settings</h1>

  {#if successMessage}
    <div class="success">{successMessage}</div>
  {/if}

  {#if loading}
    <p>Loading settings...</p>
  {:else if errors.global}
    <div class="error">{errors.global}</div>
  {:else}
    <div class="settings-grid">
      <!-- Simple Value Settings -->
      <!-- <SettingCard title="Gem Conversion">
        <input
          type="number"
          bind:value={settings.gemToPzp}
          on:blur={() => updateSetting('gemToPzp', settings.gemToPzp)}
        />
        {#if errors.gemToPzp}
          <div class="field-error">{errors.gemToPzp}</div>
        {/if}
      </SettingCard>

      <SettingCard title="Ticket Swap Fee">
        <input
          type="number"
          bind:value={settings.ticketSwapFee}
          on:blur={() => updateSetting('ticketSwapFee', settings.ticketSwapFee)}
        />
        {#if errors.ticketSwapFee}
          <div class="field-error">{errors.ticketSwapFee}</div>
        {/if}
      </SettingCard> -->
      <SettingCard title="Minimum Swap limit">
        <input
          type="text"
          bind:value={settings.ticketMinSwap}
          on:blur={() => updateSetting('ticketMinSwap', settings.ticketMinSwap)}
        />
        {#if errors.ticketMinSwap}
          <div class="field-error">{errors.ticketMinSwap}</div>
        {/if}
      </SettingCard>

      <!-- Complex JSON Settings -->
       <SettingCard title="Wallet Withdraw">
        <JsonEditor
          bind:value={settings.walletWithdraw}
          onSave={(value) => updateSetting('walletWithdraw', value)}
        />
        {#if errors.walletWithdraw}
          <div class="field-error">{errors.walletWithdraw}</div>
        {/if}
      </SettingCard>

         <!-- Complex JSON Settings -->
       <SettingCard title="Weekly Reward  ">
        <JsonEditor
          bind:value={settings.weeklyPrizePool}
          onSave={(value) => updateSetting('weeklyPrizePool', value)}
        />
        {#if errors.weeklyPrizePool}
          <div class="field-error">{errors.weeklyPrizePool}</div>
        {/if}
      </SettingCard>

      <!-- Complex JSON Settings -->
      <SettingCard title="Join Rewards">
        <JsonEditor
          bind:value={settings.joinReward}
          onSave={(value) => updateSetting('joinReward', value)}
        />
        {#if errors.joinReward}
          <div class="field-error">{errors.joinReward}</div>
        {/if}
      </SettingCard>

      <SettingCard title="Referral Program">
        <JsonEditor
          bind:value={settings.referral}
          onSave={(value) => updateSetting('referral', value)}
        />
        {#if errors.referral}
          <div class="field-error">{errors.referral}</div>
        {/if}
      </SettingCard>

      <!-- Daily Rewards Editor -->
      <SettingCard title="Daily Rewards">
        <div class="daily-rewards">
          {#if settings.DailyRewardValues?.days}
            {#each settings.DailyRewardValues?.days as day, i}
              <div class="day">
                <span>Day {i + 1}:</span>
                <input
                  type="number"
                  bind:value={day.value}
                  on:blur={() => updateSetting('DailyRewardValues', settings.DailyRewardValues)}
                />
                <select
                  bind:value={day.currencyType}
                  on:change={() => updateSetting('DailyRewardValues', settings.DailyRewardValues)}
                >
                  <option value="virtual1">Virtual 1</option>
                  <option value="virtual2">Virtual 2</option>
                </select>
              </div>
            {/each}
          {/if}
        </div>
        {#if errors.DailyRewardValues}
          <div class="field-error">{errors.DailyRewardValues}</div>
        {/if}
      </SettingCard>

      <!-- System Maintenance -->
      <SettingCard title="Maintenance Mode">
        {#if settings.maintenance?.data}
          <div class="flex daily-contents items-center gap-4">
            <input
              type="checkbox"
              bind:checked={settings.maintenance.data.status}
              on:change={() => updateSetting('maintenance', settings.maintenance)}
            />
            <span class="status-label" style="color: {settings.maintenance.data.status ? 'green' : 'red'}">
              {settings.maintenance.data.status ? 'Enabled' : 'Disabled'}
            </span>

          </div>
        {/if}
      </SettingCard>


      <!-- <SettingCard title="System Maintenance">
        <label class="toggle">
          <input 
            type="checkbox" 
            bind:checked={settings?.maintenance?.data?.status}
            on:change={() => updateSetting('maintenance', settings?.maintenance)}
          />
          <span class="slider"></span>
        </label>
        {#if errors.maintenance}
          <div class="field-error">{errors.maintenance}</div>
        {/if}
      </SettingCard> -->
    </div>
  {/if}
</div>

<style>

    .page-content.sidebar-closed {
    margin-left: 0;
  }


  .page-content {
    margin-left: 0;
    transition: all 0.3s ease;
    padding: 20px;
    margin-left: 25px;
  }
  .daily-contents{
    display: contents;
  }
  .status-label {
    font-weight: 600;
    color: #888;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
  }

  .daily-rewards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .day {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .success {
    color: green;
    padding: 10px;
    background: #e6ffe6;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .error,
  .field-error {
    color: red;
    margin-top: 5px;
    font-size: 0.9em;
  }

</style>
