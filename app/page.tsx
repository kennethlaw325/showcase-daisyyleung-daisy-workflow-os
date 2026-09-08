"use client";

import { useEffect, useMemo, useState } from "react";
import ScrollScrubJourney from "./ScrollScrubJourney";
import registry from "./registry.generated.json";

type WorkflowStatus = "active" | "paused" | "manual" | "planned";
type DepartmentId = "pr" | "hr" | "it" | "admin" | "personal";

type WorkflowStep = {
  title: string;
  detail: string;
  output?: string;
  recovery?: boolean;
};

type Workflow = {
  id: string;
  department: DepartmentId;
  title: string;
  cadence: string;
  status: WorkflowStatus;
  mode: string;
  source: string;
  description: string;
  steps: WorkflowStep[];
  skills: string[];
};

const workflows: Workflow[] = [
  {
    id: "techcrunch-news",
    department: "pr",
    title: "TechCrunch WhatsApp News",
    cadence: "Daily · 09:00 HKT",
    status: "active",
    mode: "Automated",
    source: "Start From Scratch",
    description:
      "Fetches the latest TechCrunch stories, asks Hermes for an interpretive synthesis, delivers the digest through WhatsApp, and logs the run.",
    steps: [
      { title: "Scheduled trigger", detail: "Start once daily at 09:00 Asia/Hong_Kong." },
      { title: "Collect source material", detail: "Fetch the latest TechCrunch RSS items and available article bodies.", output: "temp_tc_raw.md" },
      { title: "Prepare the handoff", detail: "Write the enriched source pack and a Codex-to-Hermes synthesis contract.", output: "hermes_techcrunch_handoff.md" },
      { title: "Synthesize the news", detail: "Hermes produces exactly 10 stories with links and five concise why-it-matters viewpoints per story." },
      { title: "Validate or fall back", detail: "Check freshness and structure. If Hermes output is missing or invalid, use the Codex fallback so the scheduled update is not missed.", recovery: true },
      { title: "Deliver on WhatsApp", detail: "Remove complex Markdown, split only at line boundaries, and send every complete story through Hermes." },
      { title: "Record the outcome", detail: "Log success or failure and append quality observations for the next run.", output: "news_logs.md · techcrunch_news_quality.md" },
    ],
    skills: [
      "whatsapp_local_sender",
      "bridge-whatsapp-hermes-codex",
      "news scripts",
    ],
  },
  {
    id: "whatsapp-digest",
    department: "pr",
    title: "WhatsApp Learning Digest",
    cadence: "Daily · 18:00 HKT",
    status: "active",
    mode: "Automated",
    source: "Start From Scratch",
    description:
      "Turns raw WhatsApp inputs into a Cantonese insight digest, durable memory, an HTML dashboard, and a daily learning card.",
    steps: [
      { title: "Retry pending delivery", detail: "Retry queued WhatsApp text first; keep the queue intact if Hermes or the network is still unavailable.", recovery: true },
      { title: "Recover missed inbound messages", detail: "Backfill missed Hermes gateway events into the append-only WhatsApp learning inbox." },
      { title: "Compare coverage", detail: "Read the inbox, prior Covered Entries, durable memory and outbox to find new or previously missed inputs." },
      { title: "Digest the inputs", detail: "Cluster related items, remove duplicates and low-signal details, and extract lessons, risks, opportunities and useful questions." },
      { title: "Update durable records", detail: "Append the Cantonese insight digest and durable concepts without overwriting earlier learning.", output: "whatsapp_learning_digest.md · whatsapp_learning_memory.md" },
      { title: "Rebuild the full dashboard", detail: "Regenerate the HTML view from the complete append-only digest, newest learning first, even when there are no new entries.", output: "learning_dashboard.html" },
      { title: "Render the daily learning card", detail: "Create one dated PNG that summarizes the learning rather than listing raw messages." },
      { title: "Send or queue", detail: "Send the text digest and image. Unsupported media is converted to a Cantonese dashboard fallback; failed text is queued.", recovery: true },
      { title: "Recover, log and close", detail: "On error, crawl the inbox again, restore uncovered entries, rebuild, queue unsent text, log the outcome and archive only completed tasks.", recovery: true },
    ],
    skills: [
      "bridge-whatsapp-hermes-codex",
      "archive-whatsapp-learning-digest",
      "learning inbox contract",
    ],
  },
  {
    id: "jobsdb-daily",
    department: "hr",
    title: "JobsDB Hong Kong Daily Search",
    cadence: "09:00–23:00 catch-up · once daily",
    status: "active",
    mode: "Automated",
    source: "Hunter",
    description:
      "Finds and verifies fresh target roles, updates the daily report and tracker, maintains the responsibility library, then emails the result to Demo User.",
    steps: [
      { title: "Check today's delivery marker", detail: "Use the hourly 09:00–23:00 opportunities only as catch-up. Stop immediately if today's alert was already delivered." },
      { title: "Load search preferences", detail: "Read Demo User's target themes, existing daily reports and tracker before searching." },
      { title: "Search the live market", detail: "Run several focused JobsDB and web searches for fresh Hong Kong AI, transformation, CX, UX and product roles." },
      { title: "Verify and deduplicate", detail: "Inspect actual listings where possible; deduplicate by canonical link, job ID, or normalized company and title." },
      { title: "Update the job records", detail: "Write today's comparison report and update the tracker without deleting history or changing Demo User's notes.", output: "Jobs/Daily/YYYY-MM-DD.md · Jobs/Tracker.md" },
      { title: "Learn market responsibilities", detail: "Extract only verified employer-demand patterns into the responsibility library; never present them as Demo User's experience." },
      { title: "Validate and synchronize the skill", detail: "Validate the active library, mirror its complete directory to Obsidian, then verify byte-for-byte identity." },
      { title: "Refresh the responsibility radar", detail: "Regenerate the standalone dashboard and run its HTML tests from the validated library." },
      { title: "Send the private Gmail alert", detail: "Send the comparison, strongest matches and top three market responsibility signals only to Demo User's own mailbox." },
      { title: "Mark complete or leave retryable", detail: "Write the exact delivery marker and archive only after successful self-delivery. Leave failures visible for a later catch-up run.", recovery: true },
    ],
    skills: ["job-responsibility-library", "Gmail", "live web research"],
  },
  {
    id: "job-market-weekly",
    department: "hr",
    title: "Hong Kong Job Market Weekly",
    cadence: "Sunday · 18:00 HKT",
    status: "active",
    mode: "Automated",
    source: "Hunter",
    description:
      "Aggregates verified daily job data into a weekly market report and refreshes the private job-market dashboard.",
    steps: [
      { title: "Load the verified week", detail: "Read search preferences, daily reports, tracker data and the current dashboard snapshot." },
      { title: "Deduplicate the market", detail: "Resolve unique roles before calculating counts, salary samples or theme movement." },
      { title: "Separate facts from interpretation", detail: "Measure themes, titles, skills, employers and salary evidence; label sparse data as a baseline rather than inventing trends." },
      { title: "Write the weekly report", detail: "Preserve existing notes while adding the verified ISO-week market summary and next-search suggestions.", output: "Jobs/Weekly/YYYY-Www.md" },
      { title: "Refresh dashboard data", detail: "Update report-data.json with the same facts, explicit insufficient-data states and direct opportunity links." },
      { title: "Build and validate", detail: "Run the dashboard build against the updated data." },
      { title: "Publish privately", detail: "Save and deploy one private dashboard version; keep the local report if publishing fails.", recovery: true },
      { title: "Return the executive view", detail: "Summarize the week, strongest matches and private dashboard link without applying or contacting employers." },
    ],
    skills: ["Sites building", "Sites hosting", "Hunter reports", "tracker"],
  },
  {
    id: "learning-watchdog",
    department: "pr",
    title: "WhatsApp Learning Inbox Watchdog",
    cadence: "Hourly when enabled",
    status: "paused",
    mode: "Automated",
    source: "Start From Scratch",
    description:
      "Checks for uncovered WhatsApp entries, digests learnable inputs, refreshes the dashboard, and sends a concise update.",
    steps: [
      { title: "Read the learning records", detail: "Load the workflow contract, raw inbox, digest and durable memory." },
      { title: "Compare entry coverage", detail: "Match every inbox entry ID against all prior Covered Entries, including text, links, images, files and voice notes." },
      { title: "No-new-entry branch", detail: "If nothing is uncovered, rebuild the dashboard, append no digest and send no WhatsApp message.", recovery: true },
      { title: "Inspect and digest", detail: "For uncovered items, inspect local attachments where available, cluster themes, remove duplicates and extract the so-what insight." },
      { title: "Append memory", detail: "Add the new digest and durable concepts without replacing past history." },
      { title: "Refresh the dashboard", detail: "Rebuild the full learning dashboard from the append-only digest." },
      { title: "Send concise text only", detail: "Send or queue a Cantonese digest. The daily 18:00 workflow—not the watchdog—owns the PNG card." },
      { title: "Log and archive completed work", detail: "Record success, failure or recovery and archive only when no blocker remains.", recovery: true },
    ],
    skills: ["bridge-whatsapp-hermes-codex", "learning inbox contract"],
  },
  {
    id: "outbox-retry",
    department: "pr",
    title: "WhatsApp Learning Outbox Retry",
    cadence: "Hourly when enabled",
    status: "paused",
    mode: "Automated",
    source: "Start From Scratch",
    description:
      "Rebuilds the learning dashboard and retries queued WhatsApp messages without generating duplicate content.",
    steps: [
      { title: "Refresh the durable dashboard", detail: "Rebuild the HTML dashboard from the full digest before touching delivery." },
      { title: "Read the pending outbox", detail: "Inspect queued records only as needed to understand remaining delivery work." },
      { title: "Retry queued text", detail: "Attempt delivery of existing queued messages; do not create a new digest or new content." },
      { title: "Convert unsupported media", detail: "Turn legacy media queue records into a Cantonese text dashboard fallback when Hermes reports media is unsupported.", recovery: true },
      { title: "Preserve failed work", detail: "If connectivity is still unavailable, leave the queue intact for the next retry.", recovery: true },
      { title: "Log and close", detail: "Record the result and archive the task only when no unexpected blocker remains." },
    ],
    skills: ["archive-whatsapp-learning-digest", "send-or-queue helper"],
  },
  {
    id: "ats-application",
    department: "hr",
    title: "ATS Application Pack",
    cadence: "On demand · job-specific",
    status: "manual",
    mode: "User-triggered",
    source: "Hunter",
    description:
      "Maps verified career evidence to a job description and produces a truthful, visually verified resume and cover letter.",
    steps: [
      { title: "Read the target job", detail: "Extract responsibilities, requirements, seniority signals and ATS terminology from the job description." },
      { title: "Load Demo User's verified evidence", detail: "Use source resumes, approved career evidence and the employer-demand responsibility library with clear evidence boundaries." },
      { title: "Build the match map", detail: "Map supported achievements to job needs, identify gaps and avoid invented claims or metrics." },
      { title: "Draft the tailored resume", detail: "Prioritize the most relevant truthful evidence and ATS language while keeping the document concise." },
      { title: "Draft the cover letter", detail: "Connect Demo User's evidence to the company's needs without generic or AI-sounding filler." },
      { title: "Render and inspect", detail: "Generate DOCX output, render every page and correct spacing, overflow or visual hierarchy problems." },
      { title: "Deliver the application pack", detail: "Provide the verified files plus any material evidence gaps Demo User should address before applying." },
    ],
    skills: [
      "tailor-demo-application",
      "build-tailored-resume",
      "job-responsibility-library",
      "Documents",
    ],
  },
  {
    id: "obsidian-reviews",
    department: "admin",
    title: "Obsidian Review System",
    cadence: "Daily · weekly · monthly",
    status: "manual",
    mode: "User-triggered",
    source: "Dotai Builder",
    description:
      "Reviews notes non-destructively, surfaces trends and stale material, and reports vault health without moving or rewriting source notes.",
    steps: [
      { title: "Choose the review horizon", detail: "Run the daily inbox, seven-day weekly, monthly synthesis or vault-health route." },
      { title: "Read without restructuring", detail: "Inspect relevant notes, metadata and links while preserving source content and folder placement." },
      { title: "Surface signals", detail: "Identify themes, unresolved actions, stale notes, broken links and items worth resurfacing." },
      { title: "Write the review output", detail: "Create the scoped review summary with links back to source notes." },
      { title: "Suggest; do not delete", detail: "Flag archive or cleanup candidates without moving, deleting or rewriting user content." },
    ],
    skills: ["daily-review", "weekly-review", "monthly-review", "vault-lint"],
  },
  {
    id: "skill-review",
    department: "it",
    title: "Skill Review & Installation",
    cadence: "On demand · approval-gated",
    status: "manual",
    mode: "User-triggered",
    source: "Skill Installer",
    description:
      "Statically reviews candidate skills, checks provenance and overlap, requests exact approval, then installs and synchronizes only the approved snapshot.",
    steps: [
      { title: "Resolve the candidate", detail: "Identify the exact skill source, version, directory and provenance before any installation." },
      { title: "Review it statically", detail: "Read SKILL.md, scripts, references, templates and assets; check risky commands, network actions and hidden dependencies." },
      { title: "Check overlap and naming", detail: "Compare with active global and project skills to prevent collisions or redundant capabilities." },
      { title: "Validate the snapshot", detail: "Require a readable SKILL.md and run any relevant validator without executing untrusted setup code." },
      { title: "Preview exact changes", detail: "Show what will be installed or updated and obtain explicit approval for the exact snapshot." },
      { title: "Install the approved copy", detail: "Place the complete skill directory in the active library without touching Codex-managed system or plugin skills." },
      { title: "Synchronize Obsidian", detail: "Mirror the complete directory, preserving scripts, references, assets and project namespaces." },
      { title: "Verify byte-for-byte", detail: "Compare both libraries and report conflicts, extras or incomplete synchronization rather than overwriting unexplained differences.", recovery: true },
    ],
    skills: ["skill-installer", "skill-creator", "global skill sync"],
  },
  {
    id: "session-memory",
    department: "admin",
    title: "Session Memory Capture",
    cadence: "On demand · when Demo User asks to save it",
    status: "manual",
    mode: "User-triggered",
    source: "Dotai Builder",
    description:
      "Saves a concise, durable record of decisions, outputs, and next steps into the Obsidian inbox without changing older notes.",
    steps: [
      { title: "Detect the save intent", detail: "Trigger when Demo User says 記低, save session, or asks to preserve meaningful session-level work." },
      { title: "Collect the useful record", detail: "Gather the goal, decisions, files produced, verified outcomes and unfinished next steps." },
      { title: "Distill the session", detail: "Remove chat noise and write a concise summary that remains useful outside the conversation." },
      { title: "Create an Inbox note", detail: "Save a new Obsidian Inbox note with links to relevant local artifacts; do not overwrite older notes." },
      { title: "Confirm what was saved", detail: "Return the note location and any next action that still belongs to Demo User." },
    ],
    skills: ["session-to-obsidian"],
  },
  {
    id: "offer-comparison",
    department: "hr",
    title: "Offer Comparison & Decision",
    cadence: "On demand · when offers arrive",
    status: "manual",
    mode: "User-triggered",
    source: "Hunter",
    description: "Normalizes competing offers and makes compensation, role quality and trade-offs comparable without hiding assumptions.",
    steps: [
      { title: "Collect comparable inputs", detail: "Capture base pay, bonus, equity, benefits, title, scope, work arrangement and timing for each offer." },
      { title: "Normalize compensation", detail: "Convert pay periods and currencies consistently; label uncertain or conditional values." },
      { title: "Compare the role itself", detail: "Assess responsibilities, learning, leadership, stability, brand, flexibility and alignment with Demo User's goals." },
      { title: "Weight personal priorities", detail: "Apply Demo User's chosen priorities rather than assuming salary is the only decision factor." },
      { title: "Show trade-offs and risks", detail: "Make missing data, vesting conditions, probation, commute and downside scenarios explicit." },
      { title: "Produce a decision brief", detail: "Return a side-by-side recommendation, negotiation points and the assumptions that could change the result." },
    ],
    skills: ["offer-comparison-analyzer", "job-responsibility-library"],
  },
  {
    id: "workflow-registry",
    department: "it",
    title: "Workflow Registry & Dashboard",
    cadence: "On demand · after system changes",
    status: "manual",
    mode: "User-triggered",
    source: "Manage Codex",
    description: "Audits workflow contracts, automation schedules and skills, then refreshes this operating-system view without changing unrelated work.",
    steps: [
      { title: "Inventory the system", detail: "Read automation definitions, formal workflow contracts, active skills and project-scoped skills." },
      { title: "Resolve naming and schedule gaps", detail: "Compare display names, internal IDs, documented cadence and actual recurrence settings." },
      { title: "Map dependencies", detail: "Connect each workflow to its automation, scripts, skills, workspace, outputs and memory records." },
      { title: "Update the registry", detail: "Refresh categories, statuses and step-by-step routes while preserving historical distinctions." },
      { title: "Build and verify", detail: "Compile the dashboard and check that filters, selection, accessibility and responsive layouts still work." },
      { title: "Publish only when authorized", detail: "Keep the validated local version available and deploy privately when Demo User approves the external publish step." },
    ],
    skills: ["Sites building", "Sites hosting", "ui-ux-pro-max", "karpathy-guidelines"],
  },
  {
    id: "meeting-followup",
    department: "admin",
    title: "Meeting Minutes & Follow-up",
    cadence: "On demand · after meetings",
    status: "manual",
    mode: "User-triggered",
    source: "Codex Global",
    description: "Turns meeting notes or transcripts into decisions, accountable actions and a concise manager update draft.",
    steps: [
      { title: "Read the meeting record", detail: "Load the transcript, notes or meeting narrative and identify participants and context." },
      { title: "Separate signal from discussion", detail: "Extract decisions, open questions, risks and dependencies without inventing agreement." },
      { title: "Build the action register", detail: "List each follow-up with owner, timing and status when supported by the source." },
      { title: "Write concise minutes", detail: "Produce a scannable record with outcomes and source-grounded next steps." },
      { title: "Draft the progress email", detail: "Prepare a clear boss or manager update for Demo User to review; sending remains separately authorized." },
    ],
    skills: ["meeting-minutes-followup-email", "Gmail draft"],
  },
  {
    id: "email-classification",
    department: "admin",
    title: "Email Classification",
    cadence: "On demand · bounded inbox triage",
    status: "manual",
    mode: "User-triggered",
    source: "Codex Global",
    description: "Classifies messages into clear labels with a strict read-only-plus-label boundary and explicit handling for uncertainty.",
    steps: [
      { title: "Resolve the inbox scope", detail: "Define the account, date window and allowed labels before reading messages." },
      { title: "Inspect message context", detail: "Read enough of each thread to determine intent, urgency and whether a reply is needed." },
      { title: "Classify with confidence", detail: "Assign the best allowed label and keep the reasoning bounded to the visible email evidence." },
      { title: "Route uncertain cases to TBC", detail: "Do not guess when confidence is low; flag the message for Demo User's decision.", recovery: true },
      { title: "Apply labels only", detail: "Do not reply, forward, delete, archive or mark read unless Demo User separately authorizes those actions." },
      { title: "Report exceptions", detail: "Summarize low-confidence cases and anything that could not be classified safely." },
    ],
    skills: ["email-classification-agent", "Gmail"],
  },
  {
    id: "preferences-guardrails",
    department: "admin",
    title: "Preferences & Guardrails",
    cadence: "On demand · when Demo User sets a preference",
    status: "manual",
    mode: "User-triggered",
    source: "Codex instructions + Obsidian",
    description: "Turns explicit working preferences into durable, correctly scoped instructions without silently changing unrelated behavior.",
    steps: [
      { title: "Capture the exact preference", detail: "Separate a durable instruction from a one-off request or temporary session choice." },
      { title: "Choose the correct scope", detail: "Decide whether it belongs in global instructions, a project AGENTS.md, search preferences or a session note." },
      { title: "Check for conflicts", detail: "Compare existing rules and explain any contradiction that would materially change behavior." },
      { title: "Write the smallest update", detail: "Preserve existing style and intent; change only the instruction required by Demo User's preference." },
      { title: "Verify future routing", detail: "Confirm the preference is readable from the workflows and projects that should inherit it." },
      { title: "Record the change", detail: "Link the durable instruction from session memory when a traceable decision record is useful." },
    ],
    skills: ["AGENTS.md", "Search Preferences", "session-to-obsidian"],
  },
  {
    id: "destiny-agent",
    department: "personal",
    title: "Fortune Tea Room",
    cadence: "Roadmap · not built yet",
    status: "planned",
    mode: "Lab concept",
    source: "Personal workspace · future",
    description: "A privacy-aware corner for reflective readings in a clearly chosen tradition, framed as interpretation rather than certainty.",
    steps: [
      { title: "Choose the tradition", detail: "Decide the first supported system—such as 八字 or 紫微斗數—instead of mixing incompatible methods." },
      { title: "Define the private input contract", detail: "Collect only the birth details and context required; explain what is stored and what remains session-only." },
      { title: "Build the calculation layer", detail: "Use a transparent, testable rules engine or trusted reference source before generating interpretation." },
      { title: "Separate calculation from reflection", detail: "Show what was calculated, what is interpretive and where uncertainty exists." },
      { title: "Add safety boundaries", detail: "Avoid deterministic medical, legal, financial or life-critical claims; present the output as reflection and entertainment." },
      { title: "Test and activate", detail: "Validate sample cases, Cantonese tone and privacy behavior before adding an automation or durable memory." },
    ],
    skills: ["Future: tradition knowledge", "Future: private profile contract", "Future: calculation engine"],
  },
  {
    id: "tarot-agent",
    department: "personal",
    title: "Tarot Looking Glass",
    cadence: "Roadmap · not built yet",
    status: "planned",
    mode: "Lab concept",
    source: "Personal workspace · future",
    description: "A guided Tarot reflection flow that turns a question and spread into grounded prompts and next actions.",
    steps: [
      { title: "Frame the question", detail: "Turn the user's concern into an open, reflective question rather than a guaranteed prediction." },
      { title: "Choose the spread", detail: "Select a small spread matched to the question and explain each position." },
      { title: "Draw with a visible method", detail: "Use an auditable shuffle or user-selected cards so the interaction is clear." },
      { title: "Interpret card and position", detail: "Connect established card meanings to the spread while separating symbolism from facts." },
      { title: "Synthesize the reflection", detail: "Highlight patterns, tensions and alternative perspectives without claiming certainty." },
      { title: "Close with grounded action", detail: "Offer journaling prompts or a reversible next step, with safety boundaries for high-stakes topics." },
    ],
    skills: ["Future: Tarot knowledge", "Future: card draw tool", "Future: reflection guardrails"],
  },
  {
    id: "food-agent",
    department: "personal",
    title: "Dinner Spinner",
    cadence: "Roadmap · when deciding a meal",
    status: "planned",
    mode: "Lab concept",
    source: "Personal workspace · future",
    description: "A live restaurant decision guide that narrows choices using location, budget, cravings and verified opening context.",
    steps: [
      { title: "Ask only decision-changing questions", detail: "Capture current location, travel radius, budget, party size, cravings and hard dietary constraints." },
      { title: "Search live restaurant options", detail: "Use current restaurant platforms or other live sources; do not rely on stale remembered listings." },
      { title: "Verify practical fit", detail: "Check current opening status, booking or queue signals, distance and suitable menu evidence where available." },
      { title: "Rank a short list", detail: "Return three distinct choices—safe, interesting and convenient—with clear trade-offs." },
      { title: "Help Demo User decide", detail: "Recommend one option and explain why it best matches the current situation." },
      { title: "Learn lightweight preferences", detail: "With permission, remember useful likes, dislikes and constraints without storing unnecessary location history." },
    ],
    skills: ["Future: live restaurant research", "Future: location-aware ranking", "Future: food preference memory"],
  },
];

