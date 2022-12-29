import { dirs } from '$lib/db/dirs'

export async function load() {
	console.log('load')

	const res = await dirs
		.find()
		.toArray()

	return {
		dirs: JSON.parse(JSON.stringify(res))
	}
}