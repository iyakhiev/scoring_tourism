<script>
	import Dir from '$lib/components/dir.svelte'

	const name = 'marginEBITDA'
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
			dirName: 'hotelRating',
			name: 'hotelRating',
			title: 'Звездность гостиницы',
			default: 'Выберите тип',
		},
		{
			type: 'value',
			name: 'value',
			title: 'EBITDA, %',
			fields: [
				{
					name: 'from',
					placeholder: '%',
					title: 'от'
				},
				{
					name: 'to',
					placeholder: '%',
					title: 'до'
				}
			]
		}
	]
</script>

<Dir {name} {structure}/>