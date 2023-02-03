<script>
	import NavBar from '$lib/components/navbar.svelte'
</script>

<NavBar/>
<div class="px-5 md:px-10 pb-20">
	<div class="max-w-7xl mx-auto">
		<slot/>
	</div>
</div>