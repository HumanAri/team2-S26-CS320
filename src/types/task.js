


export class Category {
  constructor(id, name, color, priority) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.priority = priority;
  }
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
    priority=null, 
    recurring_days=[], 
    completed=false
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.category_id = category_id;
    this.due_date = (due_date === null) ? null : new Date(due_date);
    this.start_time = (start_time === null) ? null : new Date(start_time);
    this.end_time = (end_time === null) ? null : new Date(end_time);
    this.priority = priority;
    this.recurring_days = recurring_days;
    this.completed = completed;
  }

  short_due_date() {
    if (this.due_date === null) {
      return "";
    } else {
      console.log(this.due_date)
      return `${this.due_date.getMonth() + 1}/${this.due_date.getDate()}`;
    }
  }

  start_time_string() {
    return (this.start_time === null) ? "" : this.start_time.toLocaleTimeString();
  }

  end_time_string() {
    return (this.end_time === null) ? "" : this.end_time.toLocaleTimeString();
  }

  my_category(categories_list) {
    return categories_list.find((category) => category.id === this.category_id, this);
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
    share_all=false
  ) {
    this.id = id;
    this.full_name = full_name;
    this.display_name = display_name;
    this.profile_emoji = profile_emoji;
    this.share_goals = share_goals;
    this.share_results = share_results;
    this.share_other = share_other;
    this.share_all = share_all;
  }

  get_card_snippet() {
    return "this is not implemented :(";
  }
}
