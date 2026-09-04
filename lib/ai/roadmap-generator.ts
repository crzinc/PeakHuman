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
function formatISO(d: Date) { return d.toISOString().split("T")[0] }

function detectDuration(prompt: string): number {
  const lower = prompt.toLowerCase()
  const m = lower.match(/(\d+)\s*(день|дня|дней|недел|месяц|месяца|месяцев|год|года|лет)/)
  if (m) {
    const n = parseInt(m[1], 10)
    const u = m[2]
    if (u.startsWith("день")) return n
    if (u.startsWith("недел")) return n * 7
    if (u.startsWith("месяц")) return n * 30
    if (u.startsWith("год")) return n * 365
  }
  if (lower.includes("квартал") || lower.includes("3 месяц")) return 90
  if (lower.includes("полгода") || lower.includes("6 месяц")) return 180
  if (lower.includes("год")) return 365
  return 90
}

function detectDomain(prompt: string): string {
  const l = prompt.toLowerCase()
  if (l.match(/английск|english|язык|b2|ielts/)) return "english"
  if (l.match(/прибыль|доход|заработ|выруч|продаж|клиент|монетизац/)) return "profit"
  if (l.match(/стартап|бизнес|продукт|запустить|saas|мвп|идея/)) return "startup"
  if (l.match(/спорт|фитнес|трениров|похуд|мышц|бег|здоров/)) return "fitness"
  if (l.match(/код|программ|разработ|it |frontend|backend|python|js |react/)) return "code"
  if (l.match(/дизайн|ux|ui|figma/)) return "design"
  if (l.match(/книг|чтени|писател/)) return "reading"
  if (l.match(/медитац|осознан|mind|тревог|стресс/)) return "mind"
  if (l.match(/блог|контент|youtube|tiktok|инст/)) return "content"
  if (l.match(/деньг|финанс|инвест|эконом|капитал/)) return "finance"
  return "generic"
}

// Domain templates with richer, more specific milestones
const TEMPLATES: Record<string, { base: string; milestones: { title: string; desc: string; checklist: string[] }[] }> = {
  english: {
    base: "Английский",
    milestones: [
      { title: "Диагностика и база", desc: "Определить уровень, закрыть пробелы A2", checklist: ["Тест уровня", "100 базовых слов", "Present Simple/Past"] },
      { title: "Словарь 800 → 1500", desc: "Активный запас", checklist: ["Anki 20/день", "Тема: работа/путешествия", "Интервальное повторение"] },
      { title: "Аудирование ежедневно", desc: "Понимать речь", checklist: ["Подкаст 30 мин", "Сериал без субтитров 2 эп", "Shadowing"] },
      { title: "Говорение 3×/нед", desc: "Снять барьер", checklist: ["iTalki/Cambly", "Разговорный клуб", "Запись монолога"] },
      { title: "Письмо и грамматика B2", desc: "Сложные конструкции", checklist: ["Эссе 2×/нед", "Conditionals", "Обратная связь"] },
      { title: "Финальный тест B2", desc: "Подтвердить уровень", checklist: ["Пробный IELTS", "Разбор ошибок", "Сертификат"] },
    ],
  },
  startup: {
    base: "Стартап",
    milestones: [
      { title: "Проблема и интервью", desc: "20 проблемных интервью", checklist: ["Список гипотез", "20 звонков", "Карта болей"] },
      { title: "Прототип за неделю", desc: "Кликабельный MVP", checklist: ["Figma", "Лендинг", "5 тестов"] },
      { title: "Первые 10 платящих", desc: "Продажи", checklist: ["Холодные письма 50", "Демо", "Оплата"] },
      { title: "Метрики и удержание", desc: "Найти PMF", checklist: ["Retention 30%", "NPS", "Итерация"] },
      { title: "Каналы роста", desc: "Масштаб", checklist: ["Контент", "Партнёрства", "Реклама"] },
    ],
  },
  fitness: {
    base: "Форма",
    milestones: [
      { title: "Замеры и план", desc: "Точка А", checklist: ["Вес/замеры", "Фото до", "КБЖУ"] },
      { title: "Дисциплина 21 день", desc: "Привычка", checklist: ["3 тренировки/нед", "Сон 7.5ч", "Шаги 10k"] },
      { title: "Прогрессия силы", desc: "Тонус", checklist: ["+10% веса", "Кардио 2×", "Мобильность"] },
      { title: "Тело мечты — фаза 2", desc: "Коррекция", checklist: ["План питания", "Контроль", "Читмил"] },
      { title: "Удержание", desc: "Результат навсегда", checklist: ["Фото после", "Поддержка", "Новый вызов"] },
    ],
  },
  code: {
    base: "Код",
    milestones: [
      { title: "База и тулзы", desc: "Фундамент", checklist: ["Язык", "Git", "Среда"] },
      { title: "Пет-проект 1", desc: "Практика", checklist: ["Идея", "Архитектура", "Деплой"] },
      { title: "Портфолио и GitHub", desc: "Видимость", checklist: ["3 проекта", "README", "Демо"] },
      { title: "Алгоритмы + собесы", desc: "Проверка", checklist: ["LeetCode 50", "Моки", "Отклики"] },
      { title: "Оффер", desc: "Старт", checklist: ["Собеседования", "Оффер", "Онбординг"] },
    ],
  },
  design: {
    base: "Дизайн",
    milestones: [
      { title: "Насмотренность 14д", desc: "База", checklist: ["Behance 1ч", "Анализ 20 кейсов", "Мудборд"] },
      { title: "Figma PRO", desc: "Инструмент", checklist: ["Auto-layout", "Компоненты", "Прототип"] },
      { title: "3 кейса", desc: "Практика", checklist: ["Концепт 1", "Концепт 2", "Кейс-стади"] },
      { title: "Первые клиенты", desc: "Опыт", checklist: ["Биржа", "Отзывы", "Прайс"] },
      { title: "Уровень Middle", desc: "Рост", checklist: ["Система", "Ментор", "Конкурс"] },
    ],
  },
  content: {
    base: "Контент",
    milestones: [
      { title: "Позиционирование", desc: "Кто ты", checklist: ["Тема", "Аватар ЦА", "УТП"] },
      { title: "Контент-план 30д", desc: "Система", checklist: ["30 идей", "Рубрики", "Календарь"] },
      { title: "Съёмка и монтаж", desc: "Поток", checklist: ["Оборудование", "Шаблоны", "7 видео"] },
      { title: "Продвижение", desc: "Охват", checklist: ["Хештеги", "Коллабы", "Аналитика"] },
      { title: "Монетизация", desc: "Деньги", checklist: ["Продукт", "Воронка", "Продажи"] },
    ],
  },
  profit: {
    base: "Прибыль",
    milestones: [
      { title: "Ниша и оффер", desc: "Что продаём и кому", checklist: ["Выбрать нишу", "Сформулировать оффер", "Проверить спрос"] },
      { title: "Продукт за 7 дней", desc: "Минимальная версия", checklist: ["Сделать MVP", "Лендинг", "Оплата"] },
      { title: "Первые клиенты", desc: "До первой оплаты", checklist: ["20 холодных контактов", "3 демо", "1 оплата"] },
      { title: "Выручка и юнит-экономика", desc: "Понять цифры", checklist: ["Себестоимость", "Цена", "Маржа"] },
      { title: "Масштаб до прибыли", desc: "Повторить и усилить", checklist: ["Канал продаж", "Автоматизация", "Цель 3 мес"] },
    ],
  },
  finance: {
    base: "Финансы",
    milestones: [
      { title: "Аудит", desc: "Где деньги", checklist: ["Доходы/расходы", "Долги", "Подушка"] },
      { title: "Бюджет", desc: "Контроль", checklist: ["Правило 50/30/20", "Приложения", "Лимиты"] },
      { title: "Накопления", desc: "Подушка 3 мес", checklist: ["Автоперевод", "Цель", "Отчёт"] },
      { title: "Инвестиции старт", desc: "Приумножение", checklist: ["Брокер", "ETF", "Стратегия"] },
      { title: "Пассивный доход", desc: "Свобода", checklist: ["Дивиденды", "Реинвест", "План"] },
    ],
  },
  generic: {
    base: "Цель",
    milestones: [
      { title: "Кристаллизация цели", desc: "Что именно и зачем", checklist: ["Формулировка SMART", "Критерии успеха", "Дедлайн"] },
      { title: "План и ресурсы", desc: "Карта пути", checklist: ["Декомпозиция", "Ресурсы/люди", "Риски"] },
      { title: "Старт — первые 30%", desc: "Импульс", checklist: ["Ежедневные действия", "Трекинг", "Быстрые победы"] },
      { title: "Середина — углубление", desc: "Коррекция курса", checklist: ["Метрики", "Обратная связь", "Улучшения"] },
      { title: "Финиш и закрепление", desc: "Результат", checklist: ["Демо/показ", "Ретро", "Следующий уровень"] },
    ],
  },
}

