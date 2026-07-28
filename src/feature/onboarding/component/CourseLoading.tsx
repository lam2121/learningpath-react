"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  LoaderCircle,
  CheckCircle2,
  Clock3,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from '@tanstack/react-router'
import { Card } from "@/shadcn/component/ui/card";
import { Progress } from "@/shadcn/component/ui/progress";
import { Badge } from "@/shadcn/component/ui/badge";
import { Separator } from "@/shadcn/component/ui/separator";
import { Button } from "@/shadcn/component/ui/button";

const tips = [
  "AI personalizes every lesson based on your placement test.",
  "Lessons become more difficult as your skills improve.",
  "Your quizzes focus on weak knowledge areas.",
  "The roadmap can be regenerated anytime.",
  "Progress is automatically saved during generation.",
];

export function CourseLoading() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(12);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return prev;
        const next = prev + Math.floor(Math.random() * 6);
        return Math.min(next, 100);
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (progress >= 100) {
      const timer = setTimeout(() => {
        navigate({
          to: "/learning-path"
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [progress, navigate]);
  const steps = [
    {
      title: "Analyze Placement Test",
      status: progress >= 20 ? "done" : "loading",
    },
    {
      title: "Identify Skill Gaps",
      status: progress >= 40 ? "done" : progress >= 20 ? "loading" : "todo",
    },
    {
      title: "Generate Course Structure",
      status: progress >= 60 ? "done" : progress >= 40 ? "loading" : "todo",
    },
    {
      title: "Generate Lessons",
      status: progress >= 80 ? "done" : progress >= 60 ? "loading" : "todo",
    },
    {
      title: "Generate Quizzes",
      status: progress == 100 ? "done" : progress >= 95 ? "loading" : "todo"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-8">

      <Card className="w-full max-w-2xl rounded-3xl shadow-2xl border-0">

        <div className="p-8">

          {/* Header */}

          <div className="relative inline-flex items-center justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center">

              {/* Loader */}
              <LoaderCircle
                className="absolute inset-0 h-full w-full animate-spin text-blue-500"
                strokeWidth={2}
              />

              {/* Robot */}
              <div className="flex h-15 w-15 items-center justify-center rounded-full bg-blue-100">
                <Bot
                  className="h-10 w-10 text-blue-600"
                  strokeWidth={2}
                />
              </div>

            </div>
            <h1 className="text-3xl font-bold ml-5 text-slate-800">
              Creating Your Course
            </h1>

            <p className="text-slate-500 mt-2 text-center">
              AI is building your personalized learning roadmap...
            </p>

          </div>

          {/* Progress */}

          <div className="mt-10">

            <div className="flex justify-between text-sm mb-2">

              <span className="font-medium text-slate-600">
                Progress
              </span>

              <span className="font-bold text-blue-600">
                {progress}%
              </span>

            </div>

            <Progress value={progress} className="h-3" />

            <div className="mt-2 text-center text-sm text-slate-500">
              Estimated remaining: ~45 seconds
            </div>

          </div>

          <Separator className="my-8" />

          {/* Steps */}

          <div className="space-y-4">

            {steps.map((step) => (

              <div
                key={step.title}
                className="flex items-center justify-between"
              >

                <div className="flex items-center gap-3">

                  {step.status === "done" && (
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                  )}

                  {step.status === "loading" && (
                    <LoaderCircle className="text-blue-600 animate-spin h-5 w-5" />
                  )}

                  {step.status === "todo" && (
                    <Clock3 className="text-gray-400 h-5 w-5" />
                  )}

                  <span className="text-slate-700">
                    {step.title}
                  </span>

                </div>

                {step.status === "done" && (
                  <Badge className="bg-green-500">
                    Done
                  </Badge>
                )}

                {step.status === "loading" && (
                  <Badge>
                    Running
                  </Badge>
                )}

                {step.status === "todo" && (
                  <Badge variant="secondary">
                    Waiting
                  </Badge>
                )}

              </div>

            ))}

          </div>

          <Separator className="my-8" />

          {/* Tips */}

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-5">

            <div className="flex items-center gap-2">

              <Sparkles className="text-blue-600 h-5 w-5" />

              <span className="font-semibold text-blue-700">
                AI Tip
              </span>

            </div>

            <p
              key={tipIndex}
              className="text-slate-600 mt-3 transition-all duration-500"
            >
              {tips[tipIndex]}
            </p>

          </div>

          {/* Auto Resume */}

          <div className="mt-6 rounded-xl bg-green-50 border border-green-200 p-5">

            <div className="flex items-center gap-2">

              <ShieldCheck className="text-green-600 h-5 w-5" />

              <span className="font-semibold text-green-700">
                Auto Resume Enabled
              </span>

            </div>

            <p className="text-slate-600 mt-2">
              Your progress is automatically saved.
              If the browser closes or the connection is interrupted,
              course generation will resume automatically when you return.
            </p>

          </div>

          {/* Footer */}

          <div className="flex justify-center mt-8">

            <Button variant="outline">
              Continue in Background
            </Button>

          </div>

        </div>

      </Card>

    </div>
  );
}