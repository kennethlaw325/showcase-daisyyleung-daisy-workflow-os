"use client";

import { useEffect, useRef, useState } from "react";

type Language = "en" | "zh";

type JourneyStage = {
  code: string;
  titleEn: string;
  titleZh: string;
  headingEn: string;
  headingZh: string;
  descriptionEn: string;
  descriptionZh: string;
};

const stages: JourneyStage[] = [
  {
    code: "01",
    titleEn: "Instructions",
    titleZh: "指引",
    headingEn: "Set the direction.",
    headingZh: "先定方向。",
    descriptionEn:
      "Define the purpose, boundaries, safety rules and routing before the first action begins.",
    descriptionZh: "在第一個行動開始前，先定清楚目的、邊界、安全規則及路線。",
  },
  {
    code: "02",
    titleEn: "Workflows",
    titleZh: "工作流程",
    headingEn: "Give the work a rhythm.",
    headingZh: "讓工作有節奏。",
    descriptionEn:
      "Turn recurring work into a route with a sequence, cadence, handoffs and recovery branches.",
    descriptionZh: "把重複工作整理成有步驟、頻率、交接及復原分支的路線。",
  },
  {
    code: "03",
    titleEn: "Skills & scripts",
    titleZh: "技能與程式",
    headingEn: "Turn each step into action.",
    headingZh: "把每一步變成行動。",
    descriptionEn:
      "Reusable skills and scripts provide the focused capability needed at each point in the route.",
    descriptionZh: "可重用的技能與程式，為路線上每一點提供所需的專注執行能力。",
  },
  {
    code: "04",
    titleEn: "Automations",
    titleZh: "自動化",
    headingEn: "Let the system carry it forward.",
    headingZh: "讓系統接力推進。",
    descriptionEn:
      "Schedules, triggers and handoffs keep the route moving without asking Demo User to hold every detail.",
    descriptionZh: "排程、觸發及交接令路線繼續前進，毋須 示範用戶親自記住每個細節。",
  },
  {
    code: "05",
    titleEn: "Memory",
    titleZh: "記憶",
    headingEn: "Complete the learning loop.",
    headingZh: "完成學習循環。",
    descriptionEn:
      "Outputs, logs and summaries remain in memory, so the next run can begin from a better place.",
    descriptionZh: "成果、紀錄及摘要會留在記憶之中，令下一次從更好的起點開始。",
  },
];

const stageStarts = [0, 0.17, 0.37, 0.57, 0.82];
const desktopQuery = "(min-width: 900px)";
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const seekEpsilon = 0.04;

function stageForProgress(progress: number) {
  let nextStage = 0;
  for (let index = 1; index < stageStarts.length; index += 1) {
    if (progress >= stageStarts[index]) nextStage = index;
  }
  return nextStage;
}

function JourneyTagline({ language }: { language: Language }) {
  if (language === "zh") {
    return (
      <>
        <span className="journey-tagline-line">由一個諗法</span>
        <span className="journey-tagline-line">
          變成一個有記憶、自己郁嘅系統
        </span>
      </>
    );
  }

  return (
    <span className="journey-tagline-line">
      From one intent to a system that remembers.
    </span>
  );
}

