import { MouseEvent } from "react";

export default function Button({ active = true, classes, ref, content, action }: { active?: boolean; classes?: string; ref?: React.RefObject<HTMLButtonElement | null>; content: string; action?: (e?: MouseEvent) => void }) {
	return (
		<button ref={ref} onClick={() => active && action && action()} className={`rounded-xl bg-gradient-to-br from-green-400 to-green-600 p-4 font-bold text-xl ${classes} ${!active && "cursor-not-allowed brightness-75"}`}>
			{content}
		</button>
	);
}
