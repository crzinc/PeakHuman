import { NextResponse } from "next/server"
import { generateRoadmapLocal } from "@/lib/ai/roadmap-generator"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json({ error: "prompt required" }, { status: 400 })
    }

    const groqKey = process.env.GROQ_API_KEY
    const openrouterKey = process.env.OPENROUTER_API_KEY
    const hfKey = process.env.HF_API_KEY

    let external: { title: string; description: string; start_date: string; end_date: string; milestones: { title: string; description: string; due_date: string; checklist: string[] }[] } | null = null

    async function tryGroq() {
      if (!groqKey) return null
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "Ты — генератор роадмапов. Верни JSON {title, description, duration_days, milestones: [{title, description, checklist: string[] }]}. 4-6 вех, каждая с 3 чек-поинтами. Только JSON." },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        })
        if (!res.ok) return null
        const j = await res.json()
        const parsed = JSON.parse(j.choices?.[0]?.message?.content || "{}")
        const days = parsed.duration_days ?? 90
        const start = new Date()
        const end = new Date(Date.now() + days * 86400000)
        return {
          title: parsed.title || prompt.slice(0, 60),
          description: parsed.description || `Роадмап для: ${prompt}`,
          start_date: start.toISOString().split("T")[0],
          end_date: end.toISOString().split("T")[0],
          milestones: (parsed.milestones || []).slice(0, 6).map((m: { title: string; description: string; checklist: string[] }, i: number) => ({
            title: m.title,
            description: `${m.description} • ${m.checklist?.join(", ") ?? ""}`,
            due_date: new Date(Date.now() + ((i + 1) / (parsed.milestones.length || 5)) * days * 86400000).toISOString().split("T")[0],
            checklist: m.checklist ?? [],
          })),
        }
      } catch { return null }
    }

    async function tryOpenRouter() {
      if (!openrouterKey) return null
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openrouterKey}`, "HTTP-Referer": "https://peakhuman.app", "X-Title": "PeakHuman" },
          body: JSON.stringify({
            model: "meta-llama/llama-3.1-8b-instruct:free",
            messages: [
              { role: "system", content: "Верни JSON роадмапа {title, description, duration_days, milestones:[{title, description, checklist:[]}]}, 4-6 вех." },
              { role: "user", content: prompt },
            ],
          }),
        })
        if (!res.ok) return null
        const j = await res.json()
        const parsed = JSON.parse(j.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
        if (!parsed.title) return null
        const days = parsed.duration_days ?? 90
        return {
          title: parsed.title,
          description: parsed.description,
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + days * 86400000).toISOString().split("T")[0],
          milestones: parsed.milestones?.slice(0, 6).map((m: { title: string; description: string; checklist: string[] }, i: number) => ({
            title: m.title,
            description: m.description,
            due_date: new Date(Date.now() + ((i + 1) / parsed.milestones.length) * days * 86400000).toISOString().split("T")[0],
            checklist: m.checklist ?? [],
          })) ?? [],
        }
      } catch { return null }
    }

    async function tryHuggingFace() {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (hfKey) headers.Authorization = `Bearer ${hfKey}`
        const res = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
          method: "POST",
          headers,
          body: JSON.stringify({
            inputs: `[INST] Сгенерируй роадмап JSON для цели: "${prompt}". Верни {title, description, duration_days, milestones:[{title, description, checklist:[]}] } 4-6 вех. [/INST]`,
            parameters: { max_new_tokens: 800, temperature: 0.7, return_full_text: false },
          }),
        })
        if (!res.ok) return null
        const j = await res.json()
        const text = Array.isArray(j) ? j[0]?.generated_text : j.generated_text
        if (!text) return null
        const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}")
        if (!parsed.title || !parsed.milestones) return null
        const days = parsed.duration_days ?? 90
        return {
          title: parsed.title,
          description: parsed.description,
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + days * 86400000).toISOString().split("T")[0],
          milestones: parsed.milestones.slice(0, 6).map((m: { title: string; description: string; checklist: string[] }, i: number) => ({
            title: m.title,
            description: m.description,
            due_date: new Date(Date.now() + ((i + 1) / parsed.milestones.length) * days * 86400000).toISOString().split("T")[0],
            checklist: m.checklist ?? [],
          })),
        }
      } catch { return null }
    }

    if (groqKey) external = await tryGroq()
    if (!external && openrouterKey) external = await tryOpenRouter()
    if (!external) external = await tryHuggingFace()

    const result = external ?? generateRoadmapLocal(prompt)
    return NextResponse.json({ roadmap: result, source: external ? "ai" : "local-free" })
  } catch (e) {
    return NextResponse.json({ error: "failed", details: String(e) }, { status: 500 })
  }
}