const departments: Array<{
  id: DepartmentId;
  code: string;
  titleEn: string;
  titleZh: string;
  descriptionEn: string;
  descriptionZh: string;
}> = [
  { id: "pr", code: "PR", titleEn: "News & Learning", titleZh: "情報與學習", descriptionEn: "Collect, digest, deliver and recover news or WhatsApp learning.", descriptionZh: "收集、消化、傳送並復原新聞及 WhatsApp 學習內容。" },
  { id: "hr", code: "HR", titleEn: "Jobs & Applications", titleZh: "職涯與求職", descriptionEn: "Understand the Hong Kong market, tailor evidence and compare offers.", descriptionZh: "了解香港職場、整理求職證據並比較工作機會。" },
  { id: "it", code: "IT", titleEn: "Skills & Systems", titleZh: "技能與系統", descriptionEn: "Review skills, synchronize libraries and keep the workflow registry healthy.", descriptionZh: "審核技能、同步資料庫並維持工作流程登記冊。" },
  { id: "admin", code: "AD", titleEn: "Memory & Operations", titleZh: "記憶與營運", descriptionEn: "Capture decisions, maintain preferences, review notes and organize communications.", descriptionZh: "記錄決定、維護偏好、回顧筆記並整理日常溝通。" },
  { id: "personal", code: "LAB", titleEn: "Everyday Wonder Lab", titleZh: "日常奇想研究所", descriptionEn: "A future home for playful reflections and everyday decision helpers, clearly separated from live workflows.", descriptionZh: "未來用來發展反思及生活決策小玩意，並與現有工作流程清楚分開。" },
];

