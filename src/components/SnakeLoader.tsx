import loaderIcon from '../assets/Loader/icon-trackmysign.png';

interface SnakeLoaderProps {
    size?: number;
    className?: string;
}

export default function SnakeLoader({ size = 100, className = "" }: SnakeLoaderProps) {
    const centerSize = size * 0.55;

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            {/* Central Icon */}
            <div
                className="absolute z-10 p-2 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20"
                style={{ width: centerSize, height: centerSize }}
            >
                <img
                    src={loaderIcon}
                    alt="Loading..."
                    className="w-full h-full object-contain brightness-0 invert"
                />
            </div>

            {/* Snake Circle */}
            <svg
                className="animate-spin-infinite"
                width={size}
                height={size}
                viewBox="0 0 100 100"
            >
                {/* Background Track */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={6}
                />
                {/* Active Snake */}
                <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#155dfc"
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset="150" // Más corto, dejando un hueco más grande entre los lados
                />
            </svg>
        </div>
    );
}
