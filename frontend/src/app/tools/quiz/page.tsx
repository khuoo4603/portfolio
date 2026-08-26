import type { Metadata } from "next";
import QuizScreen from "@/features/tools/quiz-screen";

export const metadata: Metadata = {
  title: "Quiz | Tools",
};

// 기존 QuizPage 기능을 제공하는 Tools Route
export default function QuizPage() {
  return <QuizScreen />;
}
