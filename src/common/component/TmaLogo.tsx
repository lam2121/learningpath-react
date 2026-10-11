import APP_LOGO from "@/asset/image/careerpath_logo.png";
import { cn } from "@/shadcn/lib/util";

export function TmaLogo({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div className={
			cn("w-full h-full bg-primary rounded-full flex items-center justify-center overflow-hidden p-1.5", className)}{...props}>
			<img src={APP_LOGO} alt="AI Learning Path" className="max-w-full max-h-full object-contain" />
		</div>
	);
}

export const AppLogo = TmaLogo;
