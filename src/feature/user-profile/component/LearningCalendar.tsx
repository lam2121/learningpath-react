import { Card, CardHeader, CardTitle, CardContent } from "@/shadcn/component/ui/card";

const calendar: [number, boolean][] = [
    [1, true], [2, true], [3, false], [4, true], [5, true], [6, false], [7, true],
    [8, true], [9, true], [10, true], [11, false], [12, true], [13, true], [14, true],
    [15, true], [16, false], [17, true], [18, true], [19, false], [20, true], [21, true],
    [22, true], [23, true], [24, false], [25, true], [26, true], [27, true], [28, false],
    [29, true], [30, true]
];

export function LearningCalendar() {

    return (

        <Card>

            <CardHeader>

                <CardTitle>

                    Learning Calendar

                </CardTitle>

            </CardHeader>

            <CardContent>

                <div className="grid grid-cols-7 gap-3">

                    {calendar.map(([day, done]) => (

                        <div
                            key={day}
                            className={`
                            h-12
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            font-medium
                            transition

                            ${done
                                    ? "bg-blue-500 text-white"
                                    : "bg-slate-100 text-slate-400"
                                }
                            `}
                        >

                            {day}

                        </div>

                    ))}

                </div>

            </CardContent>

        </Card>

    )

}