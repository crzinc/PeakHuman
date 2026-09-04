export type GeneratedMilestone = {
  title: string
  description: string
  due_date: string
  checklist: string[]
}

export type GeneratedRoadmap = {
  title: string
  description: string
  start_date: string
  end_date: string
  milestones: GeneratedMilestone[]
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatISO(d: Date) {
  return d.toISOString().split("T")[0]
}

function detectDuration(prompt: string): number {
  const lower = prompt.toLowerCase()
  const match = lower.match(/(\d+)\s*(день|дня|дней|недел|месяц|месяца|месяцев|год|года|лет)/)
  if (match) {
    const n = parseInt(match[1], 10)
    const unit = match[2]
    if (unit.startsWith("день")) return n
    if (unit.startsWith("недел")) return n * 7
    if (unit.startsWith("месяц")) return n * 30
    if (unit.startsWith("год")) return n * 365
  }
  if (lower.includes("квартал") || lower.includes("3 месяц")) return 90
  if (lower.includes("полгода") || lower.includes("6 месяц")) return 180
  if (lower.includes("год")) return 365
  return 90
}

function detectDomain(prompt: string): string {
  const l = prompt.toLowerCase()
  if (l.match(/английск|english|язык/)) return "english"
  if (l.match(/стартап|бизнес|продукт|запустить/)) return "startup"
  if (l.match(/спорт|фитнес|трениров|похуд|мышц|бег/)) return "fitness"
  if (l.match(/код|программ|разработ|it /)) return "code"
  if (l.match(/дизайн|ux|ui/)) return "design"
  if (l.match(/книг|чтени|писател/)) return "reading"
  if (l.match(/медитац|осознан|mind/)) return "mind"
  return "generic"
}

const TEMPLATES: Record<string, { milestones: { title: string; desc: string; checklist: string[] }[] }> = {
  english: {
    milestones: [
      { title: "Фундамент — грамматика и база", desc: "Основы для уверенного старта", checklist: ["Present/Past Tenses", "100 базовых слов", "Ежедневно 20 мин Duolingo"] },
      { title: "Словарь 1000 слов", desc: "Расширение активного запаса", checklist: ["Anki 15 слов/день", "Тематические наборы", "Повторение через интервалы"] },
      { title: "Аудирование", desc: "Понимание на слух", checklist: ["Подкасты 30 мин/день", "Сериал с субтитрами", "Shadowing"] },
      { title: "Разговорная практика", desc: "Говорить без страха", checklist: ["iTalki 2x/нед", "Разговорный клуб", "Запись себя"] },
      { title: "Письмо и чтение", desc: "Грамотное выражение мыслей", checklist: ["Эссе 2x/нед", "Чтение статей", "Грамматика Advanced"] },
      { title: "Экзамен / Цель", desc: "Финальный рывок", checklist: ["Пробный тест", "Разбор ошибок", "Сертификат"] },
    ],
  },
  startup: {
    milestones: [
      { title: "Исследование и идея", desc: "Проверка гипотезы", checklist: ["20 интервью", "Анализ конкурентов", "Value proposition"] },
      { title: "MVP", desc: "Минимальный продукт", checklist: ["Дизайн", "Разработка", "Тест на друзьях"] },
      { title: "Первые пользователи", desc: "Найти 10 платящих", checklist: ["Лендинг", "Холодные письма", "Обратная связь"] },
      { title: "Продукт-маркет фит", desc: "Улучшение по метрикам", checklist: ["Retention", "NPS", "Итерация"] },
      { title: "Масштабирование", desc: "Рост", checklist: ["Маркетинг", "Найм", "Инвестиции"] },
    ],
  },
  fitness: {
    milestones: [
      { title: "Оценка и план", desc: "Точка А", checklist: ["Замеры", "Фото до", "План питания"] },
      { title: "База — дисциплина", desc: "Привычка тренироваться", checklist: ["3 тренировки/нед", "Сон 7.5ч", "Шаги 8k"] },
      { title: "Сила и выносливость", desc: "Прогрессия", checklist: ["+10% вес", "Кардио 2x", "Растяжка"] },
      { title: "Сушка / набор", desc: "Работа с телом", checklist: ["КБЖУ", "Контроль веса", "Корректировка"] },
      { title: "Финиш и удержание", desc: "Результат", checklist: ["Фото после", "Новый план", "Поддержание"] },
    ],
  },
  code: {
    milestones: [
      { title: "Основы и окружение", desc: "Подготовка", checklist: ["Язык/фреймворк", "Git", "Среда"] },
      { title: "Пет-проект", desc: "Практика", checklist: ["Идея", "Архитектура", "Код"] },
      { title: "Портфолио", desc: "Показать миру", checklist: ["GitHub", "Демо", "Документация"] },
      { title: "Собеседования", desc: "Проверка", checklist: ["Алгоритмы", "Мок-интервью", "Отклики"] },
      { title: "Работа", desc: "Старт", checklist: ["Оффер", "Онбординг", "Первые задачи"] },
    ],
  },
  design: {
    milestones: [
      { title: "Насмотренность", desc: "База", checklist: ["Behance 1ч/день", "Разбор кейсов", "Мудборд"] },
      { title: "Инструменты", desc: "Figma", checklist: ["Автолейауты", "Компоненты", "Прототипы"] },
      { title: "Пет-проекты", desc: "Практика", checklist: ["3 концепта", "Кейс-стади", "Портфолио"] },
      { title: "Клиенты", desc: "Опыт", checklist: ["Фриланс", "Отзывы", "Цена"] },
      { title: "Уровень PRO", desc: "Рост", checklist: ["Дизайн-система", "Ментор", "Конкурсы"] },
    ],
  },
  reading: {
    milestones: [
      { title: "Список 12 книг", desc: "Выбор", checklist: ["Темы", "Рекомендации", "План"] },
      { title: "Ритуал чтения", desc: "Привычка", checklist: ["30 мин/день", "Заметки", "Без телефона"] },
      { title: "Глубокое чтение", desc: "Анализ", checklist: ["Конспект", "Идеи", "Применение"] },
      { title: "Обсуждение", desc: "Закрепление", checklist: ["Клуб", "Рецензия", "Дискуссия"] },
    ],
  },
  mind: {
    milestones: [
      { title: "Осознанность 7 дней", desc: "Старт", checklist: ["Медитация 10 мин", "Дыхание", "Без оценки"] },
      { title: "Дневник", desc: "Рефлексия", checklist: ["Утро/вечер", "Благодарность", "Урок"] },
      { title: "Фокус", desc: "Глубокая работа", checklist: ["2ч без отвлечений", "Помодоро", "Цифровой детокс"] },
      { title: "Эмоции", desc: "Управление", checklist: ["Наблюдение", "Пауза", "Выбор реакции"] },
    ],
  },
  generic: {
    milestones: [
      { title: "Исследование", desc: "Понять цель", checklist: ["Зачем", "Что нужно", "Ресурсы"] },
      { title: "Планирование", desc: "Разбить на шаги", checklist: ["Декомпозиция", "Сроки", "Приоритеты"] },
      { title: "Действие — старт", desc: "Первые 30%", checklist: ["Ежедневно", "Трекинг", "Коррекция"] },
      { title: "Отслеживание", desc: "Середина пути", checklist: ["Метрики", "Обратная связь", "Улучшение"] },
      { title: "Финиш", desc: "Завершение", checklist: ["Результат", "Ретро", "Следующий шаг"] },
    ],
  },
}

export function generateRoadmapLocal(prompt: string): GeneratedRoadmap {
  const trimmed = prompt.trim()
  const title = trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed || "Мой роадмап"
  const desc = `Роадмап сгенерирован ИИ для цели: "${trimmed}". ${trimmed.length < 20 ? "Детализируй цель — получишь точнее." : ""}`.trim()
  const days = detectDuration(trimmed)
  const domain = detectDomain(trimmed)
  const template = TEMPLATES[domain] ?? TEMPLATES.generic

  const start = new Date()
  const end = addDays(start, days)

  // pick 4-6 milestones based on days
  const count = days <= 30 ? 4 : days <= 90 ? 5 : 6
  const selected = template.milestones.slice(0, count)
  // if generic and prompt short, generic 5 is fine

  const milestones: GeneratedMilestone[] = selected.map((m, i) => {
    const due = addDays(start, Math.round(((i + 1) / selected.length) * days))
    return {
      title: m.title,
      description: `${m.desc} • Чек-лист: ${m.checklist.join(", ")}`,
      due_date: formatISO(due),
      checklist: m.checklist,
    }
  })

  return {
    title,
    description: desc,
    start_date: formatISO(start),
    end_date: formatISO(end),
    milestones,
  }
}
