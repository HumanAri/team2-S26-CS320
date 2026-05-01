import { useState, useEffect } from "react";
import icon from '/src/logo.png'

// ── API helper ────────────────────────────────────────────────────
const BASE_URL = "http://localhost:8000"; // change to your deployed URL

async function apiFetch(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Date/time formatters ──────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function formatHour(hour) {
  if (hour == null) return "—";
  const h = parseInt(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${suffix}`;
}

// ── Highlight renderers ───────────────────────────────────────────
const HIGHLIGHT_RENDERERS = {
  most_productive_week: (d) => ({
    emoji: "🗓️", label: "Most Productive Week",
    big: formatDate(d.week_start),
    sub: `${d.tasks_completed} tasks completed`,
    caption: "Your most productive week of the semester 🔥",
  }),
  avg_tasks_per_week: (d) => ({
    emoji: "📊", label: "Weekly Average",
    big: String(d.avg_tasks_per_week),
    sub: "tasks per week on average",
    caption: "Your consistent weekly output this semester",
  }),
  total_completed: (d) => ({
    emoji: "✅", label: "Total Tasks",
    big: String(d.total_completed),
    sub: "tasks completed",
    caption: "You crushed it this semester!",
  }),
  busiest_day: (d) => ({
    emoji: "⚡", label: "Busiest Day",
    big: formatDate(d.day),
    sub: `${d.tasks_completed} tasks in one day`,
    caption: "Your single most productive day",
  }),
  longest_streak: (d) => ({
    emoji: "🔥", label: "Longest Streak",
    big: `${d.longest_streak}`,
    sub: "days in a row",
    caption: "Your longest completion streak this semester",
  }),
  peak_hour: (d) => ({
    emoji: "🕐", label: "Peak Hour",
    big: formatHour(d.hour),
    sub: `${d.completions} completions`,
    caption: "The hour you get the most done",
  }),
  best_day_of_week: (d) => ({
    emoji: "📅", label: "Best Day of Week",
    big: d.day_name?.trim(),
    sub: `${d.completions} completions`,
    caption: "Your most productive day of the week",
  }),
  completion_rate: (d) => ({
    emoji: "🎯", label: "Completion Rate",
    big: `${d.completion_rate_pct}%`,
    sub: "of tasks completed",
    caption: "Your overall task completion rate",
  }),
  on_time_rate: (d) => ({
    emoji: "⏰", label: "On-Time Rate",
    big: `${d.on_time_rate_pct}%`,
    sub: "submitted on time",
    caption: "How often you beat your deadlines",
  }),
};

// ── Criticism renderers ───────────────────────────────────────────
const CRITICISM_RENDERERS = {
  neglected_category: (d) => ({
    emoji: "😬", label: "Most Neglected Category",
    big: d.name,
    sub: `Only ${d.completion_rate}% completion rate`,
    caption: "This category needs some love next semester…",
  }),
  procrastination_score: (d) => ({
    emoji: "🐌", label: "Procrastination Score",
    big: `${d.avg_hours_before_deadline}h`,
    sub: "avg hours before deadline",
    caption: "You're cutting it close… maybe start a bit earlier?",
  }),
  procrastination_category: (d) => ({
    emoji: "⏳", label: "You Procrastinate On",
    big: d.name,
    sub: `${d.avg_hours_before_deadline}h before deadline on average`,
    caption: "This is where your last-minute energy goes",
  }),
};

// ── Insight renderers ─────────────────────────────────────────────
const INSIGHT_RENDERERS = {
  recurring_ratio: (d) => ({
    emoji: "🔁", label: "Recurring vs One-Off",
    big: `${d.recurring_pct}%`,
    sub: "of your tasks are recurring",
    caption: `${d.recurring_count} recurring · ${d.one_off_count} one-off`,
  }),
  productivity_trend: (d) => {
    const improved = d.second_half > d.first_half;
    return {
      emoji: "📈", label: "Productivity Trend",
      big: improved ? "Stronger 💪" : "Peaked Early",
      sub: improved
        ? `+${d.second_half - d.first_half} more tasks in second half`
        : `${d.first_half - d.second_half} more tasks in first half`,
      caption: improved
        ? "You finished the semester stronger than you started!"
        : "You came out of the gate strong — keep that energy up!",
    };
  },
  time_consuming_category: (d) => ({
    emoji: "⏱️", label: "Most Time-Consuming",
    big: d.name,
    sub: "took the most of your time",
    caption: "This category dominated your schedule",
  }),
  busiest_friend: (d) => ({
    emoji: "👯", label: "Busiest Friend",
    big: d.display_name,
    sub: `${d.task_count} tasks this semester`,
    caption: "Your most productive friend — keep up!",
  }),
  friend_completion_rate: (d) => ({
    emoji: "🏆", label: "Top Friend",
    big: d.display_name,
    sub: `${d.completion_rate}% completion rate`,
    caption: "Your friend with the highest completion rate",
  }),
  percentile: (d) => ({
    emoji: "🎖️", label: "Friend Percentile",
    big: `Top ${100 - d.percentile}%`,
    sub: "among your friends",
    caption: "You're ahead of most of your friends!",
  }),
};

// ── Animal metadata ───────────────────────────────────────────────
const ANIMAL_META = {
  busy_bee:                { emoji: "🐝", name: "Busy Bee",                caption: "You completed a remarkably high number of tasks." },
  calendar_cat:            {emoji:  "🐱", name: "Calendar Cat",            caption: "You've scheduled hours of productivity."}, 
  focused_fox:             { emoji: "🦊", name: "Focused Fox",             caption: "Your weekly output is remarkably consistent." },
  deadline_dragon:         { emoji: "🐉", name: "Deadline Dragon",         caption: "On-time rate ≥ 95%." },
  plan_panda:              { emoji: "🐼", name: "Plan Panda",              caption: "You plan tasks way ahead of deadlines." },
  night_owl:               { emoji: "🦉", name: "Night Owl",               caption: "Most of your tasks get done between 10 PM and 4 AM." },
  early_bird:              { emoji: "🐦", name: "Early Bird",              caption: "Most tasks completed between 5 AM and 9 AM." },
  locked_in_lobster:       { emoji: "🦞", name: "Locked In Lobster",       caption: "High task count, high completion, high on-time rate." },
  lazy_dog:                { emoji: "🐶", name: "Lazy Dog",                caption: "High late-submission rate." },
  motivated_monkey:        { emoji: "🐒", name: "Motivated Monkey",        caption: "Started slow, finished strong." },
  streak_stallion:         { emoji: "🐴", name: "Streak Stallion",         caption: "Your longest streak is seriously impressive." },
  procrastinating_penguin: { emoji: "🐧", name: "Procrastinating Penguin", caption: "Average completion within 24 hours of the deadline." },
};

// ── Pill label map ────────────────────────────────────────────────
const PILL = {
  highlight: { modifier: "highlight", label: "✨ Highlight" },
  criticism:  { modifier: "criticism",  label: "😬 Criticism" },
  insight:    { modifier: "insight",    label: "💡 Insight"   },
};

// ── Slide components ──────────────────────────────────────────────

function SlideIntro({ onNext, semesterName }) {
  return (
    <div className="wrapped-slide">
      <div className="wrapped-logo-box">
        <img src={icon} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px" }} />
      </div>
      <div className="wrapped-big-title">
        Your {semesterName}<br />Semester<br />Wrapped Is Here
      </div>
      <button className="wrapped-btn" onClick={onNext}>
        Let's check it out
      </button>
    </div>
  );
}

function LoadingSlide() {
  return (
    <div className="wrapped-loading">
      <div className="wrapped-emoji">⏳</div>
      <span>Loading your wrapped…</span>
    </div>
  );
}

function StatSlide({ type, rendered, onNext, onReset, isLast }) {
  const pill = PILL[type];
  return (
    <div className="wrapped-slide">
      <div className={`wrapped-pill wrapped-pill--${pill.modifier}`}>
        {pill.label}
      </div>
      <div className="wrapped-emoji">{rendered.emoji}</div>
      <div className="wrapped-label">{rendered.label}</div>
      <div className="wrapped-stat-number">{rendered.big}</div>
      <div className="wrapped-stat-sub">{rendered.sub}</div>
      <div className="wrapped-stat-caption">{rendered.caption}</div>
      {isLast
        ? <button className="wrapped-btn" onClick={onReset}>Start over 🔄</button>
        : <button className="wrapped-btn" onClick={onNext}>Next →</button>
      }
    </div>
  );
}

function SlideAnimal({ animal, onReset }) {
  const meta = ANIMAL_META[animal] ?? ANIMAL_META.busy_bee;
  return (
    <div className="wrapped-slide">
      <div className="wrapped-big-title">
        This semester<br />you've been a
      </div>
      <div className="wrapped-animal-circle">
        {meta.emoji}
      </div>
      <div className="wrapped-sub-title">{meta.name}</div>
      <div className="wrapped-stat-caption">{meta.caption}</div>
      <button className="wrapped-btn" onClick={onReset}>
        Start over 🔄
      </button>
    </div>
  );
}

// ── Data fetching hook ────────────────────────────────────────────
function useWrappedData(semesterId, token) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!semesterId || !token) return;

    async function fetchAll() {
      setLoading(true);
      try {
        const [semesterRes, highlights, criticism, insights, animalRes] = await Promise.all([
          apiFetch(`/api/semesters/${semesterId}`, token),
          apiFetch(`/api/wrapped/${semesterId}/highlights`, token),
          apiFetch(`/api/wrapped/${semesterId}/criticism`,  token),
          apiFetch(`/api/wrapped/${semesterId}/insights`,   token),
          apiFetch(`/api/wrapped/${semesterId}/animal`,     token),
        ]);
        setData({ semesterName: semesterRes.name, highlights, criticism, insights, animal: animalRes.animal });
      } catch (err) {
        console.error("Wrapped fetch error:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [semesterId, token]);

  return { data, loading };
}

// ── Build ordered slide list from API data ────────────────────────
function buildSlides(data) {
  const slides = [];

  for (const [key, val] of Object.entries(data.highlights)) {
    const renderer = HIGHLIGHT_RENDERERS[key];
    if (renderer) slides.push({ type: "highlight", rendered: renderer(val) });
  }

  for (const [key, val] of Object.entries(data.criticism)) {
    const renderer = CRITICISM_RENDERERS[key];
    if (renderer) slides.push({ type: "criticism", rendered: renderer(val) });
  }

  for (const [key, val] of Object.entries(data.insights)) {
    const renderer = INSIGHT_RENDERERS[key];
    if (renderer) slides.push({ type: "insight", rendered: renderer(val) });
  }

  slides.push({ type: "animal", animal: data.animal });

  return slides;
}

// ── Main App ──────────────────────────────────────────────────────
export default function SemesterWrapped({ semesterId, token }) {
  const { data, loading } = useWrappedData(semesterId, token);
  const [current, setCurrent] = useState(0);

  const next  = () => setCurrent((c) => c + 1);
  const reset = () => setCurrent(0);

  if (loading || !data) {
    return (
      <div className="wrapped-app">
        <LoadingSlide />
      </div>
    );
  }

  const slides = buildSlides(data);
  const totalSlides = 1 + slides.length;
  const isLast = current === totalSlides - 1;

  function renderCurrent() {
    if (current === 0) return <SlideIntro onNext={next} semesterName={data.semesterName}/>;

    const slide = slides[current - 1];

    if (slide.type === "animal") {
      return <SlideAnimal animal={slide.animal} onReset={reset} />;
    }

    return (
      <StatSlide
        type={slide.type}
        rendered={slide.rendered}
        onNext={next}
        onReset={reset}
        isLast={isLast}
      />
    );
  }

  return (
    <div className="wrapped-app">
      {renderCurrent()}
      <div className="wrapped-nav-dots">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`wrapped-nav-dot ${i === current ? "wrapped-nav-dot--active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}