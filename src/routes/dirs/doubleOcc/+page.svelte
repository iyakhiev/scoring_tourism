<script>
	import Dir from '$lib/components/dir.svelte'

	const type = 'doubleOcc'
	const structure = [
		{
			type: 'dir',
			dirName: 'regions',
			name: 'region',
			title: 'Регион',
			default: 'Выберите регион'
		},
		{
			type: 'dir',
			dirName: 'buildingTypes',
			name: 'buildingType',
			title: 'Тип объект',
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
			type: 'value',
			name: 'value',
			title: 'Кол-во гостей, чел./номер',
			fields: [
				{
					name: 'from',
					placeholder: 'чел./номер',
					title: 'от'
				},
				{
					name: 'to',
					placeholder: 'чел./номер',
					title: 'до'
				}
			]
		}
	]
</script>

<Dir {type} {structure}/>