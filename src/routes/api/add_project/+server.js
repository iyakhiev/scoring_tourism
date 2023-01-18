import { projects } from '$lib/db/projects'

export const POST = async function ({ request }) {
	const { project } = await request.json()

	const res = await projects.insertOne(project)

	return new Response(JSON.stringify({ res }))
}