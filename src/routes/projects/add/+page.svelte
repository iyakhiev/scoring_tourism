<script>
	import Input from '$lib/components/input.svelte'
	import Select from '$lib/components/select.svelte'
	import { goto } from '$app/navigation'
	import { DIRs } from '$lib/stores'
	import { PROJECT_STATUS_ENUM } from '$lib/enums'

	let agreeWithTerms = false
	let project = {
		projectName: '',
		region: '',
		buildingType: '',
		status: PROJECT_STATUS_ENUM.CREATED.name
	}

	function addProject() {
		if (!project.projectName || !project.projectName.trim())
			return

		project.projectName = project.projectName.trim()

		fetch('/api/add_project', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ project })
		})
			.then(res => res.json())
			.then(res => {
				console.log('add_project(), res', res)

				if (res.redirect)
					goto('/')
				if (res?.res?.insertedId)
					goto(`/project/${res?.res?.insertedId}`)
			})
	}
</script>

{#if agreeWithTerms}
	<div class="flex items-center justify-between my-10 px-3 md:px-10">
		<div class="text-2xl md:text-3xl">Новый проект</div>
		<a href="/projects" class="btn btn-outline">Закрыть</a>
	</div>
	<div class="flex flex-col gap-2">
		<Input name="theProjectName"
		       label="Название"
		       placeholder="Название проекта"
		       bind:value={project.projectName}/>
		<Select name="theProjectRegion"
		        label="Регион"
		        title="Выберите регион"
		        options={$DIRs['region']?.values}
		        bind:value={project.region}
		/>
		<Select name="theProjectBuildingType"
		        label="Тип объекта"
		        title="Выберите тип объекта"
		        options={$DIRs['buildingType']?.values}
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
	<div class="flex justify-end mt-10">
		<button class="btn btn-outline btn-secondary"
		        on:click={addProject}
		        class:pointer-events-none={!project?.projectName.trim()}
		        class:opacity-50={!project?.projectName.trim()}>
			Сохранить
		</button>
	</div>
{:else}
	<div class="my-10 mx-auto text-center text-xl">
		Уважаемый инициатор инвестиционного проекта!
		<br>
		Для проведения оценки вашего проекта предлагаем заполнить анкету, содержащую набор необходимых показателей.
		<br>
		Нажимая кнопку "Продолжить", вы соглашаетесь с обработкой представленных данных.
		<br>
		АО «Корпорация Туризм.РФ» гарантирует безопасность представленных данных.
	</div>
	<div class="flex items-center justify-center gap-10 my-10 px-3 md:px-10">
		<a href="/projects" class="btn btn-outline">Закрыть</a>
		<button class="btn btn-outline" on:click={() => agreeWithTerms = true}>Продолжить</button>
	</div>
{/if}