import { useState, useEffect } from "react";
import icon from '/src/logo.png'

async function baseGet(path, token) {
  const res = await fetch(`http://localhost:8000${path}`, {
    method: "GET",
    headers: {
      'Content-Type': "application/json",
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Error getting");
  return res.json();
}

//Formatting helper functions
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

//Added emojis for each highlight/criticism/insight so each slide can kinda be more uniform
//I switched away from the figma here, focusing on the last slide (animal slide) as the base template
//Highlights
const HIGHLIGHTS = {
  most_productive_week: (d) => ({
    emoji: "🗓️", label: "Most Productive Week",
    big: formatDate(d.best_week),
    sub: `${d.tasks} tasks completed`,
    caption: "Your most productive week of the semester",
  }),
  avg_tasks_per_week: (d) => ({
    emoji: "📊", label: "Weekly Average",
    big: String(d.average_tasks),
    sub: "tasks per week on average",
    caption: "Your weekly output this semester",
  }),
  total_completed: (d) => ({
    emoji: "✅", label: "Total Tasks",
    big: String(d.total_completed),
    sub: "tasks completed",
    caption: "You crushed it this semester!",
  }),
  busiest_day: (d) => ({
    emoji: "⚡", label: "Busiest Day",
    big: formatDate(d.best_day),
    sub: `${d.tasks} tasks in one day`,
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
    big: `${d.completion_rate}%`,
    sub: "of tasks completed",
    caption: "Your overall task completion rate",
  }),
  on_time_rate: (d) => ({
    emoji: "⏰", label: "On-Time Rate",
    big: `${d.on_time_rate}%`,
    sub: "submitted on time",
    caption: "How often you beat your deadlines",
  }),
  total_scheduled_time: (d) => ({
    emoji: "📅", label: "Total Time",
    big: `${d.total_minutes} minutes`,
    sub: "scheduled across all tasks",
    caption: "How long you spent in tasks",
  }),
};

//Criticisms
const CRITICISMS = {
  neglected_category: (d) => ({
    emoji: "😬", label: "Most Neglected Category",
    big: d.name,
    sub: `Only ${d.completion_rate}% completion rate`,
    caption: "This category needs some love next semester...",
  }),
  procrastination_score: (d) => ({
    emoji: "🐌", label: "Procrastination Score",
    big: `${d.avg_hours_before_deadline}h`,
    sub: "avg hours before deadline",
    caption: "You're cutting it close...",
  }),
  procrastination_category: (d) => ({
    emoji: "⏳", label: "You Procrastinate On",
    big: d.name,
    sub: `${d.avg_hours_before_deadline}h before deadline on average`,
    caption: "In before the finish line!",
  }),
};

//Insights
const INSIGHTS = {
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
        ? "You finished strong!"
        : "You started strong!",
    };
  },
  time_consuming_category: (d) => ({
    emoji: "⏱️", label: "Most Time-Consuming",
    big: d.name,
    sub: "took the most of your time",
    caption: "This category ate up your time!",
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
    caption: "You're ahead!",
  }),
};

//Animals
const ANIMALS = {
  busy_bee:                { emoji: "🐝", name: "Busy Bee",                caption: "You completed a remarkably high number of tasks." },
  calendar_cat:            { emoji: "🐱", name: "Calendar Cat",            caption: "You've scheduled hours of productivity."}, 
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

//PILL label
const PILL = {
  highlight: { modifier: "highlight", label: "Highlight" },
  criticism: { modifier: "criticism", label: "Criticism" },
  insight: { modifier: "insight", label: "Insight"   },
};

//Actual slides
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
        ? <button className="wrapped-btn" onClick={onReset}>Start over </button>
        : <button className="wrapped-btn" onClick={onNext}>Next →</button>
      }
    </div>
  );
}

function SlideAnimal({ animal, onReset }) {
  const meta = ANIMALS[animal] ?? ANIMALS.calendar_cat;
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
        Start over 
      </button>
    </div>
  );
}

//Get all data
function useWrappedData() {
  const token = localStorage.getItem('token');
  const semesterId = localStorage.getItem('semester_id')

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!semesterId || !token || semesterId === "null") return;

    async function fetchAll() {
      setLoading(true);
      try {
        const [semesterRes, highlights, criticism, insights, animalRes] = await Promise.all([
          baseGet(`/api/semesters/${semesterId}`, token),
          baseGet(`/api/wrapped/${semesterId}/highlights`, token),
          baseGet(`/api/wrapped/${semesterId}/criticism`, token),
          baseGet(`/api/wrapped/${semesterId}/insights`, token),
          baseGet(`/api/wrapped/${semesterId}/animal`, token),
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

//Build actual wrapped slides
function buildSlides(data) {
  const slides = [];

  for (const [key, val] of Object.entries(data.highlights)) {
    const highlight = HIGHLIGHTS[key];
    if (highlight) slides.push({ type: "highlight", rendered: highlight(val) });
  }

  for (const [key, val] of Object.entries(data.criticism)) {
    const criticism = CRITICISMS[key];
    if (criticism) slides.push({ type: "criticism", rendered: criticism(val) });
  }

  for (const [key, val] of Object.entries(data.insights)) {
    const insight = INSIGHTS[key];
    if (insight) slides.push({ type: "insight", rendered: insight(val) });
  }

  slides.push({ type: "animal", animal: data.animal });

  return slides;
}

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