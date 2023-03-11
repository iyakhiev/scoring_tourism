<script>
	import Dir from '$lib/components/dir.svelte'

	const name = 'costPerSqMeter'
	const structure = [
		{
			type: 'dir',
			dirName: 'region',
			name: 'region',
			title: 'Регион&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;',
			default: 'Выберите регион'
		},
		{
			type: 'value',
			name: 'value',
			title: 'Стоимость 1 м²',
			fields: [
				{
					name: 'value',
					placeholder: 'руб.',
				}
			]
		}
	]
</script>

<Dir {name} {structure}/>