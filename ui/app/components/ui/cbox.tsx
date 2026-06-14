"use client";

import { useState } from "react";

export default function CBox({ parent_classes, classes, label, checked = false, action }: { parent_classes?: string; classes?: string; label?: string; checked?: boolean; action?: (checked: boolean) => void }) {
	const [isChecked, setIsChecked] = useState(checked);

	const toggle = () => {
		const next = !isChecked;
		setIsChecked(next);
		action?.(next);
	};

	return (
		<div className={`outline-none flex items-center  select-none w-fit ${parent_classes}`} role="checkbox" aria-checked={isChecked} tabIndex={0} onKeyDown={(e) => e.key === " " && toggle()}>
			{label && (
				<span onClick={toggle} className={`${isChecked ? "text-white" : "text-white/70"} leading-none cursor-pointer`}>
					{label}
				</span>
			)}
			<div
				onClick={toggle}
				className={`
          relative w-10 h-10 cursor-pointer rounded-md border-[1.5px] shrink-0
          bg-black/30 backdrop-blur-[3px] border-black/30
          transition-all duration-200 ease-in-out
          ${isChecked ? "bg-white/20 border-white/60" : "hover:border-white/30"}
          ${classes ?? ""}
        `}
			>
				<svg
					viewBox="0 0 10 8"
					fill="none"
					className={`
            absolute inset-0 m-auto w-3/4
            transition-all duration-150
            ${isChecked ? "opacity-100 scale-100" : "opacity-0 scale-50"}
          `}
				>
					<path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
				</svg>
			</div>
		</div>
	);
}
