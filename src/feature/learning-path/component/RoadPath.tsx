type RoadPathProps = {
    points: {
        x: number;
        y: number;
    }[];
};

export function RoadPath({
    points,
}: RoadPathProps) {

    if (points.length < 2) return null;

    const path = points
        .map((point, index) => {

            if (index === 0) {
                return `M ${point.x} ${point.y}`;
            }

            const prev = points[index - 1];

            const midY = (prev.y + point.y) / 2;

            return `
                C
                ${prev.x} ${midY},
                ${point.x} ${midY},
                ${point.x} ${point.y}
            `;
        })
        .join(" ");

    return (
        <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
        >
            <defs>

                <linearGradient
                    id="roadGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                >

                    <stop
                        offset="0%"
                        stopColor="#3B82F6"
                    />

                    <stop
                        offset="100%"
                        stopColor="#8B5CF6"
                    />

                </linearGradient>

            </defs>

            <path
                d={path}
                fill="none"
                stroke="url(#roadGradient)"
                strokeLinecap="round"
                strokeWidth="12"
                strokeLinejoin="round"
                strokeDasharray="20 14"
            />
        </svg>
    );
}