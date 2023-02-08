<script>
	import { createEventDispatcher } from 'svelte'
	import Tooltip from '$lib/components/tooltip.svelte'

	export let name
	export let value
	export let label
	export let tip
	export let min
	export let max
	export let placeholder = ''
	export let type = 'text'

	$: value = value === undefined ? '' : value

	const handleInput = (e) => {
		// in here, you can switch on type and implement
		// whatever behaviour you need
		value = type.match(/^(number|range)$/)
			? +e.target.value
			: e.target.value
	}

	const dispatch = createEventDispatcher()
</script>

<div class="form-control w-full">
	<label class="label" for="input-{name}">
		<span class="label-text">{@html label}</span>
		{#if tip}
			<Tooltip content={tip}/>
		{/if}
	</label>
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
	/>
</div>