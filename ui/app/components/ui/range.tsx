import { UI } from "@/app/classes/ui";
import { useRef, useState } from "react";

export default function RangeInp({ classes, label, min, max, defaultVal = (max + min) / 2, action }: { classes?: string; label?: string; defaultVal?: number; min: number; max: number; action?: (v: number) => void }) {
	const [value, setValue] = useState<number>(defaultVal);
	const [active, setActive] = useState<boolean>(false);
	const val_inp = useRef<HTMLInputElement>(null);
	const container = useRef<HTMLDivElement>(null);
	const slider = useRef<HTMLDivElement>(null);

	function mouseDown(e: React.MouseEvent) {
		e.preventDefault();
		if (!container.current || !slider.current) return;
		setActive(true);

		function mouseUp() {
			setActive(false);
			window.removeEventListener("mouseup", mouseUp);
			window.removeEventListener("mousemove", mouseMove);
		}
		function mouseMove({ clientX }: MouseEvent) {
			if (!container.current || !slider.current) return;

			const w = container.current.clientWidth,
				left = container.current.getBoundingClientRect().x,
				x = clientX - left;

			const p = Math.max(Math.min(x / w, 1), 0) * 100;

			slider.current.style.left = p + "%";

			const next = Math.max(min, max > 1 ? Math.floor((p * max) / 100) : +((p * max) / 100).toFixed(2));
			setValue(next);

			action?.(next);
		}

		window.addEventListener("mouseup", mouseUp);
		window.addEventListener("mousemove", mouseMove);
	}

	return (
		<div className={`${classes} gap-8 flex justify-between items-center w-full`}>
			{label && <p className="text-[16px]">{label}</p>}
			<input
				type="number"
				min={min}
				max={max}
				value={value}
				onInput={() => {
					if (!val_inp.current?.value) return;

					const v = Math.max(min, Math.min(max, +val_inp.current.value));
					if (slider.current) slider.current.style.left = (v / max) * 100 + "%";

					const next = Math.max(min, max > 1 ? Math.floor(v) : v);
					setValue(next);
					action?.(next);
				}}
				ref={val_inp}
				className="outline-none"
			/>
			<div ref={container} className="w-full h-4 rounded-2xl relative" style={{ backgroundColor: UI.clrs.tertiary }} onMouseDown={mouseDown}>
				<div
					className={`slider w-6 aspect-square cursor-pointer rounded-full absolute top-1/2 -translate-1/2 ${active ? "border-6" : "border-3 "}`}
					onMouseDown={mouseDown}
					onMouseUp={() => setActive(false)}
					style={{ backgroundColor: UI.clrs.primary, borderColor: UI.clrs.tertiary }}
					ref={slider}
				></div>
			</div>
		</div>
	);
}
