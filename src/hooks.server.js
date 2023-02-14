import { start_mongo } from '$lib/db/mongo'
import { redirect } from '@sveltejs/kit'

start_mongo()
	.then(() => {
		console.log('Mongo started')
	})
	.catch(e => {
		console.error(e)
	})

export async function handle({ event, resolve }) {
	console.log('server, route', event.route)
	console.log('server, access', event.cookies.get('access'))

	if (event.route.id !== '/' && !event.cookies.get('access'))
		if (event.route.id.includes('/api'))
			return new Response(JSON.stringify({ redirect: true }))
		else
			throw redirect(302, '/')

	return resolve(event)
}