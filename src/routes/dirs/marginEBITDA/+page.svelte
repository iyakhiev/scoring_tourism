<script>
	import Dir from '$lib/components/dir.svelte'

	const type = 'marginEBITDA'
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
					name: 'value',
					placeholder: '%',
				}
			]
		}
	]
</script>

<Dir {type} {structure}/>