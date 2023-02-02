import { projects } from '$lib/db/projects'
import { ObjectId } from 'mongodb'

export async function load({ params }) {
	const res = await projects.findOne({ _id: new ObjectId(params.slug) })

	return {
		project: JSON.parse(JSON.stringify(res))
	}
}