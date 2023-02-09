import { dirs } from '$lib/db/dirs'

export const POST = async function ({ request }) {
	const { name } = await request.json()

	const res = await dirs.findOne({ name })

	return new Response(JSON.stringify({ res }))
}