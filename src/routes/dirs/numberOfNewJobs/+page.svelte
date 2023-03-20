<script>
	import Dir from '$lib/components/dir.svelte'

	const name = 'numberOfNewJobs'
	const structure = [
		{
			type: 'dir',
			dirName: 'buildingType',
			name: 'buildingType',
			title: 'Тип объекта',
			default: 'Выберите тип объекта'
		},
		{
			type: 'dir',
			dirName: 'buildingCategory',
			name: 'buildingCategory',
			title: 'Категория объекта',
			default: 'Выберите категорию объекта',
			defaultEnabled: true
		},
		{
			type: 'dir',
			dirName: 'hotelRating',
			name: 'hotelRating',
			title: 'Звездность гостиницы',
			default: 'Выберите тип',
			defaultEnabled: true
		},
		{
			type: 'value',
			name: 'value',
			title: 'Кол-во сотрудников на 1 номер, чел.',
			fields: [
				{
					name: 'from',
					placeholder: 'чел.',
					title: 'от'
				},
				{
					name: 'to',
					placeholder: 'чел.',
					title: 'до'
				}
			]
		}
	]
</script>

<Dir {name} {structure}/>