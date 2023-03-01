<script>
	import NavBar from '$lib/components/navbar.svelte'
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'

	export let form
	export let data

	$: {
		if (browser && data?.access)
			goto('/projects')
	}
</script>

<NavBar authorized={false}/>
<div class="flex flex-col items-center px-10 pt-20 md:pt-40">
	<form method="POST" class="w-full max-w-sm flex flex-col items-center gap-5">
		<div class="form-control w-full">
			<label class="label" for="login">
				<span class="label-text">Логин</span>
			</label>
			<input id="login" type="text" name="login" placeholder="Логин" class="input input-bordered w-full"/>
		</div>
		<div class="form-control w-full">
			<label class="label" for="password">
				<span class="label-text">Пароль</span>
			</label>
			<input id="password" type="password" name="password" placeholder="Пароль" class="input input-bordered w-full"/>
		</div>
		<div class="flex flex-col items-center w-full mt-5">
			{#if form?.error}
				<p class="mb-5 text-accent">Неверный логин или пароль</p>
			{/if}
			<button class="btn btn-outline btn-secondary w-full max-w-xs">Войти</button>
		</div>
	</form>
</div>
