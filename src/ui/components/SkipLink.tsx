// src/ui/components/SkipLink.tsx
export function SkipLink() {
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		const main = document.getElementById("main-content");
		if (main) {
			main.focus();
			main.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<a
			href="#main-content"
			onClick={handleClick}
			className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:bg-(--app-cta) focus:text-(--app-cta-text) focus:px-4 focus:py-2 focus:rounded-md focus:ring-2 focus:ring-(--app-focus-ring)"
		>
			Skip to main content
		</a>
	);
}
