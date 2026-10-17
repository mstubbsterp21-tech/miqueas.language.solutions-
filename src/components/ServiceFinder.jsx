import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import {
  getServiceFinderQuestions,
  getServiceFinderResult,
  serviceFinderRequestPath,
} from "../lib/serviceFinder";

export default function ServiceFinder() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const headingRef = useRef(null);
  const questions = getServiceFinderQuestions(answers);
  const current = questions[step];
  const result = current ? null : getServiceFinderResult(answers);
  const progress = current ? Math.round(((step + 1) / questions.length) * 100) : 100;

  useEffect(() => {
    if (step > 0) headingRef.current?.focus();
  }, [step]);

  const selectAnswer = (value) => {
    if (!current) return;
    const field = current.id;
    setAnswers((previous) => (
      field === "goal" ? { goal: value }
        : field === "material" ? { goal: previous.goal, material: value }
          : { ...previous, [field]: value }
    ));
    setStep((previous) => previous + 1);
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[#d1c6bc] bg-white shadow-[0_24px_70px_-38px_rgba(71,24,20,0.4)]">
      <div className="bg-[#721100] px-6 py-7 text-white sm:px-9 sm:py-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.17em] text-[#ffd4a1]">
          <Sparkles size={16} aria-hidden="true" /> MLS Service Finder
        </div>
        <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl" id="service-finder-title">
          Which Service Is Right for Me?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
          Answer a few quick questions to discover which MLS service is likely to fit your communication needs.
          No account or personal information required.
        </p>
      </div>

      <div className="grid gap-8 px-5 py-7 sm:px-9 sm:py-9 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="mb-7">
            <div className="flex justify-between gap-3 text-xs font-bold text-[#595959]">
              <span>{current ? `Question ${step + 1} of ${questions.length}` : "Your recommendation"}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#ece5df]">
              <div
                className="h-full rounded-full bg-[#721100] transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-label="Service finder progress"
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
          </div>

          {current ? (
            <div key={current.id}>
              <h3 tabIndex={-1} ref={headingRef} className="text-2xl font-black leading-tight text-[#292929] outline-none sm:text-3xl">
                {current.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[#575757]">{current.help}</p>
              <fieldset className="mt-6">
                <legend className="sr-only">{current.title}</legend>
                <div className="grid gap-3">
                  {current.options.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectAnswer(value)}
                      className="group flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-[#d7c9c0] bg-[#fffdfb] px-5 py-4 text-left text-sm font-bold leading-6 text-[#302b29] transition hover:border-[#721100] hover:bg-[#f7f0ea] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#dd7d00]"
                    >
                      <span>{label}</span>
                      <ArrowRight size={17} aria-hidden="true" className="shrink-0 text-[#721100] transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : (
            <div role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-sm font-black text-[#721100]">
                <CheckCircle2 size={20} aria-hidden="true" />
                {result.review ? "Personalized review recommended" : "Suggested MLS service"}
              </div>
              <h3 ref={headingRef} tabIndex={-1} className="mt-3 text-2xl font-black leading-tight text-[#292929] outline-none sm:text-3xl">
                {result.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-[#404040]">{result.description}</p>
              <div className="mt-5 rounded-2xl border border-[#e2d4c8] bg-[#f9f5f1] p-5">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#721100]">Why this fits</p>
                <p className="mt-2 text-sm leading-7 text-[#383838]">{result.reason}</p>
              </div>
              <p className="mt-5 text-sm leading-7 text-[#555]">
                {result.note || "MLS will help determine the most effective and appropriate service arrangement."}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to={serviceFinderRequestPath(result)}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#721100] px-6 py-3 text-sm font-black text-white transition hover:bg-[#560c00] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#dd7d00]"
                >
                  {result.review ? "Ask MLS for guidance" : "Request this service"} <ArrowRight size={17} aria-hidden="true" />
                </Link>
                {result.id && (
                  <Link
                    to={`/services/${result.id}`}
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#721100] px-6 py-3 text-sm font-black text-[#721100] transition hover:bg-[#f7f0ea] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#dd7d00]"
                  >
                    Explore service details
                  </Link>
                )}
              </div>
              <p className="mt-5 text-xs leading-6 text-[#626262]">
                This is a preliminary suggestion, not a confirmed booking, accessibility determination, or quote. MLS reviews consumer preferences, assignment requirements, qualifications, and availability before confirming services.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-5 border-t border-[#ece5df] pt-5">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((previous) => Math.max(0, previous - 1))}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-bold text-[#721100] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#dd7d00]"
              >
                <ArrowLeft size={16} aria-hidden="true" /> Previous question
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-1 text-sm font-bold text-[#595959] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#dd7d00]"
            >
              <RotateCcw size={16} aria-hidden="true" /> Start over
            </button>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border border-[#e6ddd6] bg-[#f8f4ef] p-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#721100]">How it works</p>
          <ol className="mt-4 space-y-4 text-sm leading-6 text-[#474747]">
            <li><strong>1. Tell us the goal.</strong> Live interpreting or recorded translation?</li>
            <li><strong>2. Share the context.</strong> We consider delivery format and access requirements.</li>
            <li><strong>3. See your match.</strong> Explore the service or continue to the MLS request form.</li>
          </ol>
          <p className="mt-5 border-t border-[#e1d6cd] pt-4 text-xs leading-6 text-[#5c5550]">
            Not sure how to answer? Choose “not sure” when available. You can always speak with MLS directly.
          </p>
        </aside>
      </div>
    </div>
  );
}
