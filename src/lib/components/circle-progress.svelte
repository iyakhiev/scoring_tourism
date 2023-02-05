<script>
	export let progress
	const angle = 360 * progress
	const color = progress < 0.25 ? 'red' : progress < 0.5 ? 'orange' : progress < 0.75 ? 'yellowgreen' : 'green'

	// Adapt the logic according to the approach
	const background = `radial-gradient(white 50%, transparent 51%),
    conic-gradient(transparent 0deg ${angle}deg, gainsboro ${angle}deg 360deg),
    ${color};`

	$: cssVarStyles = `--background:${background}`
</script>

<style>
    #progress-circle {
        background: var(--background);
        border-radius: 50%;
        width: 50px;
        height: 50px;
        transition: all 500ms ease-in;
        will-change: transform;
	    flex-shrink: 0;
    }
</style>

<div id="progress-circle" style="{cssVarStyles}"></div>