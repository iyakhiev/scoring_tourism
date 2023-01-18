import { projects } from '$lib/db/projects'

export async function load () {
	const res = await projects
		.find({}, {
			projection: {
				_id: 1,
				name: 1
			}
		})
		.toArray()

	return {
		projects: JSON.parse(JSON.stringify(res)),
	}
}