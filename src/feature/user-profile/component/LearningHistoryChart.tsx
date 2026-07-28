import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/component/ui/card";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

const data = [
    { day: "Mon", hour: 1 },
    { day: "Tue", hour: 2 },
    { day: "Wed", hour: 1.5 },
    { day: "Thu", hour: 3 },
    { day: "Fri", hour: 2 },
    { day: "Sat", hour: 4 },
    { day: "Sun", hour: 2.5 },
];

export function LearningHistoryChart() {

    return (

        <Card>

            <CardHeader>

                <CardTitle>

                    Learning History

                </CardTitle>

            </CardHeader>

            <CardContent className="h-72">

                <ResponsiveContainer width="100%" height="100%">

                    <LineChart data={data}>

                        <CartesianGrid strokeDasharray="3 3" />

                        <XAxis dataKey="day" />

                        <YAxis />

                        <Tooltip />

                        <Line
                            type="monotone"
                            dataKey="hour"
                            stroke="#2563eb"
                            strokeWidth={3}
                        />

                    </LineChart>

                </ResponsiveContainer>

            </CardContent>

        </Card>

    );
}