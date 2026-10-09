/**
 * Badge style utility functions for learning history, quizzes, and curriculum roadmaps.
 * Extracted to avoid violating fast-refresh rules (react-refresh/only-export-components)
 * in component files.
 */

export function getSkillBadgeClasses(skill: string | null | undefined): string {
    if (!skill) return "border border-cyan-200 bg-cyan-50 text-[#005596] dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300";
    const s = skill.toLowerCase().trim();
    if (s.startsWith("d")) return "border border-cyan-200 bg-cyan-50 text-[#005596] dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300";
    if (s.startsWith("c")) return "border border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300";
    if (s.startsWith("t")) return "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300";
    if (s.startsWith("g") || s.startsWith("b")) return "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    return "border border-cyan-200 bg-cyan-50 text-[#005596] dark:border-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300";
}

export function getSkillTextClass(skill: string | null | undefined): string {
    if (!skill) return "text-[#005596] dark:text-cyan-300";
    const s = skill.toLowerCase().trim();
    if (s.startsWith("d")) return "text-[#005596] dark:text-cyan-300";
    if (s.startsWith("c")) return "text-teal-700 dark:text-teal-300";
    if (s.startsWith("t")) return "text-rose-700 dark:text-rose-300";
    if (s.startsWith("g") || s.startsWith("b")) return "text-amber-700 dark:text-amber-300";
    return "text-[#005596] dark:text-cyan-300";
}

export function getDifficultyBadgeClasses(difficulty: string | null | undefined): string {
    if (!difficulty) return "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    const d = difficulty.toLowerCase().trim();
    if (d.includes("basic") || d.includes("begin") || d.includes("easy")) {
        return "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";
    }
    if (d.includes("inter") || d.includes("med")) {
        return "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300";
    }
    if (d.includes("adv") || d.includes("hard") || d.includes("exp")) {
        return "border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300";
    }
    return "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

export function getTrackBadgeClasses(track: string | null | undefined): string {
    if (!track) return "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
    const t = track.toLowerCase().trim();
    if (t.includes("basic") || t.includes("begin") || t.includes("foundation")) {
        return "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
    }
    if (t.includes("inter") || t.includes("med")) {
        return "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300";
    }
    if (t.includes("adv") || t.includes("expert") || t.includes("master")) {
        return "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300";
    }
    return "border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300";
}
