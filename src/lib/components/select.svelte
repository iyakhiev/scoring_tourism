<script>
	import { createEventDispatcher } from 'svelte'

	export let title = 'Выберите из списка'
	export let name = ''
	export let label = ''
	export let value = ''
	export let options = []
	export let valueField = 'value'
	export let defaultDisabled = true

	$: value = value === undefined ? '' : value
	$: options = Array.isArray(options) ? options : []

	const dispatch = createEventDispatcher()
</script>

<div class="form-control">
	<label class="label" for="select-{name}">
		<span class="label-text">{label}</span>
	</label>
	<select class="select select-bordered w-full" id="select-{name}"
	        on:change={() => dispatch('change')}
	        bind:value>
		{#if defaultDisabled}
			<option disabled selected value="">{title}</option>
		{:else}
			<option selected value="">{title}</option>
		{/if}
		{#each options as option}
			<option value={option[valueField]}>{option.title}</option>
		{/each}
	</select>
</div>