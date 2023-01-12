<script>
	import { createEventDispatcher } from 'svelte'

	export let label
	export let name
	export let checked

	const dispatch = createEventDispatcher()
</script>

<div class="form-control">
	<label class="label cursor-pointer flex-row-reverse gap-5 justify-end">
		<span class="label-text">{label}</span>
		<input
				on:change={() => dispatch('change')}
				bind:checked
				{name}
				type="checkbox"
				class="checkbox checkbox-primary"/>
	</label>
</div>