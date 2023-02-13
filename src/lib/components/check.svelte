<script>
	import { createEventDispatcher } from 'svelte'
	import Tooltip from '$lib/components/tooltip.svelte'

	export let label
	export let name
	export let checked
	export let tip

	const dispatch = createEventDispatcher()
</script>

<div class="form-control flex-row items-center">
	<label class="label cursor-pointer flex-row-reverse gap-5 justify-end">
		<span class="label-text">{label}</span>
		<input
				on:change={() => dispatch('change')}
				bind:checked
				{name}
				type="checkbox"
				class="checkbox checkbox-secondary"/>
	</label>
	{#if tip}
		<Tooltip content={tip}/>
	{/if}
</div>