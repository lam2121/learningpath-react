type Props = {
    reverse?: boolean;
};

export function RoadConnector({
    reverse,
}: Props) {
    return (
        <svg
            width="220"
            height="120"
            viewBox="0 0 220 120"
        >
            <defs>

                <linearGradient
                    id="roadGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                >

                    <stop
                        offset="0%"
                        stopColor="#3b82f6"
                    />

                    <stop
                        offset="100%"
                        stopColor="#8b5cf6"
                    />

                </linearGradient>

            </defs>

            <path
                d={
                    reverse
                        ? "M180 0 C180 60 40 60 40 120"
                        : "M40 0 C40 60 180 60 180 120"
                }

                fill="none"

                stroke="url(#roadGradient)"

                strokeWidth="8"

                strokeLinecap="round"

                strokeDasharray="12 12"
            />
        </svg>
    );
}