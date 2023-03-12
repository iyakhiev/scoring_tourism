<script>
	import { createEventDispatcher } from 'svelte'
	import Tooltip from '$lib/components/tooltip.svelte'

	export let name
	export let value
	export let label
	export let bottomLabel
	export let tip
	export let min
	export let max
	export let placeholder = ''
	export let type = 'text'
	export let transformer
	export let disabled = false

	$: {
		value = value === undefined ? '' : value
		// console.log('$')
		if (typeof transformer === 'function')
			transform(value)
	}

	$: disabled = disabled ? 'disabled' : ''

	function transform(n) {
		const updatedValue = transformer(n, value)
		// console.log('transform', updatedValue)
		if (value === updatedValue)
			value = '&nbsp;'
		value = updatedValue
	}

	const handleInput = (e) => {
		// in here, you can switch on type and implement
		// whatever behaviour you need
		if (typeof transformer === 'function')
			transform(e.target.value)
		else
			value = type.match(/^(number|range)$/)
				? +e.target.value
				: e.target.value

		// console.log('handleInput', value)
	}

	const dispatch = createEventDispatcher()
</script>

<div class="form-control w-full">
	{#if label}
		<label class="label" for="input-{name}">
			<span class="label-text">{@html label}</span>
			{#if tip}
				<Tooltip content={tip}/>
			{/if}
		</label>
	{/if}
	<input
			on:input={handleInput}
			on:change={() => dispatch('change')}
			{value}
			{min}
			{max}
			{name}
			{placeholder}
			{type}
			class="input input-bordered w-full"
			id="input-{name}"
			{disabled}
	/>
	{#if bottomLabel}
		<label class="label">
			<span class="label-text-alt">Референсные значения: {@html bottomLabel}</span>
		</label>
	{/if}
</div>