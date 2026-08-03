import {
  GraduationCap,
  BookOpen,
  Target,
  ChevronRight,
  History,
  CircleCheckBig,
  CirclePlay,
  Mail,
} from "lucide-react";
import { Link } from "@tanstack/react-router"
const steps = [
  { number: "01", label: "Choose Career" },
  { number: "02", label: "Complete Survey" },
  { number: "03", label: "Placement Test" },
  { number: "04", label: "AI Learning Path" },
];

const progressItems = [
  "Review completed lessons and quizzes",

  "Monitor vocabulary and grammar improvement",

  "Track daily learning streaks and achievements",

  "Receive personalized AI recommendations",

  "View your overall learning statistics",
];

export function Guide() {
  return (
    <main className="flex-1">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-gradient-to-br from-primary/5 via-background to-blue-50/30 dark:to-blue-950/10">
          <div className="max-w-4xl mx-auto px-6 py-14">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center justify-center rounded-md border text-xs font-medium w-fit whitespace-nowrap shrink-0 text-primary border-primary/30 gap-1.5 px-3 py-1">
                <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                TMA AI English Learning Path
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">
              How It Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Learn how AI creates your personalized English learning journey—from assessing your current level to generating lessons, quizzes, and daily study plans.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Section 1: About */}
          <section className="space-y-4 mb-16">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                1
              </span>
              About TMA AI English Learning Path
            </h2>
            <div className="pl-9">
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">
                  TMA AI English Learning Path
                </strong>{" "}
                is an intelligent platform designed to help learners improve their English through personalized learning experiences. By analyzing your current proficiency and learning goals, AI generates a customized learning path with interactive lessons, quizzes, and daily study plans to support continuous progress.
              </p>
            </div>
          </section>

          {/* Section 2: Test Types */}
          <section className="space-y-5 mb-16">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                2
              </span>
              Learning Experience
            </h2>
            <div className="pl-9 grid gap-4">
              <div className="flex gap-4 p-5 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                <div className="p-2.5 rounded-lg bg-blue-500/10 shrink-0 h-fit">
                  <BookOpen
                    className="w-5 h-5 text-blue-500"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Practice</span>
                    <span className="inline-flex items-center justify-center rounded-md font-medium w-fit whitespace-nowrap shrink-0 gap-1 text-xs px-2 py-0 h-5 border-0 bg-blue-500/15 text-blue-700">
                      Personalized Lessons
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Study AI-generated lessons that match your current English level. Each lesson includes vocabulary, grammar, reading, listening, and practical examples to build real communication skills.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-5 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                <div className="p-2.5 rounded-lg bg-amber-500/10 shrink-0 h-fit">
                  <Target
                    className="w-5 h-5 text-amber-500"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Exam</span>
                    <span className="inline-flex items-center justify-center rounded-md font-medium w-fit whitespace-nowrap shrink-0 gap-1 text-xs px-2 py-0 h-5 border-0 bg-amber-500/15 text-amber-700">
                      Adaptive Quizzes
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    After each lesson, complete interactive quizzes to reinforce your knowledge. AI adapts future content based on your performance and learning progress.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: How to Take a Test */}
          <section className="space-y-5 mb-16">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                3
              </span>
              Your AI-Powered Learning Journey
            </h2>
            <div className="pl-9 space-y-6">
              <div className="flex items-center gap-1 flex-wrap">
                {steps.map((step, index) => (
                  <div className="flex items-center gap-1" key={step.number}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60">
                      <span className="text-xs font-bold text-primary">
                        {step.number}
                      </span>
                      <span className="text-sm font-medium">
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight
                        className="w-4 h-4 text-muted-foreground shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">
                    Step 1
                  </span>
                  <p>
                    Choose the  <strong className="text-foreground">Career Path</strong>{" "}
                    that matches your interests and future goals. Whether you want to become a Software Engineer, Project Manager, Business Analyst, or another professional, your learning journey begins here.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">
                    Step 2
                  </span>
                  <p>
                    Complete a career-focused <strong className="text-foreground">Survey</strong>{" "}
                    to help AI understand your background, current skills, learning preferences, and career objectives. Your answers are used to personalize your learning experience.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">
                    Step 3
                  </span>
                  <p>
                    Take an AI-powered English <strong className="text-foreground">Placement Test</strong>{" "}
                    to evaluate your current proficiency in vocabulary, grammar, reading, listening, and other essential language skills.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-primary shrink-0">
                    Step 4
                  </span>
                  <p>
                    Based on your career choice, survey responses, and placement test results, AI automatically generates <strong className="text-foreground">A Personalized English Learning Path.</strong>{" "} Your course includes structured topics, interactive lessons, quizzes, and daily learning recommendations to help you achieve your career goals.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Learning Progress */}
          <section className="space-y-5 mb-16">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                4
              </span>
              Learning Progress
            </h2>
            <div className="pl-9">
              <div className="flex gap-4 p-5 rounded-xl border bg-card">
                <div className="p-2.5 rounded-lg bg-muted shrink-0 h-fit">
                  <History
                    className="w-5 h-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The <strong className="text-foreground">Progress</strong>{" "}
                    page gives you a complete overview of your learning journey. Monitor completed lessons, quiz performance, learning streaks, and overall improvement as you move toward your English goals.
                  </p>
                  <ul className="space-y-2">
                    {progressItems.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CircleCheckBig
                          className="w-4 h-4 text-green-500 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="flex items-center gap-4 p-6 rounded-xl bg-primary/5 border border-primary/20 mb-16">
            <div className="p-3 bg-primary rounded-lg text-primary-foreground shrink-0">
              <CirclePlay className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold">Ready to Start Learning?</p>
              <p className="text-sm text-muted-foreground">
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Start Now
                </Link>{" "}
                to begin your personalized English learning journey today and let AI guide you through lessons, quizzes, and daily practice designed just for you.
              </p>
            </div>
          </div>

          {/* Feedback */}
          <div className="flex items-center gap-4 p-5 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20">
            <div className="p-2.5 rounded-lg bg-muted shrink-0">
              <Mail
                className="w-5 h-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Have suggestions or feedback?

              We'd love to hear your ideas and continuously improve your learning experience.

              Contact us anytime at:{" "}
              <Link
                to="mailto:training@tma.com.vn"
                className="text-primary font-medium hover:underline"
              >
                training@tma.com.vn
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}