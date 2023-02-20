import { dirs } from '$lib/db/dirs'

export async function load({ cookies }) {
	const res = await dirs
		.find({ type: 'select' })
		.toArray()

	return {
		dirs: JSON.parse(JSON.stringify(res)),
		access: cookies.get('access')
	}
}