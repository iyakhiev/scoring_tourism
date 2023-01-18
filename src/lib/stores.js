import { writable } from 'svelte/store'

export const DIRs = writable({})
export const projects = writable([])

export function setDirs(dirs) {
	DIRs.set(dirs.reduce((acc, dir) => {
		acc[dir.type] = dir
		return acc
	}, {}))
}