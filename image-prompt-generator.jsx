import { useState } from "react";

const AI_TOOLS = [
  { id: "gemini", label: "Google Gemini", color: "#4285F4", icon: "✦" },
  { id: "chatgpt", label: "ChatGPT / DALL·E", color: "#10A37F", icon: "◆" },
  { id: "claude", label: "Claude", color: "#D97757", icon: "◉" },
  { id: "copilot", label: "Microsoft Copilot", color: "#0078D4", icon: "⬡" },
  { id: "midjourney", label: "Midjourney", color: "#8B5CF6", icon: "◈" },
  { id: "stable", label: "Stable Diffusion", color: "#E11D48", icon: "◇" },
];

const STYLE_OPTIONS = [
  "사실적 사진 스타일",
  "애니메이션 / 일러스트",
  "수채화",
  "유화",
  "미니멀 디자인",
  "영화적 시네마틱",
  "인포그래픽",
  "3D 렌더링",
];

const RATIO_OPTIONS = ["16:9 (유튜브)", "9:16 (쇼츠)", "1:1 (정사각)", "4:3"];

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%", background: "#D97757",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </span>
  );
}

function PromptCard({ segment, index, total, prompts, loading, selectedTool }) {
  const [copied, setCopied] = useState(null);

  const handleCopy = (toolId, text) => {
    navigator.clipboard.writeText(text);
    setCopied(toolId);
    setTimeout(() => setCopied(null), 1800);
  };

  const toolsToShow = selectedTool === "all" ? AI_TOOLS : AI_TOOLS.filter(t => t.id === selectedTool);
  const progress = Math.round(((index + 1) / total) * 100);

  return (
    <div style={{
      background: "#1a1a2e",
      border: "1px solid #2a2a4a",
      borderRadius: 16,
      padding: "20px 24px",
      marginBottom: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Progress bar on top */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: `${progress}%`, height: 2,
        background: "linear-gradient(90deg, #D97757, #8B5CF6)",
      }} />

      {/* Scene header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
        <div style={{ flexShrink: 0 }}>
          <span style={{
            background: "linear-gradient(135deg, #D97757, #c45f3a)",
            color: "#fff", borderRadius: 8, fontSize: 11,
            fontWeight: 700, padding: "3px 10px", letterSpacing: 1,
            display: "block", textAlign: "center",
          }}>
            SCENE {index + 1}
          </span>
          <span style={{
            display: "block", textAlign: "center",
            color: "#6666aa", fontSize: 10, marginTop: 3,
          }}>
            {index + 1} / {total}
          </span>
        </div>
        <p style={{
          color: "#c8c8e0", fontSize: 13, margin: 0,
          fontStyle: "italic", flex: 1, lineHeight: 1.6,
          maxHeight: 80, overflow: "hidden",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
        }}>
          "{segment}"
        </p>
      </div>

      {loading ? (
        <div style={{ padding: "16px 0", color: "#8888aa", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <LoadingDots /> 전체 흐름 분석 중...
        </div>
      ) : prompts ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {toolsToShow.map((tool) => (
            <div key={tool.id} style={{
              background: "#0f0f1e", borderRadius: 10,
              padding: "12px 14px", border: `1px solid ${tool.color}22`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: tool.color, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
                  {tool.icon} {tool.label}
                </span>
                <button onClick={() => handleCopy(tool.id, prompts[tool.id] || "")} style={{
                  background: copied === tool.id ? tool.color : "transparent",
                  border: `1px solid ${tool.color}55`,
                  color: copied === tool.id ? "#fff" : tool.color,
                  borderRadius: 6, padding: "3px 10px",
                  fontSize: 11, cursor: "pointer", transition: "all 0.2s", fontWeight: 600,
                }}>
                  {copied === tool.id ? "✓ 복사됨" : "복사"}
                </button>
              </div>
              <p style={{
                color: "#ddddf0", fontSize: 13, margin: 0,
                lineHeight: 1.7, fontFamily: "monospace",
              }}>
                {prompts[tool.id] || "—"}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const [script, setScript] = useState("");
  const [sceneCount, setSceneCount] = useState(10);
  const [style, setStyle] = useState("사실적 사진 스타일");
  const [ratio, setRatio] = useState("16:9 (유튜브)");
  const [selectedTool, setSelectedTool] = useState("all");
  const [results, setResults] = useState([]);
  const [loadingIdx, setLoadingIdx] = useState(null);
  const [done, setDone] = useState(false);
  const [storyContext, setStoryContext] = useState("");

  // Step 1: Analyze full script to extract story context + split into N segments
  const analyzeScript = async (fullScript, n) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `You are a YouTube video production expert. Analyze a Korean script and:
1. Extract the overall story/narrative context (tone, setting, characters, color palette, visual theme)
2. Split the script into exactly ${n} segments of roughly equal length by meaning

Respond ONLY in valid JSON, no preamble, no markdown:
{
  "storyContext": "overall visual style, tone, recurring elements, color mood, setting description in English (2-3 sentences)",
  "segments": ["segment1 text", "segment2 text", ...]
}`,
        messages: [{ role: "user", content: fullScript }],
      }),
    });
    const data = await response.json();
    const text = data.content?.map(c => c.text || "").join("") || "{}";
    try {
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      // fallback: split by sentences
      const sentences = fullScript.split(/(?<=[.!?\n])\s*/).filter(s => s.trim().length > 4);
      const size = Math.ceil(sentences.length / n);
      const segments = [];
      for (let i = 0; i < n; i++) segments.push(sentences.slice(i * size, (i + 1) * size).join(" "));
      return { storyContext: "Korean YouTube video", segments: segments.filter(Boolean) };
    }
  };

  // Step 2: Generate prompts for one segment, aware of full story context + position
  const buildPromptForSegment = async (segment, index, total, context) => {
    const position = index === 0 ? "opening scene" : index === total - 1 ? "closing scene" : `scene ${index + 1} of ${total}`;

    const systemPrompt = `You are an expert image prompt creator for YouTube video production.

FULL STORY CONTEXT (maintain visual consistency across all scenes):
${context}

Style: ${style}
Aspect ratio: ${ratio}
Current position: ${position}

Your job: Create image prompts for THIS specific scene that:
- Match the scene's content precisely
- Maintain visual continuity with the overall story (same color palette, art style, setting feel)
- Show natural progression from previous scenes

Respond ONLY in valid JSON with keys: gemini, chatgpt, claude, copilot, midjourney, stable
No preamble, no markdown, no backticks. Pure JSON only.

Rules per tool:
- gemini: Natural scene description, consistent with story mood, "photorealistic" or style keyword, English
- chatgpt: DALL·E style, vivid, lighting/composition details, story-consistent, English
- claude: Subject + environment + mood, balanced, matches overall narrative, English
- copilot: Clear, safe, descriptive, scene-based, story-consistent, English
- midjourney: "--ar 16:9 --v 6", cinematic/style modifiers, consistent visual language, English
- stable: Parentheses emphasis (detailed:1.3), consistent character/setting descriptors, English

Each prompt: 1-3 sentences, specific, visual, story-consistent.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Scene content: "${segment}"` }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map(c => c.text || "").join("") || "{}";
    try {
      return JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return { gemini: text, chatgpt: text, claude: text, copilot: text, midjourney: text, stable: text };
    }
  };

  const handleGenerate = async () => {
    if (!script.trim()) return;
    setDone(false);
    setResults([]);
    setStoryContext("");
    setLoadingIdx(-1); // -1 = analyzing phase

    // Step 1: Analyze full script
    const analysis = await analyzeScript(script, sceneCount);
    const segments = analysis.segments || [];
    const context = analysis.storyContext || "";

    setStoryContext(context);
    setResults(segments.map(s => ({ segment: s, prompts: null })));

    // Step 2: Generate prompts for each segment with full context
    for (let i = 0; i < segments.length; i++) {
      setLoadingIdx(i);
      const prompts = await buildPromptForSegment(segments[i], i, segments.length, context);
      setResults(prev => {
        const next = [...prev];
        next[i] = { ...next[i], prompts };
        return next;
      });
    }

    setLoadingIdx(null);
    setDone(true);
  };

  const handleCopyAll = () => {
    const lines = results
      .filter(r => r.prompts)
      .map((r, i) => `[Scene ${i + 1}]\n${r.segment}\n\n→ ${r.prompts?.[selectedTool === "all" ? "gemini" : selectedTool] || ""}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(lines);
  };

  const isLoading = loadingIdx !== null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a16",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#eeeeff",
      padding: "0 0 60px",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #12122a 0%, #0a0a16 100%)",
        borderBottom: "1px solid #1e1e3a",
        padding: "28px 24px 22px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#D97757", fontWeight: 700, marginBottom: 8 }}>
          ▶ YOUTUBE SCRIPT → IMAGE PROMPT
        </div>
        <h1 style={{
          margin: 0, fontSize: 26, fontWeight: 800,
          background: "linear-gradient(90deg, #fff 30%, #9999cc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: -0.5,
        }}>
          이미지 프롬프트 생성기
        </h1>
        <p style={{ color: "#7777aa", fontSize: 13, marginTop: 6 }}>
          전체 스크립트 맥락을 유지하며 장면별 이미지 프롬프트 생성
        </p>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px 0" }}>

        {/* Script Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#8888bb", letterSpacing: 1, display: "block", marginBottom: 8 }}>
            📝 전체 방송 스크립트 입력
          </label>
          <textarea
            value={script}
            onChange={e => { setScript(e.target.value); setResults([]); setDone(false); setStoryContext(""); }}
            placeholder={"전체 스크립트를 그대로 붙여넣으세요.\nAI가 전체 흐름을 먼저 파악한 뒤, 장면 수에 맞게 자동 분할하고\n앞뒤 맥락이 자연스럽게 이어지는 이미지 프롬프트를 생성합니다."}
            style={{
              width: "100%", minHeight: 200,
              background: "#111128", border: "1px solid #2a2a4a",
              borderRadius: 12, padding: "14px 16px",
              color: "#ddddf5", fontSize: 14, lineHeight: 1.8,
              resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
            }}
          />
        </div>

        {/* Scene count slider */}
        <div style={{
          background: "#111128", border: "1px solid #2a2a4a",
          borderRadius: 12, padding: "16px 20px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#8888bb", letterSpacing: 1 }}>
              🎬 이미지 장면 수
            </label>
            <span style={{
              background: "linear-gradient(135deg, #D97757, #c45f3a)",
              color: "#fff", borderRadius: 20,
              padding: "2px 14px", fontSize: 14, fontWeight: 700,
            }}>
              {sceneCount}장면
            </span>
          </div>
          <input
            type="range" min={3} max={30} value={sceneCount}
            onChange={e => setSceneCount(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#D97757", cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", color: "#4a4a6a", fontSize: 11, marginTop: 4 }}>
            <span>3장면 (짧은 영상)</span>
            <span>30장면 (긴 영상)</span>
          </div>
        </div>

        {/* Options Row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#8888bb", letterSpacing: 1, display: "block", marginBottom: 6 }}>
              🎨 이미지 스타일
            </label>
            <select value={style} onChange={e => setStyle(e.target.value)} style={{
              width: "100%", background: "#111128", border: "1px solid #2a2a4a",
              borderRadius: 8, color: "#ddddf5", padding: "9px 12px", fontSize: 13, outline: "none", cursor: "pointer",
            }}>
              {STYLE_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#8888bb", letterSpacing: 1, display: "block", marginBottom: 6 }}>
              📐 화면 비율
            </label>
            <select value={ratio} onChange={e => setRatio(e.target.value)} style={{
              width: "100%", background: "#111128", border: "1px solid #2a2a4a",
              borderRadius: 8, color: "#ddddf5", padding: "9px 12px", fontSize: 13, outline: "none", cursor: "pointer",
            }}>
              {RATIO_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#8888bb", letterSpacing: 1, display: "block", marginBottom: 6 }}>
              🤖 AI 툴 필터
            </label>
            <select value={selectedTool} onChange={e => setSelectedTool(e.target.value)} style={{
              width: "100%", background: "#111128", border: "1px solid #2a2a4a",
              borderRadius: 8, color: "#ddddf5", padding: "9px 12px", fontSize: 13, outline: "none", cursor: "pointer",
            }}>
              <option value="all">전체 보기</option>
              {AI_TOOLS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button onClick={handleGenerate} disabled={!script.trim() || isLoading} style={{
          width: "100%", padding: "15px",
          background: (!script.trim() || isLoading) ? "#1a1a2e" : "linear-gradient(135deg, #D97757, #c45f3a)",
          color: (!script.trim() || isLoading) ? "#4a4a6a" : "#fff",
          border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
          cursor: (!script.trim() || isLoading) ? "not-allowed" : "pointer",
          letterSpacing: 0.5, transition: "all 0.2s", marginBottom: 28,
        }}>
          {loadingIdx === -1
            ? "🔍 전체 스크립트 분석 중..."
            : loadingIdx !== null
              ? `⏳ 프롬프트 생성 중... (${loadingIdx + 1}/${results.length})`
              : "✨ 이미지 프롬프트 생성하기"}
        </button>

        {/* Story Context Box */}
        {storyContext && (
          <div style={{
            background: "#0f1a2e", border: "1px solid #2a4a6a",
            borderRadius: 12, padding: "14px 18px", marginBottom: 24,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4285F4", letterSpacing: 1, marginBottom: 8 }}>
              🎯 전체 스토리 맥락 (모든 장면에 일관되게 적용됨)
            </div>
            <p style={{ color: "#8899bb", fontSize: 13, margin: 0, lineHeight: 1.7, fontStyle: "italic" }}>
              {storyContext}
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#8888bb", letterSpacing: 1 }}>
                총 {results.length}개 장면
              </span>
              {done && (
                <button onClick={handleCopyAll} style={{
                  background: "transparent", border: "1px solid #4a4a6a",
                  color: "#9999cc", borderRadius: 8, padding: "5px 14px",
                  fontSize: 12, cursor: "pointer",
                }}>
                  📋 전체 복사 ({selectedTool === "all" ? "Gemini" : AI_TOOLS.find(t => t.id === selectedTool)?.label})
                </button>
              )}
            </div>
            {results.map((r, i) => (
              <PromptCard
                key={i} index={i} total={results.length}
                segment={r.segment} prompts={r.prompts}
                loading={loadingIdx === i} selectedTool={selectedTool}
              />
            ))}
          </div>
        )}

        {done && (
          <div style={{ textAlign: "center", padding: "20px", color: "#6666aa", fontSize: 13 }}>
            ✅ 전체 {results.length}개 장면 프롬프트 생성 완료 — 스토리 연속성 유지됨
          </div>
        )}
      </div>
    </div>
  );
}
