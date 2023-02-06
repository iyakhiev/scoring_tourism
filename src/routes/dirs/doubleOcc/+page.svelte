<script>
	import Dir from '$lib/components/dir.svelte'

	const type = 'doubleOcc'
	const structure = [
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