type WorkflowZh = {
  title: string;
  cadence: string;
  description: string;
  steps: Array<[title: string, detail: string]>;
};

const workflowZh: Record<string, WorkflowZh> = {
  "techcrunch-news": {
    title: "TechCrunch WhatsApp 新聞",
    cadence: "每日 · 香港時間 09:00",
    description: "收集最新 TechCrunch 新聞，由 Hermes 整合重點，經 WhatsApp 傳送，並記錄執行結果。",
    steps: [
      ["排程啟動", "每日香港時間 09:00 啟動一次。"],
      ["收集來源資料", "擷取最新 TechCrunch RSS 項目及可取得的文章內容。"],
      ["準備交接資料", "寫入整理後的來源資料，以及 Codex 交予 Hermes 的整合指引。"],
      ["整合新聞", "Hermes 產生十則新聞，每則包含連結及五個簡潔的影響分析觀點。"],
      ["驗證或改用後備方案", "檢查內容是否新鮮及格式正確；如 Hermes 輸出缺失或無效，改用 Codex 後備內容。"],
      ["經 WhatsApp 傳送", "移除複雜格式，只在完整行之間分段，確保每則新聞完整送出。"],
      ["記錄結果", "記錄成功或失敗狀態，並保存內容質素觀察供下次改善。"],
    ],
  },
  "whatsapp-digest": {
    title: "WhatsApp 學習摘要",
    cadence: "每日 · 香港時間 18:00",
    description: "將 WhatsApp 原始輸入消化成廣東話洞察摘要、長期記憶、網頁面板及每日學習卡。",
    steps: [
      ["重試待傳訊息", "先重試佇列中的 WhatsApp 文字；如 Hermes 或網絡仍不可用，保留佇列內容。"],
      ["復原漏收訊息", "從 Hermes gateway 記錄補回未寫入學習收件箱的訊息。"],
      ["比較覆蓋狀態", "讀取收件箱、過往已覆蓋項目、長期記憶及待傳佇列，找出新增或遺漏內容。"],
      ["消化輸入", "按主題整理、移除重複及低訊號內容，提煉教訓、風險、機會與值得追問的問題。"],
      ["更新長期紀錄", "以附加方式寫入廣東話洞察摘要及長期概念，不覆寫過往學習。"],
      ["重建完整面板", "由完整的附加式摘要紀錄重新產生網頁面板，最新內容置頂，即使沒有新項目亦會更新。"],
      ["製作每日學習卡", "產生一張按日期命名的圖片，集中表達學到甚麼，而不是列出原始訊息。"],
      ["傳送或加入佇列", "傳送文字摘要及圖片；不支援的媒體會改為廣東話面板提示，傳送失敗的文字則加入佇列。"],
      ["復原、記錄及收尾", "遇到錯誤時重新檢查收件箱、補回漏項、重建面板、排隊未送文字，並只封存已完成工作。"],
    ],
  },
  "jobsdb-daily": {
    title: "JobsDB 香港每日職位搜尋",
    cadence: "每日一次 · 09:00–23:00 補跑機會",
    description: "搜尋及核實新職位，更新每日報告與追蹤表，維護職責資料庫，再把結果電郵給 示範用戶。",
    steps: [
      ["檢查今日傳送標記", "每小時排程只用作即日補跑；如今日通知已傳送便立即停止。"],
      ["載入搜尋偏好", "搜尋前先讀取 示範用戶的目標方向、過往每日報告及職位追蹤表。"],
      ["搜尋即時市場", "以多組關鍵字搜尋香港最新的人工智能、轉型、顧客體驗、用戶體驗及產品職位。"],
      ["核實及去除重複", "盡量檢查實際招聘頁，並以正式連結、職位編號或公司與職銜組合去重。"],
      ["更新職位紀錄", "寫入今日比較報告及更新追蹤表，不刪除歷史或改動 示範用戶的個人備註。"],
      ["整理市場職責", "只從已核實職位提取僱主需求模式，絕不當作 示範用戶的個人經驗。"],
      ["驗證及同步技能", "驗證有效資料庫，完整同步至 Obsidian，並逐位元組比較兩邊內容。"],
      ["更新職責雷達", "由已驗證資料庫重新產生獨立面板並執行網頁測試。"],
      ["傳送私人 Gmail 通知", "只向 示範用戶自己的信箱傳送比較結果、最佳職位及三項市場職責訊號。"],
      ["完成或保留重試", "成功傳送後才寫入今日完成標記並封存；失敗則保留工作供稍後補跑。"],
    ],
  },
  "job-market-weekly": {
    title: "香港職位市場週報",
    cadence: "每逢星期日 · 香港時間 18:00",
    description: "彙整已核實的每日職位資料，產生每週市場報告並更新私人職位市場面板。",
    steps: [
      ["載入已核實的一週資料", "讀取搜尋偏好、每日報告、追蹤資料及現有面板快照。"],
      ["整理不重複職位", "計算數量、薪酬樣本或主題走勢前，先確定每個獨立職位。"],
      ["分開事實與解讀", "量度主題、職銜、技能、僱主及薪酬證據；資料不足時標示為基線。"],
      ["撰寫每週報告", "保留原有備註，加入已核實的週度市場摘要及下週搜尋建議。"],
      ["更新面板資料", "以相同事實更新資料檔，清楚標示資料不足情況及直接職位連結。"],
      ["建立及驗證", "以更新後資料重新建立面板並完成驗證。"],
      ["私人發佈", "儲存並發佈一個私人版本；如發佈失敗則保留本機報告。"],
      ["提供管理摘要", "回報本週重點、最佳機會及私人面板連結，不代為申請或聯絡僱主。"],
    ],
  },
  "learning-watchdog": {
    title: "WhatsApp 學習收件箱監察器",
    cadence: "啟用時每小時一次",
    description: "檢查未處理的 WhatsApp 學習內容，消化新輸入、更新面板並傳送簡潔通知。",
    steps: [
      ["讀取學習紀錄", "載入工作流程規則、原始收件箱、摘要及長期記憶。"],
      ["比較項目覆蓋狀態", "把每個收件箱編號與所有已覆蓋項目比較，包括文字、連結、圖片、檔案及語音。"],
      ["沒有新項目的分支", "如沒有未覆蓋項目，只重建面板，不新增摘要，也不傳送 WhatsApp。"],
      ["檢查及消化", "如有新項目，檢查可用附件、整理主題、去重並提煉真正有用的洞察。"],
      ["附加長期記憶", "加入新摘要及長期概念，不取代過往紀錄。"],
      ["更新面板", "由完整的附加式摘要重新建立學習面板。"],
      ["只傳送簡潔文字", "傳送或排隊廣東話摘要；每日圖片由 18:00 的主流程負責。"],
      ["記錄及封存已完成工作", "記錄成功、失敗或復原狀態，只在沒有阻礙時封存。"],
    ],
  },
  "outbox-retry": {
    title: "WhatsApp 學習待傳訊息重試",
    cadence: "啟用時每小時一次",
    description: "先更新學習面板，再重試佇列中的 WhatsApp 訊息，不產生重複內容。",
    steps: [
      ["更新長期面板", "處理傳送前，先由完整摘要重建網頁面板。"],
      ["讀取待傳佇列", "只在需要判斷剩餘工作時檢查佇列紀錄。"],
      ["重試佇列文字", "只重送現有訊息，不建立新摘要或其他新內容。"],
      ["轉換不支援的媒體", "Hermes 不支援媒體時，把舊媒體紀錄改成廣東話面板提示。"],
      ["保留未成功工作", "如網絡仍不可用，完整保留佇列供下次重試。"],
      ["記錄及收尾", "記錄結果，並只在沒有意外阻礙時封存工作。"],
    ],
  },
  "ats-application": {
    title: "ATS 求職文件組合",
    cadence: "按需要 · 針對指定職位",
    description: "把已核實的職涯證據配對職位要求，製作真確並經視覺檢查的履歷與求職信。",
    steps: [
      ["閱讀目標職位", "從職位描述提取主要職責、要求、職級訊號及 ATS 關鍵字。"],
      ["載入 示範用戶的已核實證據", "使用原始履歷、已確認職涯證據及僱主需求資料庫，保持證據界線清楚。"],
      ["建立配對圖", "把有證據支持的成果連結至職位需要，列出缺口，不虛構經驗或數據。"],
      ["撰寫針對性履歷", "優先呈現最相關的真實證據及 ATS 用語，同時保持精簡。"],
      ["撰寫求職信", "以 示範用戶的證據連結公司需要，避免空泛或機械化內容。"],
      ["輸出及檢查", "產生 DOCX、逐頁輸出預覽，修正間距、溢出及視覺層級。"],
      ["交付求職文件", "提供已驗證檔案，並列出 示範用戶申請前需要處理的重要證據缺口。"],
    ],
  },
  "obsidian-reviews": {
    title: "Obsidian 回顧系統",
    cadence: "每日 · 每週 · 每月",
    description: "以非破壞方式回顧筆記，找出趨勢、過時內容及資料庫健康問題，不搬移或改寫來源筆記。",
    steps: [
      ["選擇回顧範圍", "執行每日收件箱、七日週報、每月整合或資料庫健康檢查。"],
      ["閱讀而不重組", "檢查相關筆記、中繼資料及連結，同時保留來源內容與資料夾位置。"],
      ["找出重要訊號", "識別主題、未完成行動、過時筆記、失效連結及值得重新留意的內容。"],
      ["寫入回顧結果", "建立指定範圍的摘要，並連結回原始筆記。"],
      ["只建議，不刪除", "標示可考慮封存或整理的項目，但不搬移、刪除或改寫使用者內容。"],
    ],
  },
  "skill-review": {
    title: "技能審核與安裝",
    cadence: "按需要 · 安裝前取得批准",
    description: "靜態審核候選技能、檢查來源及重疊，取得明確批准後才安裝及同步指定版本。",
    steps: [
      ["確認候選技能", "安裝前確定準確來源、版本、目錄及出處。"],
      ["進行靜態審核", "閱讀技能說明、程式、參考資料、範本及素材，檢查危險指令、網絡動作與隱藏依賴。"],
      ["檢查重疊及命名", "與現有全域及專案技能比較，避免名稱衝突或重複能力。"],
      ["驗證指定版本", "確保技能說明可讀，並在不執行不受信任安裝程式的情況下完成驗證。"],
      ["預覽準確改動", "顯示將會安裝或更新的內容，並取得該指定版本的明確批准。"],
      ["安裝已批准版本", "把完整技能目錄放入有效資料庫，不改動 Codex 管理的系統或外掛技能。"],
      ["同步至 Obsidian", "完整同步程式、參考資料、素材及專案命名空間。"],
      ["逐位元組驗證", "比較兩邊資料庫；遇到衝突、額外檔案或不完整同步時直接報告，不覆寫不明差異。"],
    ],
  },
  "session-memory": {
    title: "工作階段記憶",
    cadence: "按需要 · 示範用戶說「記低」時",
    description: "把決定、成果及下一步整理成精簡長期紀錄，存入 Obsidian 收件箱，不改動舊筆記。",
    steps: [
      ["識別保存意圖", "當 示範用戶說「記低」、保存工作階段或要求保留重要成果時啟動。"],
      ["收集有用紀錄", "整理目標、決定、產生的檔案、已驗證結果及未完成下一步。"],
      ["濃縮工作階段", "移除對話雜訊，寫成離開原對話後仍然有用的簡潔摘要。"],
      ["建立收件箱筆記", "建立新的 Obsidian 收件箱筆記並連結相關檔案，不覆寫舊筆記。"],
      ["確認已保存內容", "回報筆記位置及仍需 示範用戶處理的下一步。"],
    ],
  },
  "offer-comparison": {
    title: "工作機會比較與決策",
    cadence: "按需要 · 收到工作機會時",
    description: "統一整理不同工作機會，清楚比較薪酬、職位質素與取捨，不隱藏假設。",
    steps: [
      ["收集可比較資料", "記錄每個工作機會的底薪、花紅、股權、福利、職銜、職責、工作模式及時限。"],
      ["統一薪酬計算", "以一致方式轉換支薪週期及貨幣，標示不確定或附帶條件的數值。"],
      ["比較職位本身", "評估職責、學習機會、領導範圍、穩定性、品牌、彈性及與 示範用戶目標的配合。"],
      ["套用個人優先次序", "按 示範用戶選定的準則加權，不假設薪酬是唯一決定因素。"],
      ["呈現取捨與風險", "清楚列出資料缺口、歸屬條件、試用期、交通及負面情境。"],
      ["產生決策簡報", "提供並列建議、談判重點及可能改變結論的假設。"],
    ],
  },
  "workflow-registry": {
    title: "工作流程登記冊與面板",
    cadence: "按需要 · 系統改動後",
    description: "審核工作流程規則、排程及技能，更新這個營運面板而不改動無關工作。",
    steps: [
      ["盤點系統", "讀取自動化設定、正式工作流程、有效技能及專案技能。"],
      ["處理命名與排程差異", "比較顯示名稱、內部識別碼、文件排程及實際重複設定。"],
      ["整理依賴關係", "把每條工作流程連結至自動化、程式、技能、工作空間、輸出及記憶紀錄。"],
      ["更新登記冊", "更新分類、狀態及逐步路線，同時保留重要歷史差異。"],
      ["建立及驗證", "編譯面板並檢查篩選、選擇、無障礙及響應式版面。"],
      ["獲授權後才發佈", "保留已驗證的本機版本，只在 示範用戶批准外部發佈後才私人部署。"],
    ],
  },
  "meeting-followup": {
    title: "會議紀錄與跟進",
    cadence: "按需要 · 會議後",
    description: "把會議筆記或謄本整理成決定、具責任人的行動及簡潔主管進度電郵草稿。",
    steps: [
      ["閱讀會議紀錄", "載入謄本、筆記或會議敘述，識別參與者及背景。"],
      ["分開重點與討論", "提取決定、未解問題、風險及依賴，不虛構共識。"],
      ["建立行動清單", "在來源支持下，為每項跟進列出負責人、時限及狀態。"],
      ["撰寫簡潔會議紀錄", "產生易讀紀錄，集中成果及有來源支持的下一步。"],
      ["草擬進度電郵", "準備清晰的主管更新供 示範用戶審閱；傳送需要另行授權。"],
    ],
  },
  "email-classification": {
    title: "電郵分類",
    cadence: "按需要 · 有限範圍收件箱整理",
    description: "在嚴格的唯讀及加標籤界線內分類訊息，並清楚處理不確定情況。",
    steps: [
      ["確認收件箱範圍", "閱讀前先確定帳戶、日期範圍及容許使用的標籤。"],
      ["檢查訊息背景", "讀取足夠的對話內容，判斷意圖、緊急程度及是否需要回覆。"],
      ["按信心分類", "根據可見電郵證據，選擇最合適的容許標籤。"],
      ["不確定項目標示待確認", "信心不足時不猜測，把訊息留給 示範用戶決定。"],
      ["只套用標籤", "除非 示範用戶另行授權，否則不回覆、轉寄、刪除、封存或標示已讀。"],
      ["報告例外情況", "總結低信心項目及無法安全分類的訊息。"],
    ],
  },
  "preferences-guardrails": {
    title: "個人偏好與工作守則",
    cadence: "按需要 · 示範用戶設定偏好時",
    description: "把明確工作偏好寫成合適範圍的長期指引，不暗中改變無關行為。",
    steps: [
      ["記錄準確偏好", "分辨長期指引、一次性要求及只適用於目前工作階段的選擇。"],
      ["選擇正確範圍", "判斷偏好應放在全域指引、專案規則、搜尋偏好或工作階段筆記。"],
      ["檢查規則衝突", "比較現有規則，解釋任何會明顯改變行為的矛盾。"],
      ["作出最小改動", "保留原有風格與意圖，只修改 示範用戶指定偏好所需的部分。"],
      ["驗證未來套用範圍", "確認相關工作流程及專案能夠讀取該偏好。"],
      ["記錄改動", "如需要可追溯決策紀錄，從工作階段記憶連結至長期指引。"],
    ],
  },
  "destiny-agent": {
    title: "命運小茶館",
    cadence: "發展藍圖 · 尚未建立",
    description: "按指定傳統提供重視私隱的反思式解讀，清楚說明這是詮釋而非確定預言。",
    steps: [
      ["選擇傳統", "先決定支援八字、紫微斗數或其他單一系統，避免混合不相容方法。"],
      ["定義私人輸入規則", "只收集必要出生資料及背景，清楚說明哪些會保存、哪些只留在本次對話。"],
      ["建立計算層", "使用透明、可測試的規則引擎或可信參考來源，再產生解讀。"],
      ["分開計算與反思", "顯示計算結果、詮釋部分及不確定之處。"],
      ["加入安全界線", "避免對醫療、法律、財務或重大人生決定作確定聲稱，把內容定位為反思與娛樂。"],
      ["測試及啟用", "加入自動化或長期記憶前，先驗證範例、廣東話語氣及私隱行為。"],
    ],
  },
  "tarot-agent": {
    title: "塔羅小鏡房",
    cadence: "發展藍圖 · 尚未建立",
    description: "把問題及牌陣轉化成有根據的反思提示與下一步，而非保證式預言。",
    steps: [
      ["整理問題", "把關注點改寫成開放式反思問題，而不是要求必然預測。"],
      ["選擇牌陣", "按問題選擇小型牌陣，並解釋每個位置的作用。"],
      ["以可見方式抽牌", "使用可核實的洗牌方法或由使用者選牌，保持過程清楚。"],
      ["解讀牌義與位置", "把既有牌義連結至牌陣，同時分開象徵與事實。"],
      ["整合反思", "提出模式、張力及其他角度，不聲稱結果必然發生。"],
      ["以實際行動作結", "提供日記問題或可逆下一步，高風險議題保留清楚安全界線。"],
    ],
  },
  "food-agent": {
    title: "食咩好轉盤",
    cadence: "發展藍圖 · 選擇用餐時",
    description: "根據位置、預算、口味及即時營業資料，縮窄餐廳選擇。",
    steps: [
      ["只問會影響決定的問題", "了解目前位置、可接受路程、預算、人數、想吃的類型及必要飲食限制。"],
      ["搜尋即時餐廳選擇", "使用現時餐廳平台或其他即時資料來源，不依賴過時記憶。"],
      ["核實實際合適度", "盡量檢查營業狀態、訂位或輪候訊號、距離及合適菜式證據。"],
      ["排列精簡名單", "提供三個有明顯分別的選擇：穩妥、新鮮及方便，並說明取捨。"],
      ["協助 示範用戶決定", "推薦一個最符合當下情況的選擇，並解釋原因。"],
      ["輕量學習偏好", "獲同意後記住有用的喜好、厭惡及限制，不保存不必要的位置歷史。"],
    ],
  },
};

