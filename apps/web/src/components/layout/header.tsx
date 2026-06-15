import { SidebarTrigger } from "@agentclave/ui/components/sidebar";
import { Separator } from "@agentclave/ui/components/separator";
import { AnimatedThemeToggler } from "@agentclave/ui/components/animated-theme-toggler";

export function Header() {
	return (
		<header className="bg-background/60 sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 backdrop-blur-md md:h-14 border-b">
			<div className="flex items-center gap-2 px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 h-8" />
			</div>

			<div className="flex items-center gap-2 px-4">
				<AnimatedThemeToggler
					variant="circle"
					className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
				/>
			</div>
		</header>
	);
}
