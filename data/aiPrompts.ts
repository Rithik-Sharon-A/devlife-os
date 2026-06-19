import type { DailyContext, DayScore, MealType, Task } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AIPrompt {
  systemPrompt: string;
  userMessage: string;
}

// ─── Shared rules ─────────────────────────────────────────────────────────────

const COACH_PERSONA = `You are cAI, a personal daily operating coach for Indian users.
Tone: warm, direct, and specific — never generic or preachy.
Rules:
- Always use the user's actual name.
- Always cite real numbers from the context (calories, bottles, tasks, minutes, scores).
- Never invent data that is not in the context.
- Keep responses under 150 words unless asked for a list or multi-day analysis.
- Do not use markdown unless explicitly asked.`;

const GOAL_GUIDANCE: Record<
  DailyContext["profile"]["goalType"],
  string
> = {
  weight_loss: "Prioritize high-protein, moderate portions, lower refined carbs.",
  weight_gain: "Prioritize calorie-dense meals with adequate protein and healthy fats.",
  maintain: "Balance protein, carbs, and fats within the daily calorie target.",
};

// ─── Context builder ──────────────────────────────────────────────────────────

function formatMeals(context: DailyContext): string {
  if (context.food.entries.length === 0) return "No meals logged yet.";

  const byMeal: Record<string, string[]> = {};
  for (const entry of context.food.entries) {
    const line = `${entry.foodItem.name} ×${entry.quantity} (${entry.calories} kcal, P${entry.foodItem.protein}g C${entry.foodItem.carbs}g F${entry.foodItem.fat}g)`;
    const key = entry.mealType;
    if (!byMeal[key]) byMeal[key] = [];
    byMeal[key].push(line);
  }

  return Object.entries(byMeal)
    .map(([meal, items]) => `  ${meal}: ${items.join("; ")}`)
    .join("\n");
}

function formatOptionalSection(label: string, lines: string[]): string {
  if (lines.length === 0) return "";
  return `\n${label}:\n${lines.map((l) => `  ${l}`).join("\n")}`;
}