export default function ScrollScrubJourney({
  language,
}: {
  language: Language;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeStage, setActiveStage] = useState(0);

  const localized = (english: string, chinese: string) =>
    language === "zh" ? chinese : english;
  const shouldAnimate = isDesktop && !reducedMotion;
  const currentStage = stages[activeStage];

  useEffect(() => {
    const desktop = window.matchMedia(desktopQuery);
    const reduced = window.matchMedia(reducedMotionQuery);
    const updateMediaState = () => {
      setIsDesktop(desktop.matches && window.location.protocol !== "file:");
      setReducedMotion(reduced.matches);
    };

    updateMediaState();
    desktop.addEventListener("change", updateMediaState);
    reduced.addEventListener("change", updateMediaState);

    return () => {
      desktop.removeEventListener("change", updateMediaState);
      reduced.removeEventListener("change", updateMediaState);
    };
  }, []);

  useEffect(() => {
    if (!shouldAnimate) return;

    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let duration = 0;
    let rafId = 0;
    let seekInFlight = false;
    let latestTargetTime: number | null = null;

    const applySeek = (targetTime: number) => {
      if (!Number.isFinite(duration) || duration <= 0) return;

      const safeTarget = Math.min(Math.max(0, targetTime), Math.max(0, duration - 0.04));
      video.dataset.targetTime = safeTarget.toFixed(3);

      if (seekInFlight || video.seeking) {
        latestTargetTime = safeTarget;
        return;
      }

      if (Math.abs(video.currentTime - safeTarget) < seekEpsilon) return;

      seekInFlight = true;
      latestTargetTime = null;
      video.currentTime = safeTarget;
    };

    const updateFromScroll = () => {
      rafId = 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / distance));
      const nextStage = stageForProgress(progress);

      section.style.setProperty("--journey-progress", progress.toFixed(4));
      section.dataset.scrollProgress = progress.toFixed(4);
      section.dataset.activeStage = String(nextStage + 1);
      setActiveStage((current) => (current === nextStage ? current : nextStage));

      if (duration > 0) applySeek(progress * duration);
    };

    const scheduleUpdate = () => {
      if (!rafId) rafId = window.requestAnimationFrame(updateFromScroll);
    };

    const handleMetadata = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      duration = video.duration;
      video.pause();
      section.dataset.videoDuration = duration.toFixed(3);
      scheduleUpdate();
    };

    const handleSeeked = () => {
      seekInFlight = false;
      const pendingTarget = latestTargetTime;
      latestTargetTime = null;
      if (
        pendingTarget !== null &&
        Math.abs(video.currentTime - pendingTarget) >= seekEpsilon
      ) {
        applySeek(pendingTarget);
      }
    };

    video.addEventListener("loadedmetadata", handleMetadata);
    video.addEventListener("seeked", handleSeeked);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("orientationchange", scheduleUpdate);
    window.addEventListener("pageshow", scheduleUpdate);

    if (video.readyState >= 1) handleMetadata();
    scheduleUpdate();

    return () => {
      video.removeEventListener("loadedmetadata", handleMetadata);
      video.removeEventListener("seeked", handleSeeked);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("orientationchange", scheduleUpdate);
      window.removeEventListener("pageshow", scheduleUpdate);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [shouldAnimate]);

  return (
    <section
      aria-labelledby="system-heading"
      className={`system-section journey-section ${
        shouldAnimate ? "journey-active" : "journey-static"
      }`}
      data-renderer={shouldAnimate ? "video" : "static"}
      id="system"
      lang={language === "zh" ? "zh-HK" : "en"}
      ref={sectionRef}
    >
      {shouldAnimate ? (
        <div className="journey-sticky">
          <video
            aria-hidden="true"
            className="journey-video"
            disablePictureInPicture
            muted
            playsInline
            poster="workflow-os-journey-v2-poster.jpg"
            preload="metadata"
            ref={videoRef}
            src="media/workflow-os-journey-v2.mp4"
          />
          <div aria-hidden="true" className="journey-shade" />

          <div className="journey-heading">
            <p className="section-index">
              {localized("04 · System journey", "04 · 系統旅程")}
            </p>
            <h2 className="journey-tagline" id="system-heading">
              <JourneyTagline language={language} />
            </h2>
          </div>

          <div aria-hidden="true" className="journey-stage-card">
            <div className="journey-stage-meta">
              <span>{currentStage.code}</span>
              <strong>
                {localized(currentStage.titleEn, currentStage.titleZh)}
              </strong>
            </div>
            <h3>
              {localized(currentStage.headingEn, currentStage.headingZh)}
            </h3>
            <p>
              {localized(
                currentStage.descriptionEn,
                currentStage.descriptionZh,
              )}
            </p>
          </div>

          <div aria-hidden="true" className="journey-counter">
            <span>{currentStage.code}</span>
            <small>/ 05</small>
          </div>
          <div aria-hidden="true" className="journey-progress">
            <span />
          </div>

          <ol className="sr-only">
            {stages.map((stage) => (
              <li key={stage.code}>
                <strong>{localized(stage.titleEn, stage.titleZh)}</strong>
                <span>
                  {localized(stage.descriptionEn, stage.descriptionZh)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <>
          <div className="section-heading">
            <div>
              <p className="section-index">
                {localized("04 · System journey", "04 · 系統旅程")}
              </p>
              <h2 className="journey-tagline" id="system-heading">
                <JourneyTagline language={language} />
              </h2>
            </div>
            <p>
              {localized(
                "Five layers carry work from direction to durable memory.",
                "五個層次，將工作由方向帶到可持續的記憶。",
              )}
            </p>
          </div>

          <div aria-hidden="true" className="journey-poster" />

          <ol className="system-flow journey-static-flow">
            {stages.map((stage) => (
              <li key={stage.code}>
                <span>{stage.code}</span>
                <strong>{localized(stage.titleEn, stage.titleZh)}</strong>
                <small>
                  {localized(stage.descriptionEn, stage.descriptionZh)}
                </small>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
