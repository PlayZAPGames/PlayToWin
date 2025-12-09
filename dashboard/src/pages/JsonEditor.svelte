<script>
  import Joi from 'joi'

  export let value
  export let onSave

  let stringValue = JSON.stringify(value, null, 2)
  let error = null
  let isSaving = false

  // Enhanced schemas with better error messages
  const schemas = {
    walletWithdraw: Joi.object({
      day_limit: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'day_limit must be a number' }),
      min_withdraw: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'min_withdraw must be a number' }),
      processing_fee: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'processing_fee must be a number' }),
      withdraw_maintenance: Joi.boolean()
        .required()
        .messages({ 'number.base': 'withdraw_maintenance must be a boolean' }),
    })
      .strict()
      .messages({
        'object.unknown': 'Invalid field: {#label}',
        'object.base': 'Must be an object with virtual1 and virtual2',
      }),

    leaderboardRewards: Joi.object({
      rewards: Joi.array()
        .items(
          Joi.object({
            from: Joi.number().integer().min(1).required().messages({
              'number.base': 'From rank must be a number',
              'number.min': 'From rank must be at least 1',
              'number.integer': 'From rank must be an integer',
              'any.required': 'From rank is required',
            }),
            to: Joi.number().integer().min(Joi.ref('from')).required().messages({
              'number.base': 'To rank must be a number',
              'number.min': 'To rank must be greater than or equal to from rank',
              'number.integer': 'To rank must be an integer',
              'any.required': 'To rank is required',
            }),
            reward: Joi.number().min(0).required().messages({
              'number.base': 'Reward must be a number',
              'number.min': 'Reward cannot be negative',
              'any.required': 'Reward is required',
            }),
          }).strict(),
        )
        .min(1)
        .custom((rewards, helpers) => {
          // Validate that rank ranges don't overlap and are continuous
          const sortedRewards = [...rewards].sort((a, b) => a.from - b.from)
          
          for (let i = 0; i < sortedRewards.length; i++) {
            const current = sortedRewards[i]
            
            // Check for overlapping ranges
            for (let j = i + 1; j < sortedRewards.length; j++) {
              const other = sortedRewards[j]
              if (current.to >= other.from) {
                return helpers.error('array.overlap', {
                  message: `Rank ranges overlap: ${current.from}-${current.to} and ${other.from}-${other.to}`
                })
              }
            }
            
            // Check if ranges are continuous (except for the last one)
            if (i < sortedRewards.length - 1) {
              const next = sortedRewards[i + 1]
              if (current.to + 1 !== next.from) {
                return helpers.error('array.gap', {
                  message: `Gap in rank ranges: ${current.to + 1} to ${next.from - 1} is missing`
                })
              }
            }
          }
          
          return rewards
        }, 'Rank range validation')
        .messages({
          'array.base': 'Rewards must be an array',
          'array.min': 'At least one reward entry is required',
          'array.overlap': 'Rank ranges cannot overlap',
          'array.gap': 'Rank ranges must be continuous without gaps',
        }),
    })
      .strict()
      .messages({
        'object.unknown': 'Invalid field: {#label}',
        'object.base': 'Must be an object with rewards array',
      }),

    joinReward: Joi.object({
      virtual1: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'virtual1 must be a number' }),
      virtual2: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'virtual2 must be a number' }),
    })
      .strict()
      .messages({
        'object.unknown': 'Invalid field: {#label}',
        'object.base': 'Must be an object with virtual1 and virtual2',
      }),

    referral: Joi.object({
      referrerDailyRewardLimit: Joi.number()
        .min(0)
        .required()
        .messages({ 'number.base': 'referrerDailyRewardLimit must be a number' }),

      virtual1: Joi.object({
        referreeReward: Joi.number()
          .min(0)
          .required()
          .messages({ 'number.base': 'Referree reward must be a number' }),
        referrerReward: Joi.number()
          .min(0)
          .required()
          .messages({ 'number.base': 'Referrer reward must be a number' }),
      })
        .strict()
        .messages({
          'object.unknown': 'Invalid field in virtual1',
          'object.base': 'virtual1 must have referreeReward and referrerReward',
        }),
    })
      .strict()
      .messages({
        'object.unknown': 'Invalid field: {#label}',
        'object.base': 'Must be an object with currencies and referrerDailyRewardLimit',
      }) 
 }

  const validate = () => {
  try {
    const parsed = JSON.parse(stringValue)
    error = null

    // Determine which schema to use based on the structure
    let schemaToUse
    if (typeof parsed.virtual1 === 'number' && typeof parsed.virtual2 === 'number') {
      schemaToUse = schemas.joinReward
    } else if (typeof parsed.virtual1 === 'object' || typeof parsed.virtual2 === 'object') {
      schemaToUse = schemas.referral
    } else if (typeof parsed.day_limit === 'number' && typeof parsed.min_withdraw === 'number') {
      schemaToUse = schemas.walletWithdraw
    } else if (Array.isArray(parsed.rewards)) {
      schemaToUse = schemas.leaderboardRewards
    } else {
      error = 'Invalid structure - must be either joinReward, referral, walletWithdraw, or leaderboardRewards format'
      return { valid: false }
    }

    const { error: validationError } = schemaToUse.validate(parsed, {
      allowUnknown: false,
      abortEarly: false,
    })

    if (validationError) {
      error = validationError.details.map((d) => d.message).join(', ')
      return { valid: false }
    }

    return { valid: true, value: parsed }
  } catch (e) {
    error = 'Invalid JSON format'
    return { valid: false }
  }
}


  const handleInput = () => {
    // Clear error when user starts typing
    if (error) error = null
  }

  const handleSave = async () => {
    const validation = validate()
    if (!validation.valid) return

    isSaving = true
    try {
      await onSave(validation.value)
      error = null
    } catch (err) {
      error = err.message || 'Failed to save'
    } finally {
      isSaving = false
    }
  }
</script>

<div class="json-editor">
  <textarea
    bind:value={stringValue}
    on:input={handleInput}
    on:blur={validate}
    class:invalid={error}
    rows={10}
    disabled={isSaving}
  ></textarea>

  {#if error}
    <div class="error">{error}</div>
  {/if}

  <button on:click={handleSave} disabled={isSaving || error}>
    {isSaving ? 'Saving...' : 'Save'}
  </button>
</div>

<style>
  .json-editor {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  textarea {
    width: 100%;
    font-family: monospace;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    min-height: 100px;
  }

  .invalid {
    border-color: red;
  }

  .error {
    color: red;
    font-size: 0.8rem;
  }

  button {
    align-self: flex-end;
    padding: 6px 12px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: #45a049;
  }

  button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
</style>
