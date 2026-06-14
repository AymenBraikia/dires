export default function Glass({ classes, children, onclick }: { classes?: string; children: React.ReactNode; onclick?: () => void }) {
	return (
		<div onClick={onclick} className={`bg-gray-950/20  backdrop-blur-[15px] border-gray-950/40 border-2 rounded-xl p-4 ${classes}`}>
			{children}
		</div>
	);
}
