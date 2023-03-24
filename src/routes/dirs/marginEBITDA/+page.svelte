<script>
	import Dir from '$lib/components/dir.svelte'

	const name = 'marginEBITDA'
	const structure = [
		{
			type: 'dir',
			dirName: 'region',
			name: 'region',
			title: 'Регион&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
			default: 'Выберите регион'
		},
		{
			type: 'dir',
			dirName: 'buildingType',
			name: 'buildingType',
			title: 'Тип объекта',
			default: 'Выберите тип объекта'
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