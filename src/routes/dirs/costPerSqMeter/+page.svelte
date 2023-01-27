<script>
	import Dir from '$lib/components/dir.svelte'

	const type = 'costPerSqMeter'
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
			default: 'Выберите тип объекта',
			defaultEnabled: true
		},
		{
			type: 'value',
			name: 'value',
			title: 'Стоимость 1 м², тыс. руб.',
			fields: [
				{
					name: 'value',
					placeholder: 'тыс. руб.',
				}
			]
		}
	]
</script>

<Dir {type} {structure}/>