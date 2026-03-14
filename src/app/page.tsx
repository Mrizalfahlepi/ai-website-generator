"use client";

import { useState } from "react";
import { Sparkles, Zap, Download, Eye } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Landing page untuk kedai kopi modern dengan tema gelap",
  "Portfolio fotografer dengan galeri grid minimalis",
  "Website restoran Jepang dengan menu dan reservasi",
  "Toko online sepatu sneakers dengan tampilan futuristik",
  "Blog travel dengan hero image besar dan layout magazine",
];

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedHtml(null);

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
      setGeneratedHtml(data.html);
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

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_50%)]" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm rounded-full glass-card text-violet-300">
            <Sparkles className="w-4 h-4" />
            <span>Powered by AI - Mulai Rp 15.000</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight md:text-7xl">
            Buat Website
            <br />
            <span className="gradient-text">Dalam 10 Detik</span>
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-lg text-zinc-400">
            Ketik deskripsi website impianmu, AI langsung buatkan. Tanpa coding,
            tanpa ribet. Hasil profesional, harga warung.
          </p>

          {/* Prompt Box */}
          <div className="max-w-2xl mx-auto mt-10">
            <div className="glass-card glow-border rounded-2xl p-2">
              <div className="flex gap-2">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Deskripsikan website yang kamu mau..."
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
        </div>
      </section>

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
      {!generatedHtml && (
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
