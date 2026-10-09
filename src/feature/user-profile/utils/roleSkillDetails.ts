import type { JobRole } from "@/feature/onboarding/api/onboardingApi";

export interface RoleSkillDetail {
    roleName: string;
    skillKey: string;
    skillLabel: string;
    description: string;
    exampleQuestions: string[];
    baselineWeight?: number;
}

/**
 * Extracts role-specific skill definition directly from the DB JobRole record.
 * Uses data stored in the database (`job_role.skill_definitions` & `job_role.baseline`).
 * Dynamically resolves description according to the active language (`vi`, `jp`, or `en`).
 */
export function getRoleSkillDetail(
    role: JobRole | null | undefined,
    skillKey: string,
    fallbackLabel: string,
    lang?: string,
): RoleSkillDetail {
    const rawDef = role?.skill_definitions?.[skillKey as keyof typeof role.skill_definitions];
    const baselineWeight = role?.baseline
        ? Number((role.baseline as Record<string, number>)[skillKey] ?? 25)
        : undefined;

    const normalizedLang =
        lang?.toLowerCase().startsWith("jp") || lang?.toLowerCase().startsWith("ja")
            ? "jp"
            : lang?.toLowerCase().startsWith("vi")
            ? "vi"
            : "en";

    let description = "";
    if (rawDef?.description) {
        if (typeof rawDef.description === "object") {
            const descObj = rawDef.description as Record<string, string>;
            description =
                descObj[normalizedLang] ||
                descObj.en ||
                Object.values(descObj)[0] ||
                "";
        } else {
            description = String(rawDef.description);
        }
    }

    return {
        roleName: role?.name?.trim() || "Career Track",
        skillKey,
        skillLabel: fallbackLabel,
        description: description.trim(),
        exampleQuestions: rawDef?.example_questions ?? [],
        baselineWeight,
    };
}
