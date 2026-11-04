import React, { useState, useEffect } from 'react';
import { fetchQuestionnaire, postPredict } from '../api/client';
import { QuestionnaireResponse, QuestionItem, PredictResponse } from '../api/types';
import { QuestionField } from '../components/QuestionField';
import { BarChart } from '../components/charts/BarChart';

type Stage = 'consent' | 'questions' | 'submitting' | 'result';

export const AssessmentPage: React.FC = () => {
  const [stage, setStage] = useState<Stage>('consent');
  const [consentGiven, setConsentGiven] = useState(false);
  const [loadingQuestionnaire, setLoadingQuestionnaire] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null);
  
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  
  const [submittingError, setSubmittingError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResponse | null>(null);

  // Load questionnaire
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoadingQuestionnaire(true);
    setQuestionnaireError(null);
    try {
      const data = await fetchQuestionnaire();
      setQuestionnaire(data);
    } catch (err: any) {
      setQuestionnaireError(err.message || 'Failed to load questionnaire questions.');
    } finally {
      setLoadingQuestionnaire(false);
    }
  };

  const sections = questionnaire ? questionnaire.sections : [];
  const currentSection = sections[currentStep] || '';
  const currentQuestions = questionnaire
    ? questionnaire.questions.filter((q) => q.section === currentSection)
    : [];

  const handleAnswerChange = (qid: string, val: any) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
    // Clear validation error on change
    if (stepErrors[qid]) {
      setStepErrors((prev) => {
        const copy = { ...prev };
        delete copy[qid];
        return copy;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    for (const q of currentQuestions) {
      if (q.required && !q.sensitive) {
        const val = answers[q.id];
        if (
          val === undefined ||
          val === null ||
          (typeof val === 'string' && !val.trim()) ||
          (Array.isArray(val) && val.length === 0)
        ) {
          errors[q.id] = 'Please answer this required question before continuing.';
        }
      }
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }
    if (currentStep < sections.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }
    setStage('submitting');
    setSubmittingError(null);

    try {
      const res = await postPredict(true, answers);
      setResult(res);
      setStage('result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setSubmittingError(err.message || 'Failed to submit assessment.');
      setStage('questions');
    }
  };

  const handleStartOver = () => {
    setStage('consent');
    setConsentGiven(false);
    setCurrentStep(0);
    setAnswers({});
    setStepErrors({});
    setResult(null);
    setSubmittingError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper for quotient level descriptions
  const getLevelDescription = (quot: string, level: string): string => {
    if (quot === 'IQ') {
      if (level === 'H') return 'Strong cognitive self-regulation, technology resourcefulness, and dedicated study routines.';
      if (level === 'L') return 'Experiencing challenges with study organisation, focus blocks, or academic self-regulation.';
      return 'Balanced cognitive effort and study consistency aligning with average student cohort baselines.';
    }
    if (quot === 'EQ') {
      if (level === 'H') return 'High emotional awareness, comfortable authentic self-expression, and healthy mood regulation.';
      if (level === 'L') return 'Prone to stress accumulation, self-doubt, or difficulty openly discussing emotional states.';
      return 'Typical emotional self-regard and stress management during routine academic situations.';
    }
    if (quot === 'SQ') {
      if (level === 'H') return 'Strong social bonds, active class participation, robust family support, and community belonging.';
      if (level === 'L') return 'Feelings of isolation, strained peer connections, or limited involvement in group settings.';
      return 'Stable social interaction with trusted peers and standard participation in school activities.';
    }
    if (quot === 'AQ') {
      if (level === 'H') return 'Excellent perseverance through setbacks, high confidence in personal decisions, and active coping.';
      if (level === 'L') return 'Vulnerable when facing unexpected obstacles, reliance on avoidance strategies, or discouragement.';
      return 'Moderate resilience; handles expected academic challenges with reasonable endurance.';
    }
    return '';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 1. Consent Stage */}
      {stage === 'consent' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="border-b border-slate-100 pb-5 mb-6">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Student Assessment
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              Holistic Psychometric Profiling
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Understand your cognitive learning habits, emotional wellbeing, social connections, and resilience patterns.
            </p>
          </div>

          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
              <h3 className="font-semibold text-slate-800 text-sm">Participant Information & Consent</h3>
              <ul className="list-disc list-inside space-y-1.5 text-slate-600 text-xs sm:text-sm">
                <li><strong>Purpose:</strong> Understand your study habits, emotional wellbeing, relationships, and adversity response.</li>
                <li><strong>Data Privacy:</strong> Only categorical answers are stored for aggregate analysis. No names, email addresses, IP addresses, or free-text answers are ever stored.</li>
                <li><strong>Voluntary Participation:</strong> Taking this assessment is entirely voluntary. You may stop or skip sensitive optional questions at any time.</li>
                <li><strong>Non-Clinical Guidance:</strong> This assessment provides educational guidance and reflection aids. It is not a clinical or psychiatric diagnostic test.</li>
                <li><strong>Under-18 Participants:</strong> Students under the age of 18 should participate with guardian or institutional consent.</li>
              </ul>
            </div>

            {loadingQuestionnaire && (
              <div className="text-center py-4 text-slate-500">Loading questionnaire structure...</div>
            )}

            {questionnaireError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {questionnaireError}
                <button
                  onClick={loadQuestions}
                  className="ml-3 underline font-medium hover:text-red-900"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-800">
                  I have read this and agree to take part.
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setStage('questions')}
              disabled={!consentGiven || !questionnaire}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                consentGiven && questionnaire
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Start Assessment
            </button>
          </div>
        </div>
      )}

      {/* 2. Questions Stage */}
      {stage === 'questions' && questionnaire && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                Step {currentStep + 1} of {sections.length}: {currentSection}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {Math.round(((currentStep + 1) / sections.length) * 100)}% Completed
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${((currentStep + 1) / sections.length) * 100}%` }}
              />
            </div>
          </div>

          {submittingError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              <p className="font-semibold">Submission failed:</p>
              <p>{submittingError}</p>
            </div>
          )}

          {/* Question List for Current Section */}
          <div className="space-y-4">
            {currentQuestions.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={(val) => handleAnswerChange(q.id, val)}
                error={stepErrors[q.id]}
              />
            ))}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-5 py-2 rounded-lg text-sm font-medium border ${
                currentStep === 0
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Back
            </button>

            {currentStep < sections.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm active:scale-95 transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-95 transition-all"
              >
                Submit Assessment
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Submitting Spinner */}
      {stage === 'submitting' && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
          <h3 className="text-lg font-bold text-slate-800">Processing Your Assessment</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Computing your four quotient scores, mapping nearest prototype vectors, and running TabNet neural feature masks...
          </p>
        </div>
      )}

      {/* 4. Result Stage */}
      {stage === 'result' && result && (
        <div className="space-y-8 print-page">
          {/* Top action bar */}
          <div className="flex justify-between items-center no-print">
            <button
              onClick={handleStartOver}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50"
            >
              Start Over
            </button>
            <button
              onClick={() => window.print()}
              className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-md"
            >
              Print this result
            </button>
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Predicted Psychometric Profile (TabNet)
                </span>
                {result.prediction.borderline && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Borderline: You are between {result.prediction.name} and {result.prediction.runner_up.name}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {result.prediction.name}
              </h2>
              <p className="text-sm font-semibold text-indigo-700 mt-1">
                {result.prediction.subtitle}
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <h4 className="text-xs font-bold uppercase text-emerald-800 tracking-wider mb-1">
                    Key Strengths
                  </h4>
                  <p className="text-sm text-slate-700">
                    High capability across targeted quotients with positive study and emotional practices.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100">
                  <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider mb-1">
                    Watch-Outs
                  </h4>
                  <p className="text-sm text-slate-700">
                    Ensure sustained balance under pressure; focus on strengthening lower quotient areas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Probability Bars */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Profile Classification Probabilities</h3>
            <p className="text-xs text-slate-500 mb-4">
              TabNet model probability distribution across all 7 archetypes based on your 24 item answers.
            </p>
            <BarChart
              data={result.prediction.probabilities.map((p) => ({
                label: p.name,
                value: Math.round(p.p * 100),
                color: p.id === result.prediction.profile_id ? '#4f46e5' : '#94a3b8'
              }))}
              orientation="horizontal"
              max={100}
              valueFormatter={(v) => `${v}%`}
            />
          </div>

          {/* Your Four Quotients */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Your Four Quotient Scores</h3>
            <p className="text-xs text-slate-500 mb-6">
              Normalized score (0-100) compared against the reference population mean, marked with performance tier.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['IQ', 'EQ', 'SQ', 'AQ'] as const).map((qKey) => {
                const q = result.quotients[qKey];
                const levelColor =
                  q.level === 'H'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : q.level === 'L'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-800 border-slate-300';

                return (
                  <div key={qKey} className="p-4 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm text-slate-900">{qKey} Quotient</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded border ${levelColor}`}>
                          Tier: {q.level}
                        </span>
                        <span className="font-mono text-base font-extrabold text-slate-800">
                          {q.score}
                        </span>
                      </div>
                    </div>

                    {/* Progress track with norm mean marker */}
                    <div className="relative w-full bg-slate-200 h-3 rounded-full my-3">
                      <div
                        className="bg-indigo-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, q.score))}%` }}
                      />
                      {/* Marker for norm mean */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-slate-800"
                        style={{ left: `${Math.min(100, Math.max(0, q.norm_mean))}%` }}
                        title={`Reference Mean: ${q.norm_mean}`}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>z-score: {q.z}</span>
                      <span>Ref Mean: {q.norm_mean} (SD: {q.norm_sd})</span>
                    </div>

                    <p className="mt-2 text-xs text-slate-600 leading-snug">
                      {getLevelDescription(qKey, q.level)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Why This Result (Top 5 Items) */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Why This Result (TabNet Explainability)</h3>
            <p className="text-xs text-slate-500 mb-4">
              The top 5 survey questions that contributed most strongly to your prediction according to local TabNet neural masks.
            </p>

            <BarChart
              data={result.explanation.top_items.map((item) => ({
                label: `[${item.quotient}] ${item.short}`,
                value: Math.round(item.importance * 100),
                note: `Answer: ${item.answer}`,
                color: '#6366f1'
              }))}
              orientation="horizontal"
              max={100}
              valueFormatter={(v) => `${v}%`}
            />

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Quotient Weight Distribution:</span>
              <span>IQ: {Math.round(result.explanation.quotient_importance.IQ * 100)}%</span>
              <span>EQ: {Math.round(result.explanation.quotient_importance.EQ * 100)}%</span>
              <span>SQ: {Math.round(result.explanation.quotient_importance.SQ * 100)}%</span>
              <span>AQ: {Math.round(result.explanation.quotient_importance.AQ * 100)}%</span>
            </div>
          </div>

          {/* Recommendations Block */}
          <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Personalized Growth Recommendations</h3>
              {result.recommendations.target_profile && (
                <p className="text-xs font-semibold text-indigo-700 mt-1">
                  Next Developmental Step: {result.recommendations.target_profile.name}
                </p>
              )}
            </div>

            {/* Profile 1 Maintain Cards */}
            {result.recommendations.maintain && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Sustainability Practices
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {result.recommendations.maintain.map((m) => (
                    <div key={m.id} className="p-4 rounded-lg bg-emerald-50/30 border border-emerald-100">
                      <h5 className="text-sm font-bold text-slate-900 mb-1">{m.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">{m.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Focus Quotients Action Cards */}
            {result.recommendations.focus && result.recommendations.focus.length > 0 && (
              <div className="space-y-6">
                {result.recommendations.focus.map((fBlock, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800">
                        Focus Area: {fBlock.quotient} Quotient (Level: {fBlock.level})
                      </h4>
                      <span className="text-xs text-slate-400">Target Gap: {fBlock.gap}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {fBlock.actions.map((act) => (
                        <div key={act.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                          <h5 className="text-sm font-semibold text-slate-900 mb-1.5">{act.title}</h5>
                          <p className="text-xs text-slate-600 leading-relaxed">{act.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Support Note */}
            {result.recommendations.support_note && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm leading-relaxed">
                <strong>Important Support Note:</strong> {result.recommendations.support_note}
              </div>
            )}
          </div>

          {/* Disclaimer Footer Box */}
          <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <strong>Disclaimer:</strong> {result.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};

