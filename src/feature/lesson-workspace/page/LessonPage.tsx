import { useEffect, useState } from "react";
import { LessonSkeleton } from "../component/LessonSkeleton";
import { LessonWorkspace } from "../component/LessonWorkspace";

export function LessonPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000); // giả lập API mất 2 giây

        return () => clearTimeout(timer);
    }, []);
    if (loading) {
        return <LessonSkeleton />;
    }
    else {
        return <LessonWorkspace />;
    }
}