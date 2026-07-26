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
          <h1 className="text-4xl font-bold mb-4 text-foreground">Assessment Complete</h1>
          <p className="text-xl text-muted-foreground">Your total score is <span className="text-primary font-bold">{score}</span> out of 27.</p>
        </div>

        <Card className="border-accent shadow-lg shadow-accent/10">
          <CardHeader className="bg-primary text-primary-foreground/10 border-b border-border">
            <h2 className="text-2xl font-bold text-primary">{profile.title}</h2>
            <p className="text-lg text-foreground">Maturity Level: <span className="font-semibold">{profile.maturity}</span></p>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-lg text-muted-foreground mb-8">{profile.description}</p>
            
            <h3 className="font-semibold text-foreground mb-4 text-xl">Priority Action Items</h3>
            <ul className="space-y-3 mb-8">
              {profile.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-primary mr-3 mt-1">✓</span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <div className="bg-muted p-6 rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">Recommended Advisory Pathway</h3>
              <p className="text-primary font-medium text-lg mb-4">{profile.advisoryPhase}</p>
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold hover:opacity-90 transition-opacity w-full">
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
        <h1 className="text-4xl font-bold mb-4 text-foreground">AI Assurance Matchmaker</h1>
        <p className="text-xl text-muted-foreground">Identify your risk posture and discover your optimal governance profile.</p>
      </div>

      <div className="mb-6 flex justify-between items-center text-sm font-medium text-muted-foreground">
        <span>Question {currentStep + 1} of {assessmentData.questions.length}</span>
        <span className="text-primary">{currentQuestion.category}</span>
      </div>

      <div className="w-full bg-muted h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-primary text-primary-foreground h-full transition-all duration-500 ease-out"
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
                      ? "bg-primary text-primary-foreground/10 border-accent text-foreground shadow-sm" 
                      : "bg-background border-border text-muted-foreground hover:border-accent hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border mr-4 flex-shrink-0 flex items-center justify-center ${
                      isSelected ? "border-accent" : "border-muted-foreground"
                    }`}>
                      {isSelected && <div className="w-3 h-3 bg-primary text-primary-foreground rounded-full" />}
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
