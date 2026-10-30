import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767px) and (pointer: coarse)";

function subscribe(onChange: () => void) {
	const media = window.matchMedia(QUERY);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
}

export function useNarrowShell() {
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(QUERY).matches,
		() => false,
	);
}
