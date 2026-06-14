import { FormEventHandler, InputEvent } from "react";

export default function Input({
	classes,
	placeholder,
	type,
	default_value,
	children,
	ref,
	action,
}: {
	classes?: string;
	ref?: React.RefObject<HTMLInputElement | null>;
	placeholder?: string;
	default_value?: string | number;
	type: "number" | "text" | "email" | "password";
	children?: React.ReactNode;
	action?: FormEventHandler<HTMLInputElement>;
}) {
	return (
		<input onInput={action} ref={ref} type={type} placeholder={placeholder} defaultValue={default_value} className={`bg-black/30 backdrop-blur-[3px] border-black/30 border-3 rounded-xl p-4 outline-0 ${classes}`}>
			{children}
		</input>
	);
}
