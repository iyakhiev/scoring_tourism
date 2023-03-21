<script>
	import Dir from '$lib/components/dir.svelte'

	const name = 'averageLengthOfStay'
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
			title: 'Продолжительность пребывания, сутки',
			fields: [
				{
					name: 'value',
					placeholder: 'Среднее кол-во суток',
				}
			]
		}
	]
</script>

<Dir {name} {structure}/>