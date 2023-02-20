<script>
	export let data
	let projects = []

	$: {
		console.log('projects/layout, data', data)
		projects = data?.projects || []
	}
</script>

<div class="flex items-center justify-between my-10 px-3 md:px-10">
	<div class="text-2xl md:text-3xl">Проекты:</div>
	<a href="/projects/add" class="btn btn-outline btn-secondary hover:text-white">
		Создать проект
	</a>
</div>
<div class="flex flex-col gap-5">
	{#each projects as project}
		<div class="card bg-base-100 shadow-lg border">
			<div class="card-body md:flex-row p-4 md:p-6">
				<h2 class="card-title">{project.name}</h2>
				<div class="card-actions flex-col justify-end ml-auto mt-2 md:mt-0 shrink-0">
					<a href="/project/{project._id}?role=investor" class="btn btn-secondary btn-outline">
						Открыть для инвестора
					</a>
					<a href="/project/{project._id}?role=security" class="btn btn-secondary btn-outline">
						Открыть для СБ
					</a>
					<a href="/project/{project._id}?role=manager" class="btn btn-secondary btn-outline">
						Открыть для менеджера
					</a>
				</div>
			</div>
		</div>
	{/each}
</div>
