"use client";

import React, { useState } from "react";
import assessmentData from "@/data/assessment.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

export default function DiagnosticPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isComplete, setIsComplete] = useState(false);

  const handleOptionSelect = (questionId: string, points: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: points }));
    
    if (currentStep < assessmentData.questions.length - 1) {
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 300);
    } else {
      setTimeout(() => {
        setIsComplete(true);
      }, 300);
    }
  };

  const calculateScore = () => {
    return Object.values(answers).reduce((acc, curr) => acc + curr, 0);
  };

  const getProfile = (score: number) => {
    return assessmentData.profiles.find((p) => score >= p.minScore && score <= p.maxScore) || assessmentData.profiles[0];
  };

  if (isComplete) {
    const score = calculateScore();
    const profile = getProfile(score);

    return (
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-[var(--foreground)]">Assessment Complete</h1>
          <p className="text-xl text-[var(--muted-foreground)]">Your total score is <span className="text-[var(--accent)] font-bold">{score}</span> out of 27.</p>
        </div>

        <Card className="border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10">
          <CardHeader className="bg-[var(--accent)]/10 border-b border-[var(--border)]">
            <h2 className="text-2xl font-bold text-[var(--accent)]">{profile.title}</h2>
            <p className="text-lg text-[var(--foreground)]">Maturity Level: <span className="font-semibold">{profile.maturity}</span></p>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-lg text-[var(--muted-foreground)] mb-8">{profile.description}</p>
            
            <h3 className="font-semibold text-[var(--foreground)] mb-4 text-xl">Priority Action Items</h3>
            <ul className="space-y-3 mb-8">
              {profile.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-[var(--accent)] mr-3 mt-1">✓</span>
                  <span className="text-[var(--muted-foreground)]">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-[var(--muted)] p-6 rounded-lg border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--foreground)] mb-2">Recommended Advisory Pathway</h3>
              <p className="text-[var(--accent)] font-medium text-lg mb-4">{profile.advisoryPhase}</p>
              <button className="bg-[var(--accent)] text-[var(--background)] px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity w-full">
                Schedule {profile.advisoryPhase.split(" (")[0]}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = assessmentData.questions[currentStep];

  return (
    <div className="container mx-auto px-4 py-20 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-[var(--foreground)]">AI Assurance Matchmaker</h1>
        <p className="text-xl text-[var(--muted-foreground)]">Identify your risk posture and discover your optimal governance profile.</p>
      </div>

      <div className="mb-6 flex justify-between items-center text-sm font-medium text-[var(--muted-foreground)]">
        <span>Question {currentStep + 1} of {assessmentData.questions.length}</span>
        <span className="text-[var(--accent)]">{currentQuestion.category}</span>
      </div>

      <div className="w-full bg-[var(--muted)] h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-[var(--accent)] h-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep) / assessmentData.questions.length) * 100}%` }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl leading-relaxed">{currentQuestion.text}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion.id] === option.points;
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(currentQuestion.id, option.points)}
                  className={`w-full text-left p-5 rounded-lg border transition-all duration-200 ${
                    isSelected 
                      ? "bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--foreground)] shadow-sm" 
                      : "bg-[var(--background)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border mr-4 flex-shrink-0 flex items-center justify-center ${
                      isSelected ? "border-[var(--accent)]" : "border-[var(--muted-foreground)]"
                    }`}>
                      {isSelected && <div className="w-3 h-3 bg-[var(--accent)] rounded-full" />}
                    </div>
                    <span className="text-lg">{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
