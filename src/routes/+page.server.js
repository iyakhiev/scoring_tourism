import { redirect } from '@sveltejs/kit'

export const actions = {
	default: async ({ cookies, request }) => {
		const formData = await request.formData()
		const login = formData.get('login')
		const password = formData.get('password')

		if (login === 'TRF' && password === 'scoring') {
			cookies.set('access', true, {
				path: '/',
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 7
			})
			throw redirect(302, '/projects')
		}

		return {
			error: true
		}
	}
}