<script>
	import { createEventDispatcher } from 'svelte'

	export let name = undefined
	export let value = undefined
	export let label = undefined
	export let placeholder = undefined
	export let min = undefined
	export let max = undefined
	export let type = 'text'

	const handleInput = (e) => {
		// in here, you can switch on type and implement
		// whatever behaviour you need
		value = type.match(/^(number|range)$/)
			? +e.target.value
			: e.target.value
	}

	const dispatch = createEventDispatcher()
</script>

<div class="form-control w-full p-5">
	<label class="label" for="input-{name}">
		<span class="label-text">{@html label}</span>
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