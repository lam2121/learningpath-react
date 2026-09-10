import CAREERPATH_LOGO from "@/asset/image/careerpath_logo.png";
import { cn } from "@/shadcn/lib/util";

export function CareerPathLogo({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div className={
			cn("w-full h-full bg-primary rounded-full flex items-center justify-center overflow-hidden p-2", className)}{...props}>
			<img src={CAREERPATH_LOGO} alt="CareerPath" className="max-w-full max-h-full object-contain" />
		</div>
	);
}
