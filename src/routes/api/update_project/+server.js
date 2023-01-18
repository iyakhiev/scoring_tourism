import { projects } from '$lib/db/projects'
import { ObjectId } from 'mongodb'

export const POST = async function ({ request }) {
	const { project, id } = await request.json()

	const res = await projects.updateOne({ _id: new ObjectId(id) }, { $set: project })

	return new Response(JSON.stringify({ res }))
}