<script>
	import { createEventDispatcher } from 'svelte'

	export let title = 'Выберите из списка'
	export let name = ''
	export let label = ''
	export let value = ''
	export let options = []
	export let defaultDisabled = true

	$: value = value === undefined ? '' : value
	$: options = Array.isArray(options) ? options : []

	const dispatch = createEventDispatcher()
</script>

<div class="form-control" style="min-width: 100px">
	{#if label}
		<label class="label" for="select-{name}">
			<span class="label-text">{label}</span>
		</label>
	{/if}
	<select class="select select-bordered w-full" id="select-{name}"
	        bind:value
	        on:change={() => dispatch('change')}
	>
		{#if defaultDisabled}
			<option disabled selected value="">{title}</option>
		{:else}
			<option selected value="">{title}</option>
		{/if}
		{#each options as option}
			<option value={option.name}>{option.title}</option>
		{/each}
	</select>
</div>