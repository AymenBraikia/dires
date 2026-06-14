import { UI } from "@/app/classes/ui";
import { useState } from "react";

export default function OptionBtns({ classes, label, opts, active = 0, action }: { classes?: string; label?: string; opts: string[]; active?: number; action?: () => void }) {
	const [selected, setIsSelected] = useState<number>(active);
	return (
		<div className={`${classes} gap-8 flex justify-between items-center`}>
			{label && <p className="">{label}</p>}
			{opts.map((e, i) => (
				<Btn
					key={e + i}
					c={e}
					a={selected == i}
					e={() => {
						if (selected == i) return;
						setIsSelected(i);
						action?.();
					}}
				/>
			))}
		</div>
	);
}

function Btn({ c, a = false, e }: { c: string; a?: boolean; e?: () => void }) {
	return (
		<button className={`${a ? "opacity-100" : "opacity-50"} rounded-2xl text-xl outline-none p-4 border-3`} style={{ borderColor: UI.clrs.tertiary, backgroundColor: UI.clrs.primary }} onClick={e}>
			{c}
		</button>
	);
}
