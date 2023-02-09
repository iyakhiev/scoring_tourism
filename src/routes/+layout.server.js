import { dirs } from '$lib/db/dirs'

export async function load() {
	const res = await dirs
		.find({
			type: 'select'
		})
		.toArray()

	return {
		dirs: JSON.parse(JSON.stringify(res))
	}
}