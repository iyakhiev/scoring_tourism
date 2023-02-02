const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {},
	},

	plugins: [require('daisyui')],
	daisyui: {
		// themes: ['emerald'],
		themes: [
			{
				emerald: {
					...require("daisyui/src/colors/themes")["[data-theme=emerald]"],
					'secondary': '#183a68',
					'.btn-primary:hover': {
						'color': '#fff !important',
					},
				},
			},
		]
	}
}

module.exports = config
