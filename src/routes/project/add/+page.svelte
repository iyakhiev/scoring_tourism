<script>
	import { DIRs } from '$lib/stores'
	import { projects } from '$lib/stores'
	import { goto } from '$app/navigation'
	import Select from '$lib/components/select.svelte'
	import Input from '$lib/components/input.svelte'

	let project = {
		name: '',
		region: '',
		buildingType: ''
	}

	function addProject() {
		if (!project.name || !project.name.trim())
			return

		project.name = project.name.trim()

		fetch('/api/add_project', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project })
		})
			.then(res => res.json())
			.then(res => {
				console.log('add_project(), res', res)

				if (res?.res?.insertedId) {
					project._id = res?.res?.insertedId
					projects.update(arr => {
						arr.push(project)
						return arr
					})

					goto(`/project/${project._id}`)
				}
			})
	}
</script>

<div class="p-10">
	<div class="flex justify-between">
		<div class="text-2xl font-light">Новый проект</div>
		<a href="/projects" class="btn btn-outline">Закрыть</a>
	</div>
	<div class="flex flex-col gap-2">
		<Input name="theProjectName"
		       label="Название"
		       placeholder="Название проекта"
		       bind:value={project.name}/>
		<Select name="theProjectRegion"
		        label="Регион"
		        title="Выберите регион"
		        options={$DIRs['regions']?.values}
		        bind:value={project.region}
		/>
		<Select name="theProjectBuildingType"
		        label="Тип объекта"
		        title="Выберите тип объекта"
		        options={$DIRs['buildingTypes']?.values}
		        bind:value={project.buildingType}
		/>
		<Select name="theProjectBuildingCategory"
		        label="Категория объекта"
		        title="Выберите категорию объекта"
		        options={$DIRs['buildingCategory']?.values}
		        defaultDisabled={false}
		        bind:value={project.buildingCategory}
		/>
	</div>
	<div class="flex justify-between mt-10">
		<button class="btn btn-outline btn-primary"
		        on:click={addProject}
		        class:btn-disabled={!project?.name.trim()}>
			Добавить
		</button>
	</div>
</div>