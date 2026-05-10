


export class Category {
  constructor(id, name, color, priority) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.priority = priority;
  }
}

function toOptionalDate(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateKey(value) {
  const date = toOptionalDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export class Task {

  constructor(
    id="", 
    title="", 
    description="", 
    category_id="", 
    due_date=null, 
    start_time=null, 
    end_time=null, 
    recurring_days=[], 
    completed=false,
    recurrence_occurrences=[]
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.category_id = category_id;
    this.due_date = toOptionalDate(due_date);
    this.start_time = toOptionalDate(start_time);
    this.end_time = toOptionalDate(end_time);
    this.recurring_days = recurring_days;
    this.completed = completed;
    this.recurrence_occurrences = recurrence_occurrences;
  }

  short_due_date() {
    if (this.due_date === null) {
      return "";
    } else {
      return `${this.due_date.getMonth() + 1}/${this.due_date.getDate()}`;
    }
  }

  start_time_string() {
    return (this.start_time === null) ? "" : this.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  end_time_string() {
    return (this.end_time === null) ? "" : this.end_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  my_category(categories_list) {
    return categories_list.find((category) => category.id === this.category_id, this);
  }

  is_recurring() {
    return this.recurrence_occurrences.length > 0 || this.recurring_days.length > 0;
  }

}

export class Friend {
  constructor(
    id="", 
    full_name="", 
    display_name="", 
    profile_emoji="", 
    share_goals=false, 
    share_results=false, 
    share_other=false, 
    share_all=false,
    activity_summary=null
  ) {
    this.id = id;
    this.full_name = full_name;
    this.display_name = display_name;
    this.profile_emoji = profile_emoji;
    this.share_goals = share_goals;
    this.share_results = share_results;
    this.share_other = share_other;
    this.share_all = share_all;
    this.activity_summary = activity_summary;
  }

  get_card_snippet() {
    const stats = this.activity_summary;

    if (!stats) {
      return "Not sharing activity right now.";
    }

    const canSeeResults = this.share_all || this.share_results;
    const canSeeGoals = this.share_all || this.share_goals;
    const canSeeOther = this.share_all || this.share_other;

    if (canSeeResults && stats.streak_days >= 3) {
      return `On a ${stats.streak_days}-day productivity streak.`;
    }

    if (canSeeResults && stats.completed_this_week >= 10) {
      return `Crushing the week with ${stats.completed_this_week} tasks done.`;
    }

    if (canSeeResults && stats.completed_today > 0) {
      return `Finished ${stats.completed_today} ${this.task_word(stats.completed_today)} today.`;
    }

    if (canSeeGoals && stats.next_due_title) {
      return `Focused on "${stats.next_due_title}" next.`;
    }

    if (canSeeGoals && stats.upcoming_count > 0) {
      return `${stats.upcoming_count} ${this.task_word(stats.upcoming_count)} lined up.`;
    }

    if (canSeeGoals && stats.top_category) {
      return `Mostly working on ${stats.top_category} lately.`;
    }

    if (canSeeOther && stats.recently_active) {
      return "Keeping the task list moving.";
    }

    return "Keeping their plans low-key.";
  }

  task_word(count) {
    return count === 1 ? "task" : "tasks";
  }
}