function makeSpecificGeneric(prompt: string, baseMilestones: { title: string; desc: string; checklist: string[] }[]) {
  const key = prompt.split(/[\s,]+/).filter(w => w.length > 2).slice(0, 3).join(" ")
  const short = prompt.slice(0, 40).trim()
  return baseMilestones.map(m => ({
    ...m,
    title: `${short} — ${m.title}`,
    desc: `${m.desc} • Контекст: ${key || short}`,
  }))
}

export function generateRoadmapLocal(prompt: string): GeneratedRoadmap {
  const trimmed = prompt.trim()
  const isShort = trimmed.length < 12
  const title = isShort ? (trimmed ? `Роадмап: ${trimmed}` : "Мой роадмап") : trimmed.length > 64 ? trimmed.slice(0, 64) + "…" : trimmed
  const days = detectDuration(trimmed)
  const domain = detectDomain(trimmed)
  let template = TEMPLATES[domain] ?? TEMPLATES.generic

  // Always make generic more specific, even for short prompts
  if (domain === "generic") {
    template = { ...template, milestones: makeSpecificGeneric(trimmed || "Цель", template.milestones) }
  }

  const start = new Date()
  // Add small random jitter to make dates feel more human (±2 days)
  const end = addDays(start, days)
  const count = days <= 30 ? 4 : days <= 90 ? 5 : 6
  const selected = template.milestones.slice(0, count)

  const milestones: GeneratedMilestone[] = selected.map((m, i) => {
    const due = addDays(start, Math.round(((i + 1) / selected.length) * days))
    // Add description with prompt context if not already
    const desc = m.desc.includes("Чек-лист") ? m.desc : `${m.desc} • Чек-лист: ${m.checklist.join(", ")}`
    return {
      title: m.title,
      description: desc,
      due_date: formatISO(due),
      checklist: m.checklist,
    }
  })

  const desc = `ИИ-роадмап для: "${trimmed}". ${domain !== "generic" ? `Домен: ${TEMPLATES[domain].base}.` : ""} ${days} дней • ${count} вех • каждая с чек-листом и датой. Отредактируй вехи после создания.`.trim()

  return {
    title,
    description: desc,
    start_date: formatISO(start),
    end_date: formatISO(end),
    milestones,
  }
}
