<script>
	import { page } from '$app/stores'
	import { investors } from '$lib/stores'

	export let data

	$: {
		console.log('projects/layout, data', data)
		investors.set(data?.investors || [])
	}
</script>

<div class="flex divide-x min-h-screen">
	<div class="w-3/12 flex flex-col items-center p-10">
		<div class="text-center text-2xl font-light mb-5">Проекты:</div>
		<div class="flex flex-col items-center w-full divide-y">
			{#each $investors as investor}
				<a href="/projects/{investor._id}" class="p-5 w-full text-center hover:bg-blue-50 cursor-pointer"
				   class:bg-blue-100={$page.params.slug === investor._id}>
					{investor.name}
				</a>
			{/each}
		</div>
	</div>
	<div class="w-9/12 p-10">
		<slot/>
	</div>
</div>