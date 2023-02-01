import { writable } from 'svelte/store'

export const DIRs = writable({})
export const projects = writable([])

export function setDirs(dirs) {
	DIRs.set(dirs.reduce((acc, dir) => {
		dir.values.sort((a, b) => {
			if (a.title < b.title)
				return -1
			if (a.title > b.title)
				return 1
			return 0
		})

		acc[dir.type] = dir
		return acc
	}, {}))
}