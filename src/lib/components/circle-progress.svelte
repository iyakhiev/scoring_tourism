<script>
	export let progress
	export let color = 'conic-gradient(orange 0deg, yellow 90deg, lightgreen 180deg, green)'

	$: angle = 360 * progress

	$: background = `radial-gradient(white 50%, transparent 51%),
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