export function buildDayContext(context: DailyContext): string {
  const { profile, date, timeOfDay, food, water, tasks, habits, focus, dayScore } =
    context;

  const caloriesRemaining = Math.max(
    0,
    profile.dailyCalorieGoal - food.totalCalories
  );
  const waterRemaining = Math.max(0, water.goalBottles - water.bottlesConsumed);
  const tasksRemaining = Math.max(0, tasks.total - tasks.completed);
  const habitsRemaining = Math.max(0, habits.total - habits.completed);

  const optionalLines: string[] = [];

  if (context.sleep) {
    optionalLines.push(
      `Sleep: ${context.sleep.durationHours}h (${context.sleep.bedTime} → ${context.sleep.wakeTime}), quality ${context.sleep.qualityRating}/5`
    );
  }
  if (context.workout) {
    optionalLines.push(
      `Workout: ${context.workout.exerciseType}, ${context.workout.durationMinutes} min, ${context.workout.intensityLevel}, ${context.workout.caloriesBurned} kcal burned`
    );
  }
  if (context.mood) {
    const parts: string[] = [];
    if (context.mood.morningMood !== undefined)
      parts.push(`morning mood ${context.mood.morningMood}/5`);
    if (context.mood.eveningMood !== undefined)
      parts.push(`evening mood ${context.mood.eveningMood}/5`);
    if (context.mood.stressLevel !== undefined)
      parts.push(`stress ${context.mood.stressLevel}/10`);
    if (parts.length > 0) optionalLines.push(`Mood: ${parts.join(", ")}`);
  }
  if (context.steps) {
    optionalLines.push(
      `Steps: ${context.steps.steps.toLocaleString()} / ${context.steps.goalSteps.toLocaleString()} goal`
    );
  }
  if (context.weight) {
    optionalLines.push(`Weight: ${context.weight.weightKg} kg`);
  }

  return [
    `=== cAI Daily Context ===`,
    `Date: ${date}`,
    `Time of day: ${timeOfDay}`,
    ``,
    `--- User ---`,
    `Name: ${profile.name}`,
    `Age: ${profile.age} | Gender: ${profile.gender}`,
    `Height: ${profile.heightCm} cm | Weight: ${profile.weightKg} kg | Goal weight: ${profile.goalWeightKg} kg`,
    `Goal: ${profile.goalType.replace("_", " ")} | Activity: ${profile.activityLevel.replace("_", " ")}`,
    `TDEE: ${profile.tdee} kcal | Daily calorie target: ${profile.dailyCalorieGoal} kcal`,
    `Nutrition guidance: ${GOAL_GUIDANCE[profile.goalType]}`,
    ``,
    `--- Day score ---`,
    `Overall: ${dayScore.overall}%`,
    `Tasks: ${dayScore.tasksPercent}% | Calories: ${dayScore.caloriesPercent}% | Water: ${dayScore.waterPercent}% | Habits: ${dayScore.habitsPercent}%`,
    ``,
    `--- Food (${food.date}) ---`,
    `Logged: ${food.totalCalories} kcal (P${food.totalProtein}g C${food.totalCarbs}g F${food.totalFat}g)`,
    `Remaining budget: ${caloriesRemaining} kcal`,
    `Meals:`,
    formatMeals(context),
    ``,
    `--- Water ---`,
    `Consumed: ${water.bottlesConsumed} / ${water.goalBottles} bottles (${water.mlConsumed} ml)`,
    `Remaining: ${waterRemaining} bottle(s)`,
    ``,
    `--- Tasks ---`,
    `Completed: ${tasks.completed} / ${tasks.total} | Remaining: ${tasksRemaining}`,
    `MIT done today: ${tasks.mitCompleted ? "yes" : "no"}`,
    ``,
    `--- Habits ---`,
    `Completed: ${habits.completed} / ${habits.total} | Remaining: ${habitsRemaining}`,
    habits.list.length > 0
      ? `Active habits: ${habits.list.join(", ")}`
      : `Active habits: none logged`,
    ``,
    `--- Focus ---`,
    `Sessions completed: ${focus.sessionsCompleted}`,
    `Focus minutes today: ${focus.totalMinutes}`,
    formatOptionalSection("--- Optional health data ---", optionalLines),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildWeeklySummary(weekData: DailyContext[]): string {
  if (weekData.length === 0) return "No weekly data provided.";

  return weekData
    .map((day) => {
      const name = day.profile.name;
      return [
        `${day.date} (${day.timeOfDay}) — ${name}`,
        `  Score: ${day.dayScore.overall}% (T${day.dayScore.tasksPercent}% C${day.dayScore.caloriesPercent}% W${day.dayScore.waterPercent}% H${day.dayScore.habitsPercent}%)`,
        `  Food: ${day.food.totalCalories}/${day.profile.dailyCalorieGoal} kcal`,
        `  Water: ${day.water.bottlesConsumed}/${day.water.goalBottles} bottles`,
        `  Tasks: ${day.tasks.completed}/${day.tasks.total} | MIT: ${day.tasks.mitCompleted ? "yes" : "no"}`,
        `  Habits: ${day.habits.completed}/${day.habits.total}`,
        `  Focus: ${day.focus.sessionsCompleted} sessions, ${day.focus.totalMinutes} min`,
        day.steps
          ? `  Steps: ${day.steps.steps}/${day.steps.goalSteps}`
          : null,
        day.sleep ? `  Sleep: ${day.sleep.durationHours}h` : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function baseSystemPrompt(context: DailyContext, extraRules?: string): string {
  return [COACH_PERSONA, extraRules, buildDayContext(context)]
    .filter(Boolean)
    .join("\n\n");
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function morningNudgePrompt(context: DailyContext): AIPrompt {
  const { profile, dayScore, tasks, water, food } = context;
  const caloriesRemaining = profile.dailyCalorieGoal - food.totalCalories;

  return {
    systemPrompt: baseSystemPrompt(
      context,
      `Task: Write ONE motivating coaching sentence for ${profile.name}'s morning.
Reference yesterday/overall score (${dayScore.overall}%), today's calorie target (${profile.dailyCalorieGoal} kcal), water goal (${water.goalBottles} bottles), and open tasks (${tasks.total - tasks.completed} remaining).
Be specific with numbers. No bullet points. No greeting fluff.`
    ),
    userMessage: `${profile.name}, it's ${context.timeOfDay} on ${context.date}. Yesterday's overall score was ${dayScore.overall}%. Today: ${profile.dailyCalorieGoal} kcal budget (${caloriesRemaining > 0 ? `${caloriesRemaining} kcal still available from prior logging` : `${food.totalCalories} kcal already logged`}), ${water.goalBottles} bottle water goal, ${tasks.total} tasks (${tasks.completed} done). Give me one specific motivating sentence to start the day.`,
  };
}

export function mealSuggestionPrompt(
  context: DailyContext,
  caloriesRemaining: number,
  mealType: MealType
): AIPrompt {
  const { profile, food } = context;
  const eatenSummary =
    food.entries.length > 0
      ? food.entries.map((e) => `${e.foodItem.name} (${e.calories} kcal)`).join(", ")
      : "nothing yet";

  return {
    systemPrompt: baseSystemPrompt(
      context,
      `Task: Suggest exactly 3 specific Indian ${mealType} options for ${profile.name}.
Each suggestion must include: dish name, realistic portion, and estimated calories.
Total per suggestion must fit within ${caloriesRemaining} kcal remaining.
Goal type: ${profile.goalType} — ${GOAL_GUIDANCE[profile.goalType]}
Prefer common South/North Indian home or tiffin foods.
Format as a numbered list (3 items). Under 150 words total.`
    ),
    userMessage: `${profile.name} wants ${mealType} ideas. Already eaten today (${food.totalCalories} kcal): ${eatenSummary}. Remaining budget: ${caloriesRemaining} kcal. Daily target: ${profile.dailyCalorieGoal} kcal. Goal: ${profile.goalType}. Give 3 Indian meals with portions and calories that fit the budget.`,
  };
}

export function focusCoachPrompt(
  context: DailyContext,
  selectedTask: Task
): AIPrompt {
  const { profile, focus, tasks, timeOfDay } = context;

  return {
    systemPrompt: baseSystemPrompt(
      context,
      `Task: Give short, energizing focus-session advice for ${profile.name}.
Reference the selected task, time of day (${timeOfDay}), tasks done (${tasks.completed}/${tasks.total}), and focus sessions today (${focus.sessionsCompleted}, ${focus.totalMinutes} min).
2–3 sentences max. Actionable and specific.`
    ),
    userMessage: `${profile.name} is starting a focus block on: "${selectedTask.title}"${selectedTask.isMIT ? " (MIT)" : ""}. Time: ${timeOfDay}. Tasks done: ${tasks.completed}/${tasks.total}. Focus so far: ${focus.sessionsCompleted} sessions, ${focus.totalMinutes} minutes. How should I approach this session right now?`,
  };
}

export function waterNudgePrompt(context: DailyContext): AIPrompt {
  const { profile, water } = context;
  const behind = water.bottlesConsumed < water.goalBottles;
  const bottlesLeft = water.goalBottles - water.bottlesConsumed;

  return {
    systemPrompt: baseSystemPrompt(
      context,
      `Task: Nudge ${profile.name} about hydration after 2pm.
They have drunk ${water.bottlesConsumed} of ${water.goalBottles} bottles (${water.mlConsumed} ml).
${behind ? `They are ${bottlesLeft} bottle(s) behind goal.` : "They are on track but still need encouragement."}
One or two sentences. Personal, mention exact bottle counts. No generic "stay hydrated" advice.`
    ),
    userMessage: `${profile.name}, it's ${context.timeOfDay} and I've had ${water.bottlesConsumed} of ${water.goalBottles} bottles (${water.mlConsumed} ml). Goal is ${water.goalBottles} bottles. Give me a direct, personal nudge — not generic.`,
  };
}

export function daySummaryPrompt(context: DailyContext): AIPrompt {
  const { profile, dayScore, food, water, tasks, habits, focus } = context;

  return {
    systemPrompt: baseSystemPrompt(
      context,
      `Task: Evening reflection for ${profile.name}.
Summarize what went well and one improvement area using today's numbers.
Max 4 sentences. Warm coach tone. Cite score (${dayScore.overall}%), food (${food.totalCalories}/${profile.dailyCalorieGoal} kcal), water (${water.bottlesConsumed}/${water.goalBottles}), tasks (${tasks.completed}/${tasks.total}), habits (${habits.completed}/${habits.total}), focus (${focus.totalMinutes} min).`
    ),
    userMessage: `${profile.name}, end of day check-in for ${context.date}. Overall score: ${dayScore.overall}%. Food: ${food.totalCalories}/${profile.dailyCalorieGoal} kcal. Water: ${water.bottlesConsumed}/${water.goalBottles} bottles. Tasks: ${tasks.completed}/${tasks.total}. Habits: ${habits.completed}/${habits.total}. Focus: ${focus.totalMinutes} min. What went well and what should I improve tomorrow?`,
  };
}

export function foodEstimatePrompt(
  foodDescription: string,
  portionDescription: string
): AIPrompt {
  return {
    systemPrompt: `You estimate nutrition for Indian foods using ICMR/INDB-style values.
Return ONLY valid JSON with no markdown, no code fences, no explanation.
Schema: {"calories":number,"protein":number,"carbs":number,"fat":number,"confidence":"high"|"medium"|"low"}
All macro values are grams except calories (kcal).
Base estimates on the described portion, not per 100g unless portion says so.`,
    userMessage: `Estimate nutrition for: ${foodDescription}. Portion: ${portionDescription}. Return JSON only.`,
  };
}

export function chatPrompt(
  context: DailyContext,
  userMessage: string
): AIPrompt {
  const { profile } = context;

  return {
    systemPrompt: baseSystemPrompt(
      context,
      `You are ${profile.name}'s personal cAI coach — not a generic assistant.
Answer using their full daily context above.
Be warm, direct, and specific with their real numbers.
If they ask about food, tasks, water, habits, or focus, tie advice to today's logged data.`
    ),
    userMessage,
  };
}

export function weeklyInsightPrompt(weekData: DailyContext[]): AIPrompt {
  const name = weekData[0]?.profile.name ?? "User";
  const avgScore =
    weekData.length > 0
      ? Math.round(
          weekData.reduce((sum, d) => sum + d.dayScore.overall, 0) / weekData.length
        )
      : 0;

  const avgCalories =
    weekData.length > 0
      ? Math.round(
          weekData.reduce((sum, d) => sum + d.food.totalCalories, 0) /
            weekData.length
        )
      : 0;

  const avgWater =
    weekData.length > 0
      ? (
          weekData.reduce((sum, d) => sum + d.water.bottlesConsumed, 0) /
          weekData.length
        ).toFixed(1)
      : "0";

  return {
    systemPrompt: `${COACH_PERSONA}

Task: Analyze ${name}'s last ${weekData.length} days and return exactly 3 personal insights about patterns.
Each insight must cite specific numbers or trends from the data (scores, calories, water, tasks, habits, focus, sleep, steps).
Format as a numbered list (3 items). Warm but direct. Under 150 words unless the list needs it.`,
    userMessage: `Weekly data for ${name} (${weekData.length} days). Average score: ${avgScore}%. Average calories: ${avgCalories} kcal/day. Average water: ${avgWater} bottles/day.

${buildWeeklySummary(weekData)}

Give me 3 specific personal insights about my patterns this week.`,
  };
}

/** Builds a compact score-only snippet for cross-day prompts (e.g. morning vs yesterday). */
export function formatDayScore(score: DayScore): string {
  return `overall ${score.overall}% (tasks ${score.tasksPercent}%, calories ${score.caloriesPercent}%, water ${score.waterPercent}%, habits ${score.habitsPercent}%)`;
}