const globalSkills = [
  ["bridge-whatsapp-hermes-codex", "WhatsApp transport, recovery, Q&A and delivery", "WhatsApp 傳送、復原、問答及交付"],
  ["archive-whatsapp-learning-digest", "Closes completed WhatsApp automation tasks", "封存已完成的 WhatsApp 自動化工作"],
  ["tailor-demo-application", "Evidence-led CV and cover-letter orchestration", "以證據為本的履歷及求職信流程"],
  ["build-tailored-resume", "Guardrailed ATS resume creation and DOCX rendering", "有守則的 ATS 履歷製作及 DOCX 輸出"],
  ["job-responsibility-library", "Verified HK market responsibilities and ATS terms", "已核實的香港市場職責及 ATS 用語"],
  ["offer-comparison-analyzer", "Total-compensation and decision comparison", "整體薪酬及決策比較"],
  ["avoid-ai-writing", "Detects and removes AI-writing patterns", "找出並移除人工智能寫作痕跡"],
  ["meeting-minutes-followup-email", "Minutes, actions and boss-update drafts", "會議紀錄、行動及主管更新草稿"],
  ["email-classification-agent", "Strictly bounded email labelling", "嚴格限制範圍的電郵標籤分類"],
  ["session-to-obsidian", "Durable session notes in the Obsidian inbox", "把工作階段紀錄保存至 Obsidian 收件箱"],
  ["karpathy-guidelines", "Surgical coding discipline and verification", "精準程式改動及驗證守則"],
  ["minimum-sufficient-engineering", "Smallest safe implementation path", "最小而安全的實作路徑"],
  ["build-scroll-scrub-video", "Responsive scroll-driven video sections", "響應式捲動影片區段"],
  ["ui-ux-pro-max", "UI systems, accessibility and design guidance", "介面系統、無障礙及設計指引"],
  ["headroom-context-compression", "Reversible agent-context compression", "可還原的智能體內容壓縮"],
];

