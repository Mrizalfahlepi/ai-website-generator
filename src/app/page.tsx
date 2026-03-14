"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Zap, Download, Eye, Clock } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Landing page kedai kopi modern tema gelap",
  "Portfolio fotografer galeri grid minimalis",
  "Website restoran Jepang dengan menu",
  "Toko online sepatu sneakers futuristik",
  "Blog travel dengan hero image besar",
];

const LOADING_STEPS = [
  "Menganalisis deskripsi kamu...",
  "Menyempurnakan brief website...",
  "Merancang layout & struktur...",
  "Menulis konten profesional...",
  "Membangun komponen HTML/CSS...",
  "Menambahkan interaktivitas...",
  "Optimasi responsif & performa...",
  "Finishing touches...",
];

function injectFallbackCss(html: string): string {
  const hasDarkBg = /body\s*\{[^}]*(background(-color)?\s*:\s*#[0-2][0-9a-f]{5})/i.test(html);
  if (hasDarkBg) return html;
  const fallbackStyle = '<style id="__fb">body{background-color:#0f172a;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:#93c5fd}h1,h2,h3,h4,h5,h6{color:#f8fafc}</style>';
  if (html.includes('<head>')) {
    return html.replace('<head>', '<head>' + fallbackStyle);
  }
  if (html.includes('<html')) {
    return html.replace(/<html[^>]*>/, (match) => match + '<head>' + fallbackStyle + '</head>');
  }
  return fallbackStyle + html;
}

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isGenerating) {
      setElapsed(0);
      setLoadingStep(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
        setLoadingStep((prev) => {
          const next = Math.min(prev + 1, LOADING_STEPS.length - 1);
          return next;
        });
      }, 4000);
      const fastTimer = setInterval(() => setElapsed((p) => p + 1), 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearInterval(fastTimer);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedHtml(null);
    setEnhancedPrompt(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal generate website");
      }
      const data = await res.json();
      const safeHtml = injectFallbackCss(data.html);
      setGeneratedHtml(safeHtml);
      if (data.enhancedPrompt) {
        setEnhancedPrompt(data.enhancedPrompt);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress = isGenerating ? Math.min((elapsed / 35) * 100, 95) : 0;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 to-transparent" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
            <Sparkles className="w-4 h-4" />
            Powered by AI - Mulai Rp 15.000
          </div>

          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Buat Website{" "}
            <span className="gradient-text">Dalam 10 Detik</span>
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            Ketik deskripsi website impianmu, AI langsung buatkan. Tanpa coding, tanpa ribet.
            Hasil profesional, harga warung.
          </p>

          {/* Prompt Box */}
          <div className="mt-8 glow-border rounded-2xl bg-zinc-900/80 p-2">
            <div className="flex flex-col gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ketik apapun... misal: toko baju, cafe, portfolio, dll"
                className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-transparent px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="self-end px-6 py-3 font-semibold text-white transition-all rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {EXAMPLE_PROMPTS.slice(0, 3).map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="px-3 py-1.5 text-xs rounded-full border border-zinc-700 text-zinc-400 hover:border-violet-500 hover:text-violet-300 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading Progress */}
      {isGenerating && (
        <section className="px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-violet-300">
                  {LOADING_STEPS[loadingStep]}
                </span>
                <span className="flex items-center gap-1 text-sm text-zinc-400">
                  <Clock className="w-3 h-3" />
                  {elapsed}s / ~35s
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                AI sedang membangun website-mu dari nol. Sabar ya...
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Prompt Info */}
      {enhancedPrompt && (
        <div className="max-w-2xl px-4 py-3 mx-auto mb-4 text-sm text-violet-300 border rounded-lg bg-violet-500/10 border-violet-500/20">
          <span className="font-semibold">AI menyempurnakan input kamu:</span>{" "}
          <span className="text-zinc-300">{enhancedPrompt}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-2xl px-4 py-3 mx-auto mb-8 text-red-300 border rounded-lg bg-red-500/10 border-red-500/20">
          {error}
        </div>
      )}

      {/* Preview Section */}
      {generatedHtml && (
        <section className="px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-400" />
                Preview Website
              </h2>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-emerald-600 hover:bg-emerald-500"
              >
                <Download className="w-4 h-4" />
                Download HTML
              </button>
            </div>
            <div className="preview-frame" style={{ height: "600px" }}>
              <iframe
                srcDoc={generatedHtml}
                title="Website Preview"
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      {!generatedHtml && !isGenerating && (
        <section className="px-4 pb-20">
          <div className="grid max-w-4xl gap-6 mx-auto md:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "10 Detik",
                desc: "AI generate website lengkap dalam hitungan detik",
              },
              {
                icon: Sparkles,
                title: "Rp 15.000",
                desc: "Harga mulai dari Rp 15.000 per website. Lebih murah dari template.",
              },
              {
                icon: Download,
                title: "Download & Deploy",
                desc: "Download HTML atau deploy langsung ke hosting gratis",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 glass-card rounded-xl"
              >
                <feature.icon className="w-8 h-8 mb-3 text-violet-400" />
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
