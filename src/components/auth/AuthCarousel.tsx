import { useEffect, useState } from 'react';
import type { Slide } from './slides';

interface AuthCarouselProps {
    slides: Slide[];
    intervalMs?: number;
}

export default function AuthCarousel({ slides, intervalMs = 6000 }: AuthCarouselProps) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % slides.length);
        }, intervalMs);
        return () => clearInterval(timer);
    }, [slides.length, intervalMs]);

    return (
        <>
            {slides.map((slide, index) => (
                <div
                    key={slide.url}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'
                        }`}
                >
                    <img
                        src={slide.url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                </div>
            ))}

            <div className="absolute bottom-0 left-0 right-0 p-12 xl:p-16">
                <div className="relative h-[80px]">
                    {slides.map((slide, index) => (
                        <p
                            key={slide.url}
                            className={`absolute inset-0 text-white text-2xl xl:text-3xl font-semibold leading-tight tracking-[-0.02em] max-w-md transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'
                                }`}
                        >
                            {slide.caption}
                        </p>
                    ))}
                </div>

                <div className="flex gap-1.5 mt-6">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setCurrent(i)}
                            aria-label={`Ir al slide ${i + 1}`}
                            className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