const projectSkills = [
  ["daily-review", "Non-destructive Inbox review", "非破壞式收件箱回顧"],
  ["weekly-review", "Seven-day themes and resurfacing", "七日主題及內容重現"],
  ["monthly-review", "Monthly synthesis and archive suggestions", "每月整合及封存建議"],
  ["vault-lint", "Links, metadata and stale-note health check", "連結、中繼資料及過時筆記健康檢查"],
  ["tailor-demo-application · Hunter", "Project-scoped application evidence", "Hunter 專案範圍的求職證據"],
];

const filters: Array<{ label: string; value: "all" | WorkflowStatus }> = [
  { label: "All states", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Manual", value: "manual" },
  { label: "Planned", value: "planned" },
];

type DashboardId = "learning" | "jobs";

type DemoDashboard = {
  code: string;
  title: [string, string];
  columns: [string[], string[]];
  rows: Array<{ en: string[]; zh: string[] }>;
  notesTitle: [string, string];
  notes: Array<[string, string]>;
};

// Demo fixtures. Fictional sample data for the public showcase build.
const demoDashboards: Record<DashboardId, DemoDashboard> = {
  learning: {
    code: "LEARN.01",
    title: ["Learning Dashboard", "學習面板"],
    columns: [
      ["Date", "Topic", "Distilled lesson"],
      ["日期", "主題", "已整理重點"],
    ],
    rows: [
      {
        en: ["2026-02-03", "Prompt design", "Write the acceptance check before writing the prompt."],
        zh: ["2026-02-03", "提示詞設計", "先寫驗收條件，再寫提示。"],
      },
      {
        en: ["2026-02-02", "Hong Kong job market", "“Stakeholder coordination” repeats across most postings."],
        zh: ["2026-02-02", "香港求職市場", "多數職位描述都重複出現「持份者協調」。"],
      },
      {
        en: ["2026-02-01", "Automation ops", "A schedule needs a healthcheck, not a human noticing it died."],
        zh: ["2026-02-01", "自動化維運", "排程要有健康檢查，唔可以靠人手發現死咗。"],
      },
      {
        en: ["2026-01-31", "Note system", "One topic per note keeps later search usable."],
        zh: ["2026-01-31", "筆記系統", "一個話題一篇筆記，日後先搵得返。"],
      },
      {
        en: ["2026-01-30", "Meeting follow-up", "Every action item carries an owner and a due date."],
        zh: ["2026-01-30", "會議跟進", "每條行動項目都要有負責人同限期。"],
      },
    ],
    notesTitle: ["Latest digest", "最新摘要"],
    notes: [
      ["12 lessons distilled over the past 7 days.", "過去 7 日整理咗 12 條學習重點。"],
      ["5 of them promoted to durable memory.", "其中 5 條已轉為長期記憶。"],
      ["Next review: Sunday 18:00 HKT.", "下次回顧：星期日 香港時間 18:00。"],
    ],
  },
  jobs: {
    code: "JOBS.01",
    title: ["Job Responsibility Radar", "職位職責雷達"],
    columns: [
      ["Recurring responsibility", "ATS phrasing", "Match"],
      ["常見職責", "ATS 用語", "配對度"],
    ],
    rows: [
      {
        en: ["Cross-team coordination", "stakeholder coordination", "High"],
        zh: ["跨部門協調", "stakeholder coordination", "高"],
      },
      {
        en: ["Process automation", "process automation", "High"],
        zh: ["流程自動化", "process automation", "高"],
      },
      {
        en: ["Reporting", "reporting & dashboards", "Medium"],
        zh: ["數據報表", "reporting & dashboards", "中"],
      },
      {
        en: ["Vendor management", "vendor management", "Medium"],
        zh: ["供應商管理", "vendor management", "中"],
      },
      {
        en: ["Internal training", "internal enablement", "Low"],
        zh: ["內部培訓", "internal enablement", "低"],
      },
    ],
    notesTitle: ["Sample matched openings", "示範配對職位"],
    notes: [
      ["Demo Company A · Operations Specialist (Hong Kong)", "示範公司 A · 營運專員（香港）"],
      ["Demo Company B · Process Improvement Officer", "示範公司 B · 流程改善主任"],
      ["Demo Company C · Data Operations Analyst", "示範公司 C · 資料營運分析員"],
    ],
  },
};

function StatusBadge({
  status,
  language,
}: {
  status: WorkflowStatus;
  language: "en" | "zh";
}) {
  const labels: Record<WorkflowStatus, { en: string; zh: string }> = {
    active: { en: "Active", zh: "運行中" },
    paused: { en: "Paused", zh: "已暫停" },
    manual: { en: "Manual", zh: "手動" },
    planned: { en: "Planned", zh: "規劃中" },
  };
  return (
    <span className={`status-badge status-${status}`}>
      <span aria-hidden="true" className="status-dot" />
      {labels[status][language]}
    </span>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<"en" | "zh">("zh");
  const [filter, setFilter] = useState<"all" | WorkflowStatus>("all");
  const [department, setDepartment] = useState<"all" | DepartmentId>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(workflows[0].id);
  const [openDashboard, setOpenDashboard] = useState<DashboardId | null>(null);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-HK" : "en-HK";
  }, [language]);

  const visibleWorkflows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return workflows.filter((workflow) => {
      const matchesFilter = filter === "all" || workflow.status === filter;
      const matchesDepartment =
        department === "all" || workflow.department === department;
      const departmentCopy = departments.find(
        (item) => item.id === workflow.department,
      );
      const searchable = [
        workflow.title,
        workflow.source,
        workflow.mode,
        departmentCopy?.code ?? "",
        departmentCopy?.titleEn ?? "",
        departmentCopy?.titleZh ?? "",
        workflowZh[workflow.id]?.title ?? "",
        workflowZh[workflow.id]?.description ?? "",
        ...(workflowZh[workflow.id]?.steps.flatMap((step) => step) ?? []),
        ...workflow.skills,
        ...workflow.steps.flatMap((step) => [step.title, step.detail]),
      ]
        .join(" ")
        .toLowerCase();
      return (
        matchesFilter &&
        matchesDepartment &&
        (!normalizedQuery || searchable.includes(normalizedQuery))
      );
    });
  }, [department, filter, query]);

  const selected =
    visibleWorkflows.find((workflow) => workflow.id === selectedId) ??
    visibleWorkflows[0] ??
    null;
  const selectedDepartment = selected
    ? departments.find((item) => item.id === selected.department)
    : null;
  const selectedZh = selected ? workflowZh[selected.id] : null;
  const localized = (english: string, chinese: string) =>
    language === "zh" ? chinese : english;
  const operationalWorkflowCount = workflows.filter(
    (workflow) => workflow.status !== "planned",
  ).length;
  const plannedWorkflowCount = workflows.length - operationalWorkflowCount;
  const registeredSkillCount =
    registry.sources.globalSkills.count + registry.sources.projectSkills.count;
  const snapshotDate = new Intl.DateTimeFormat(
    language === "zh" ? "zh-HK" : "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Hong_Kong",
    },
  ).format(new Date(registry.capturedAt));
  const filterLabels: Record<"all" | WorkflowStatus, { en: string; zh: string }> = {
    all: { en: "All states", zh: "全部狀態" },
    active: { en: "Active", zh: "運行中" },
    paused: { en: "Paused", zh: "已暫停" },
    manual: { en: "Manual", zh: "手動" },
    planned: { en: "Planned", zh: "規劃中" },
  };
  const selectedMode = selected
    ? localized(
        selected.mode,
        selected.mode === "Automated"
          ? "自動執行"
          : selected.mode === "Lab concept"
            ? "研究所構想"
            : "使用者啟動",
      )
    : "";
  const selectedSource = selected
    ? localized(
        selected.source,
        ({
          "Start From Scratch": "Start From Scratch 專案",
          Hunter: "Hunter 專案",
          "Dotai Builder": "Dotai Builder 專案",
          "Skill Installer": "技能安裝器",
          "Manage Codex": "Manage Codex 專案",
          "Codex Global": "Codex 全域",
          "Codex instructions + Obsidian": "Codex 指引與 Obsidian",
          "Personal workspace · future": "未來個人工作空間",
        } as Record<string, string>)[selected.source] ?? selected.source,
      )
    : "";

  function chooseDepartment(nextDepartment: "all" | DepartmentId) {
    setDepartment(nextDepartment);
    const firstMatch = workflows.find(
      (workflow) =>
        (nextDepartment === "all" || workflow.department === nextDepartment) &&
        (filter === "all" || workflow.status === filter),
    );
    if (firstMatch) setSelectedId(firstMatch.id);
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        {localized("Skip to dashboard content", "跳到面板內容")}
      </a>

      <div className="site-shell" lang={language === "zh" ? "zh-HK" : "en-HK"}>
        <header className="topbar">
          <div>
            <p className="eyebrow">
              <span aria-hidden="true" className="eyebrow-line" />
              {localized(
                "One-person company automation control panel · HKT",
                "一人公司自動化管理面板 · 香港時間",
              )}
            </p>
            <h1>{localized("Demo Workflow OS", "示範工作流程作業系統")}</h1>
          </div>
          <div className="topbar-actions">
            <div
              aria-label={localized("Language panel", "語言面板")}
              className="language-panel"
              role="group"
            >
              <button
                aria-pressed={language === "zh"}
                className={language === "zh" ? "language-active" : ""}
                lang="zh-HK"
                onClick={() => setLanguage("zh")}
                type="button"
              >
                中文
              </button>
              <button
                aria-pressed={language === "en"}
                className={language === "en" ? "language-active" : ""}
                lang="en"
                onClick={() => setLanguage("en")}
                type="button"
              >
                English
              </button>
            </div>
            <div
              className="registry-state"
              aria-label={localized(
                "System status: registry snapshot verified",
                "系統狀態：登記冊快照已核對",
              )}
            >
              <span className="health-line">
                <span aria-hidden="true" className="health-dot" />
                {localized("Registry snapshot verified", "登記冊快照已核對")}
              </span>
              <span className="snapshot-date">
                {localized(
                  `System snapshot · ${snapshotDate} · ${registry.sources.automations.count} automations`,
                  `系統快照 · ${snapshotDate} · ${registry.sources.automations.count} 個自動化`,
                )}
              </span>
            </div>
          </div>
        </header>

        <nav aria-label={localized("Dashboard sections", "面板章節")} className="section-nav">
          <a href="#overview">{localized("Overview", "概覽")}</a>
          <a href="#dashboards">{localized("Live dashboards", "即時面板")}</a>
          <a href="#company">{localized("Company functions", "公司職能")}</a>
          <a href="#workflows">{localized("Step-by-step workflows", "逐步工作流程")}</a>
          <a href="#skills">{localized("Skills library", "技能資料庫")}</a>
          <a href="#system">{localized("System layers", "系統層次")}</a>
        </nav>

        <main id="main-content">
          <section aria-labelledby="overview-heading" className="metrics" id="overview">
            <h2 className="sr-only" id="overview-heading">
              {localized("Registry overview", "登記冊概覽")}
            </h2>
            <article className="metric metric-active">
              <span className="metric-value">{departments.length}</span>
              <span className="metric-label">{localized("Company functions", "公司職能")}</span>
              <span className="metric-code">
                ORG.{String(departments.length).padStart(2, "0")}
              </span>
            </article>
            <article className="metric metric-paused">
              <span className="metric-value">{operationalWorkflowCount}</span>
              <span className="metric-label">{localized("Current workflows", "現有工作流程")}</span>
              <span className="metric-code">
                OPS.{String(operationalWorkflowCount).padStart(2, "0")}
              </span>
            </article>
            <article className="metric metric-global">
              <span className="metric-value">{plannedWorkflowCount}</span>
              <span className="metric-label metric-label-wide">
                {localized("Planned lab curiosities", "規劃中研究所奇想")}
              </span>
              <span className="metric-code">
                LAB.{String(plannedWorkflowCount).padStart(2, "0")}
              </span>
            </article>
            <article className="metric metric-project">
              <span className="metric-value">{registeredSkillCount}</span>
              <span className="metric-label">{localized("User-managed skills", "使用者管理技能")}</span>
              <span className="metric-code">
                LIB.{String(registeredSkillCount).padStart(2, "0")}
              </span>
            </article>
          </section>

          <section
            aria-labelledby="dashboards-heading"
            className="dashboard-links-section"
            id="dashboards"
          >
            <div className="dashboard-links-intro">
              <div>
                <p className="section-index">
                  {localized("Quick access · Live dashboards", "快速入口 · 即時面板")}
                </p>
                <h2 id="dashboards-heading">
                  {localized(
                    "Open the latest learning and job-market views.",
                    "開啟最新學習及求職市場視圖。",
                  )}
                </h2>
              </div>
              <p>
                {localized(
                  "Two focused dashboards turn daily learning and job-market signals into clear next actions.",
                  "兩個專屬面板，把每日學習及職場訊號整理成清晰的下一步。",
                )}
              </p>
            </div>

            <div className="dashboard-link-grid">
              <button
                aria-expanded={openDashboard === "learning"}
                className="dashboard-link-card dashboard-link-learning"
                onClick={() => setOpenDashboard(openDashboard === "learning" ? null : "learning")}
                type="button"
              >
                <span className="dashboard-link-code">LEARN.01</span>
                <strong>{localized("Learning Dashboard", "學習面板")}</strong>
                <span>
                  {localized(
                    "Review distilled lessons, durable memory and the latest learning digest.",
                    "查看已整理的學習重點、長期記憶及最新學習摘要。",
                  )}
                </span>
                <span className="dashboard-link-action">
                  {localized("Open dashboard", "開啟面板")}
                  <span aria-hidden="true">↗</span>
                </span>
              </button>

              <button
                aria-expanded={openDashboard === "jobs"}
                className="dashboard-link-card dashboard-link-jobs"
                onClick={() => setOpenDashboard(openDashboard === "jobs" ? null : "jobs")}
                type="button"
              >
                <span className="dashboard-link-code">JOBS.01</span>
                <strong>{localized("Job Responsibility Radar", "職位職責雷達")}</strong>
                <span>
                  {localized(
                    "Track recurring responsibilities, ATS language and strong Hong Kong opportunities.",
                    "追蹤常見職責、ATS 用語及香港市場的高配對工作機會。",
                  )}
                </span>
                <span className="dashboard-link-action">
                  {localized("Open dashboard", "開啟面板")}
                  <span aria-hidden="true">↗</span>
                </span>
              </button>
            </div>

            {openDashboard ? (
              <article aria-live="polite" className={`dashboard-demo-panel dashboard-demo-${openDashboard}`}>
                <div className="dashboard-demo-head">
                  <span className="dashboard-link-code">{demoDashboards[openDashboard].code}</span>
                  <h3>
                    {localized(
                      demoDashboards[openDashboard].title[0],
                      demoDashboards[openDashboard].title[1],
                    )}
                  </h3>
                  <span className="dashboard-demo-tag">
                    {localized("Demo snapshot · not live data", "示範快照 · 非即時資料")}
                  </span>
                  <button
                    className="dashboard-demo-close"
                    onClick={() => setOpenDashboard(null)}
                    type="button"
                  >
                    {localized("Close", "關閉")}
                  </button>
                </div>
                <table className="dashboard-demo-table">
                  <thead>
                    <tr>
                      {demoDashboards[openDashboard].columns[language === "zh" ? 1 : 0].map(
                        (column) => (
                          <th key={column} scope="col">
                            {column}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {demoDashboards[openDashboard].rows.map((row) => {
                      const cells = language === "zh" ? row.zh : row.en;
                      return (
                        <tr key={row.en[0] + row.en[1]}>
                          {cells.map((cell, cellIndex) => (
                            <td key={`${row.en[0]}-${cellIndex}`}>{cell}</td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="dashboard-demo-notes">
                  <span>
                    {localized(
                      demoDashboards[openDashboard].notesTitle[0],
                      demoDashboards[openDashboard].notesTitle[1],
                    )}
                  </span>
                  <ul>
                    {demoDashboards[openDashboard].notes.map((note) => (
                      <li key={note[0]}>{localized(note[0], note[1])}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ) : null}
          </section>

          <section aria-labelledby="company-heading" className="company-section" id="company">
            <div className="section-heading">
              <div>
                <p className="section-index">{localized("01 · Company functions", "01 · 公司職能")}</p>
                <h2 id="company-heading">
                  {localized("One person. Five operating functions.", "一個人，五個營運職能。")}
                </h2>
              </div>
              <p>
                {localized(
                  "Choose a function to see only its workflows. Everyday Wonder Lab is a roadmap; the other four are already operating.",
                  "選擇職能後只顯示相關工作流程。日常奇想研究所仍是發展藍圖，其餘四個職能已經運作。",
                )}
              </p>
            </div>

            <div className="department-all-row">
              <button
                aria-pressed={department === "all"}
                className={department === "all" ? "department-all department-active" : "department-all"}
                onClick={() => chooseDepartment("all")}
                type="button"
              >
                <span>{localized("ALL", "全部")}</span>
                <strong>{localized("Whole company", "整間公司")}</strong>
                <small>
                  {localized(
                    `${workflows.length} routes across every function`,
                    `五個職能合共有 ${workflows.length} 條路線`,
                  )}
                </small>
              </button>
            </div>

            <div className="department-grid">
              {departments.map((item) => {
                const departmentWorkflows = workflows.filter(
                  (workflow) => workflow.department === item.id,
                );
                const activeCount = departmentWorkflows.filter(
                  (workflow) => workflow.status !== "planned",
                ).length;
                return (
                  <button
                    aria-pressed={department === item.id}
                    className={`department-card department-${item.id} ${department === item.id ? "department-active" : ""}`}
                    key={item.id}
                    onClick={() => chooseDepartment(item.id)}
                    type="button"
                  >
                    <span className="department-code">{item.code}</span>
                    <span className="department-copy">
                      <strong>{localized(item.titleEn, item.titleZh)}</strong>
                    </span>
                    <span className="department-description">
                      {localized(item.descriptionEn, item.descriptionZh)}
                    </span>
                    <span className="department-count">
                      {item.id === "personal"
                        ? localized(`${departmentWorkflows.length} planned`, `${departmentWorkflows.length} 個規劃項目`)
                        : localized(`${activeCount} workflows`, `${activeCount} 條工作流程`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="workflow-heading" className="workflow-section" id="workflows">
            <div className="section-heading">
              <div>
                <p className="section-index">
                  {localized("02 · Click-through workflow map", "02 · 可點選工作流程圖")}
                </p>
                <h2 id="workflow-heading">
                  {localized("Click a route. See every step.", "點選路線，查看每個步驟。")}
                </h2>
              </div>
              <p>
                {localized(
                  "Main actions, outputs, retry branches and underlying skills stay together in one operating view.",
                  "主要行動、輸出、重試分支及底層技能全部集中在同一個營運畫面。",
                )}
              </p>
            </div>

            <div className="workflow-tools">
              <div className="workflow-filter-stack">
                <span className="current-department">
                  {localized("Function", "職能")} · {department === "all"
                    ? localized("Whole company", "整間公司")
                    : localized(
                        departments.find((item) => item.id === department)?.titleEn ?? "",
                        departments.find((item) => item.id === department)?.titleZh ?? "",
                      )}
                </span>
                <div
                  aria-label={localized("Filter workflow routes by status", "按狀態篩選工作流程")}
                  className="filter-group"
                  role="group"
                >
                  {filters.map((item) => (
                    <button
                      aria-pressed={filter === item.value}
                      className={filter === item.value ? "filter-active" : ""}
                      key={item.value}
                      onClick={() => setFilter(item.value)}
                      type="button"
                    >
                      {filterLabels[item.value][language]}
                    </button>
                  ))}
                </div>
              </div>
              <label className="search-field">
                <span>{localized("Search steps, routes or skills", "搜尋步驟、路線或技能")}</span>
                <input
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={localized(
                    "e.g. retry, JobsDB or preference",
                    "例如：重試、JobsDB 或偏好",
                  )}
                  type="search"
                  value={query}
                />
              </label>
            </div>

            <div className="workflow-layout">
              <div className="workflow-list">
                {visibleWorkflows.length ? (
                  visibleWorkflows.map((workflow, index) => (
                    <button
                      aria-pressed={selected?.id === workflow.id}
                      className={`workflow-row ${selected?.id === workflow.id ? "workflow-selected" : ""}`}
                      key={workflow.id}
                      onClick={() => setSelectedId(workflow.id)}
                      type="button"
                    >
                      <span className="workflow-number">
                        {departments.find((item) => item.id === workflow.department)?.code}
                        .{String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="workflow-name">
                        <strong>{localized(workflow.title, workflowZh[workflow.id].title)}</strong>
                        <span>
                          {localized(workflow.cadence, workflowZh[workflow.id].cadence)} · {localized(
                            `${workflow.steps.length} steps`,
                            `${workflow.steps.length} 個步驟`,
                          )}
                        </span>
                      </span>
                      <span
                        className="workflow-chips"
                        aria-label={localized("Underlying skills", "底層技能")}
                      >
                        {workflow.skills.slice(0, 3).map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                        {workflow.skills.length > 3 ? (
                          <span>+{workflow.skills.length - 3}</span>
                        ) : null}
                      </span>
                      <StatusBadge language={language} status={workflow.status} />
                    </button>
                  ))
                ) : (
                  <div className="empty-state">
                    <strong>{localized("No matching routes", "找不到相符路線")}</strong>
                    <span>
                      {localized(
                        "Choose another company function, status or search term.",
                        "請選擇其他公司職能、狀態或搜尋字詞。",
                      )}
                    </span>
                    <button
                      onClick={() => {
                        setDepartment("all");
                        setFilter("all");
                        setQuery("");
                      }}
                      type="button"
                    >
                      {localized("Reset filters", "重設篩選")}
                    </button>
                  </div>
                )}
              </div>

              {selected ? (
                <aside aria-live="polite" className={`route-inspector inspector-${selected.department}`}>
                  <div className="inspector-summary">
                    <div className="inspector-label">
                      <span>
                        {selectedDepartment?.code} · {localized(
                          selectedDepartment?.titleEn ?? "",
                          selectedDepartment?.titleZh ?? "",
                        )}
                      </span>
                      <StatusBadge language={language} status={selected.status} />
                    </div>
                    <h3>{localized(selected.title, selectedZh?.title ?? selected.title)}</h3>
                    <p>{localized(selected.description, selectedZh?.description ?? selected.description)}</p>
                    <dl>
                      <div>
                        <dt>{localized("Cadence", "執行頻率")}</dt>
                        <dd>{localized(selected.cadence, selectedZh?.cadence ?? selected.cadence)}</dd>
                      </div>
                      <div>
                        <dt>{localized("Execution", "執行方式")}</dt>
                        <dd>{selectedMode}</dd>
                      </div>
                      <div>
                        <dt>{localized("Workspace", "工作空間")}</dt>
                        <dd>{selectedSource}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="workflow-detail">
                    <div className="detail-heading">
                      <span>{localized("Complete workflow", "完整工作流程")}</span>
                      <strong>
                        {localized(`${selected.steps.length} steps`, `${selected.steps.length} 個步驟`)}
                      </strong>
                    </div>
                    <ol className="step-timeline">
                      {selected.steps.map((step, index) => {
                        const translatedStep = selectedZh?.steps[index];
                        return (
                          <li className={step.recovery ? "step-recovery" : ""} key={`${selected.id}-${step.title}`}>
                            <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
                            <div>
                              <span className="step-kicker">
                                {step.recovery
                                  ? localized("Fallback / retry branch", "後備或重試分支")
                                  : localized("Main route", "主要路線")}
                              </span>
                              <h4>{localized(step.title, translatedStep?.[0] ?? step.title)}</h4>
                              <p>{localized(step.detail, translatedStep?.[1] ?? step.detail)}</p>
                              {step.output ? <code>{step.output}</code> : null}
                            </div>
                          </li>
                        );
                      })}
                    </ol>

                    <div className="inspector-skills">
                      <span>{localized("Underlying skills & capabilities", "底層技能與能力")}</span>
                      <div>
                        {selected.skills.map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </aside>
              ) : (
                <aside aria-live="polite" className="route-inspector route-inspector-empty">
                  <strong>{localized("No route selected", "尚未選擇路線")}</strong>
                  <span>
                    {localized(
                      "Reset the filters to continue exploring the company workflow map.",
                      "重設篩選後繼續查看公司工作流程圖。",
                    )}
                  </span>
                </aside>
              )}
            </div>
          </section>

          <section aria-labelledby="skills-heading" className="skills-section" id="skills">
            <div className="section-heading">
              <div>
                <p className="section-index">{localized("03 · Skill inventory", "03 · 技能清單")}</p>
                <h2 id="skills-heading">
                  {localized("Reusable capabilities, clearly scoped.", "可重用能力，範圍清楚。")}
                </h2>
              </div>
              <p>
                {localized(
                  "Counts come from the verified registry snapshot; the cards show a public-facing selection.",
                  "數量來自已核對的登記冊快照；下方卡片只顯示適合公開的精選項目。",
                )}
              </p>
            </div>

            <div className="skills-grid">
              <article className="skill-panel">
                <div className="panel-heading">
                  <span>{localized("Featured global / registered", "精選全域 / 已登記")}</span>
                  <strong>
                    {globalSkills.length} / {registry.sources.globalSkills.count}
                  </strong>
                </div>
                <div className="skill-cards">
                  {globalSkills.map(([name, descriptionEn, descriptionZh]) => (
                    <div className="skill-card" key={name}>
                      <span aria-hidden="true" className="skill-mark">
                        {name[0].toUpperCase()}
                      </span>
                      <div>
                        <h3>{name}</h3>
                        <p>{localized(descriptionEn, descriptionZh)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="skill-panel project-panel">
                <div className="panel-heading">
                  <span>{localized("Featured project / registered", "精選專案 / 已登記")}</span>
                  <strong>
                    {projectSkills.length} / {registry.sources.projectSkills.count}
                  </strong>
                </div>
                <div className="skill-cards project-cards">
                  {projectSkills.map(([name, descriptionEn, descriptionZh]) => (
                    <div className="skill-card" key={name}>
                      <span aria-hidden="true" className="skill-mark">
                        {name[0].toUpperCase()}
                      </span>
                      <div>
                        <h3>{name}</h3>
                        <p>{localized(descriptionEn, descriptionZh)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <ScrollScrubJourney language={language} />
        </main>

        <footer>
          <span>
            {localized(
              "Let the system hold the details, and leave the day open for wonder.",
              "讓系統接住細節，讓日子留一點空白給奇想。",
            )}
          </span>
          <span>
            {localized(
              `Asia/Hong_Kong · snapshot ${snapshotDate}`,
              `香港時間 · 快照 ${snapshotDate}`,
            )}
          </span>
        </footer>
      </div>
    </>
  );
}
