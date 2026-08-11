import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router"

const slides = [
    "https://www.tmasolutions.vn/images/icons/GioiThieuTma/6-van-phong-tai-viet-nam.webp",
    "https://www.tmasolutions.vn/images/imgs/TrangChu/Banner/banner-01.webp",
    "https://www.tma.vn/images/news/news_content_0_20250515161434.107.webp",
    "https://www.tma.vn/images/news/news_content_1_20250515161438.035.webp",
    "https://www.tmasolutions.vn/images/imgs/GiaiPhapDotPha/giai-phap-dot-pha-1.webp",
    "https://www.tmasolutions.vn/images/icons/GioiThieuTma/26-nam-phat-trien.webp",
    "https://www.tmasolutions.vn/images/icons/GioiThieuTma/thanh-lap-1997.webp",
];

export function Home() {
    const [current, setCurrent] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const containerWidthRef = useRef<HTMLDivElement>(null);

    const goTo = useCallback((index: number) => {
        setCurrent((index + slides.length) % slides.length);
    }, []);

    const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);
    const goNext = useCallback(() => goTo(current + 1), [current, goTo]);

    useEffect(() => {
        if (isDragging) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [isDragging]);

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragOffset(0);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setDragOffset(e.clientX - dragStartX);
    };

    const handlePointerUp = () => {
        if (!isDragging) return;
        const containerWidth = containerWidthRef.current?.offsetWidth || 1;
        const threshold = containerWidth * 0.15;

        if (dragOffset > threshold) {
            goPrev();
        } else if (dragOffset < -threshold) {
            goNext();
        }

        setIsDragging(false);
        setDragOffset(0);
    };

    return (
        <main className="flex-1">
            <div className="bg-background">
                <div className="h-full w-full md:w-4/5 px-4 md:px-0 mx-auto py-3 md:py-4">
                    <div className="flex flex-col gap-4 md:gap-5">
                        <div className="h-full flex flex-col md:flex-row items-center">
                            {/* Left panel: Hero text */}
                            <div className="w-full md:w-1/2 rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
                                <section className="container mx-auto px-4 py-4 md:py-6 my-0 md:my-5">
                                    <div className="text-left">
                                        <h1 className="mb-6 text-4xl font-bold md:text-5xl">
                                            Learn English
                                            <br />
                                            <span className="text-primary">
                                                Your Way, with AI
                                            </span>
                                        </h1>

                                        <p className="mx-auto mb-4 max-w-3xl text-lg leading-relaxed text-muted-foreground md:mb-6">
                                            Unlock your English potential with an AI-powered learning platform.
                                            Complete a placement assessment, receive a personalized learning path,
                                            and improve your skills through interactive lessons, quizzes, and
                                            daily practice designed just for you.
                                        </p>
                                        <div className="flex gap-4 justify-center items-center">
                                            <Link
                                                to="/login"
                                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-10 rounded-md px-6 has-[>svg]:px-4 font-semibold"
                                            >
                                                Start now
                                                <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
                                            </Link>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right panel: Carousel */}
                            <div className="w-full md:w-1/2 rounded-2xl border border-slate-200 bg-white/90 shadow-sm md:ml-3">
                                <section className="container mx-auto px-6 pt-2 md:pt-0">
                                    <div className="mb-0">
                                        <section className="container mx-auto px-4 py-4 md:py-6 my-0 md:my-5">
                                            <div className="mb-0 md:mb-16">
                                                <div className="w-full relative">
                                                    <div
                                                        role="region"
                                                        aria-roledescription="carousel"
                                                        className="relative w-full overflow-hidden rounded-2xl"
                                                    >
                                                        <div
                                                            className="overflow-hidden cursor-grab active:cursor-grabbing select-none"
                                                            ref={containerWidthRef}
                                                            onPointerDown={handlePointerDown}
                                                            onPointerMove={handlePointerMove}
                                                            onPointerUp={handlePointerUp}
                                                            onPointerLeave={handlePointerUp}
                                                        >
                                                            <div
                                                                className={`flex -ml-4 ${isDragging
                                                                    ? ""
                                                                    : "transition-transform duration-500 ease-in-out"
                                                                    }`}
                                                                style={{
                                                                    transform: `translate3d(calc(-${current * 100
                                                                        }% + ${dragOffset}px), 0px, 0px)`,
                                                                }}
                                                            >
                                                                {slides.map((src, index) => (
                                                                    <div
                                                                        key={index}
                                                                        role="group"
                                                                        aria-roledescription="slide"
                                                                        className="min-w-0 shrink-0 grow-0 basis-full pl-4"
                                                                    >
                                                                        <div className="text-card-foreground flex flex-col gap-2 rounded-xl border py-2 shadow-sm h-[17rem] bg-transparent !border-none overflow-hidden relative group">
                                                                            <div className="relative z-10 h-full flex justify-center items-center p-0 border-3 border-gray-400/50 rounded-xl overflow-hidden">
                                                                                <img
                                                                                    className="w-full h-full object-cover pointer-events-none"
                                                                                    src={src}
                                                                                    alt={`Slide ${index + 1}`}
                                                                                    draggable={false}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={goPrev}
                                                            aria-label="Previous slide"
                                                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] shadow-xs hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 absolute size-8 rounded-full left-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white border w-10 h-10 transition-all duration-300 hover:scale-110 hover:shadow-xl opacity-0 hover:opacity-100 group-hover:opacity-100"
                                                        >
                                                            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
                                                            <span className="sr-only">Previous slide</span>
                                                        </button>

                                                        <button
                                                            onClick={goNext}
                                                            aria-label="Next slide"
                                                            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] shadow-xs hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 absolute size-8 rounded-full right-2 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white border w-10 h-10 transition-all duration-300 hover:scale-110 hover:shadow-xl opacity-0 hover:opacity-100 group-hover:opacity-100"
                                                        >
                                                            <ArrowRight className="w-6 h-6" aria-hidden="true" />
                                                            <span className="sr-only">Next slide</span>
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-col items-center mt-2 space-y-4">
                                                        <div className="flex justify-center space-x-3">
                                                            {slides.map((_, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => goTo(index)}
                                                                    aria-label={`Go to slide ${index + 1}`}
                                                                    className={`relative transition-all duration-500 rounded-full h-2 ${index === current
                                                                        ? "w-8 bg-primary shadow-lg shadow-primary/50"
                                                                        : "w-2 bg-gray-400 hover:bg-muted-foreground/60 hover:scale-125"
                                                                        }`}
                                                                >
                                                                    {index === current && (
                                                                        <span className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" />
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground font-medium">
                                                            <span className="text-primary font-bold text-base">
                                                                {current + 1}
                                                            </span>
                                                            <span className="mx-1">/</span>
                                                            <span>{slides.length}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}