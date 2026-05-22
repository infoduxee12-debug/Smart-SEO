/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  Type, 
  Hash, 
  ArrowRight, 
  Zap, 
  Loader2, 
  FileText, 
  Download, 
  Facebook, 
  Instagram, 
  Music, 
  Globe, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { SocialResultsData, ResearchSource } from './types';

export default function App() {
  const [script, setScript] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'tiktok'>('facebook');
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  
  // State for generated details
  const [results, setResults] = useState<SocialResultsData | null>(null);
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [usedFallback, setUsedFallback] = useState(false);
  
  // Copy state
  const [copiedType, setCopiedType] = useState<'all' | 'title' | 'tags' | null>(null);

  const getCombinedContent = () => {
    if (!results) return '';
    const current = results[activeTab];
    const tagsString = current.hashtags.join(' ');
    return `${current.title}\n\n${tagsString}`;
  };

  const handleCopyAll = async () => {
    const text = getCombinedContent();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType('all');
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const copySectionContent = async (text: string, type: 'title' | 'tags') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy section: ', err);
    }
  };

  const handleGenerate = async () => {
    if (!script.trim() || isGenerating) {
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setIsGenerated(false);
    setUsedFallback(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script: script.trim() }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to complete real-time analysis.');
      }

      const raw = json.data;
      setResults({
        facebook: {
          title: raw.facebookTitle,
          hashtags: raw.facebookHashtags || [],
        },
        instagram: {
          title: raw.instagramTitle,
          hashtags: raw.instagramHashtags || [],
        },
        tiktok: {
          title: raw.tiktokTitle,
          hashtags: raw.tiktokHashtags || [],
        }
      });
      setSources(json.sources || []);
      setUsedFallback(!!json.usedFallback);
      setIsGenerated(true);
    } catch (err: any) {
      console.error("Analysis Generation Error:", err);
      setError(err.message || 'An error occurred while connecting to the Gemini engine.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadTxt = () => {
    if (!results) return;
    const content = `=== FACEBOOK ===\nTitle: ${results.facebook.title}\nHashtags (5 total): ${results.facebook.hashtags.join(' ')}\n\n` + 
                    `=== INSTAGRAM ===\nTitle: ${results.instagram.title}\nHashtags (15 total): ${results.instagram.hashtags.join(' ')}\n\n` +
                    `=== TIKTOK ===\nTitle: ${results.tiktok.title}\nHashtags (15 total): ${results.tiktok.hashtags.join(' ')}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `viralized-script-metadata-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsDownloadOpen(false);
  };

  const handleDownloadPdf = () => {
    if (!results) return;
    const doc = new jsPDF();
    
    // PDF Header Styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 107, 0); 
    doc.text("Optimized Social Media Tags & Hook Titles", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated via Live Trend Engine: ${new Date().toLocaleString()}`, 20, 28);
    
    doc.setDrawColor(240, 240, 240);
    doc.line(20, 32, 190, 32);

    let yPos = 42;

    const platforms = [
      { name: 'FACEBOOK (5 Hashtags Optimized)', data: results.facebook },
      { name: 'INSTAGRAM REELS (15 Hashtags Optimized)', data: results.instagram },
      { name: 'TIKTOK VIRAL (15 Hashtags Optimized)', data: results.tiktok },
    ];

    platforms.forEach((platform) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(255, 107, 0);
      doc.text(platform.name, 20, yPos);
      yPos += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      const titleLines = doc.splitTextToSize(`Title: ${platform.data.title}`, 170);
      doc.text(titleLines, 20, yPos);
      yPos += (titleLines.length * 6) + 3;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const tagLines = doc.splitTextToSize(`Hashtags: ${platform.data.hashtags.join(' ')}`, 170);
      doc.text(tagLines, 20, yPos);
      yPos += (tagLines.length * 5) + 15;

      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
    });

    if (sources.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text("Sources Referenced:", 20, yPos);
      yPos += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      sources.slice(0, 5).forEach((src) => {
        const text = `${src.title}: ${src.uri}`;
        const sourceLines = doc.splitTextToSize(text, 170);
        doc.text(sourceLines, 20, yPos);
        yPos += (sourceLines.length * 4) + 2;
      });
    }

    doc.save(`optimized-script-metadata-${Date.now()}.pdf`);
    setIsDownloadOpen(false);
  };

  const activeData = useMemo(() => {
    if (!results) return null;
    return results[activeTab];
  }, [results, activeTab]);

  return (
    <div className="h-screen bg-brand-light font-sans flex flex-col md:flex-row overflow-hidden" id="app-root">
      {/* Left Side: Input Panel */}
      <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col border-r border-gray-200 h-1/2 md:h-full overflow-y-auto" id="input-pane">
        <header className="mb-6 shrink-0">
          <div className="flex items-center gap-2 text-brand-primary mb-2">
            <Zap className="w-5 h-5 fill-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Trend Grounding Optimization</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-dark leading-tight" id="main-title">
            Social Script <span className="text-brand-primary">Engine</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Analyzing live trends directly from Facebook, Instagram, and TikTok to generate optimal retention titles & exact hashtags.
          </p>
        </header>

        {/* Input Text Area Container */}
        <div className="flex-1 flex flex-col gap-4 relative min-h-0">
          <div className="flex-1 relative min-h-0">
            <textarea
              id="script-input"
              value={script}
              onChange={(e) => {
                setScript(e.target.value);
                if (!e.target.value.trim()) {
                  setIsGenerated(false);
                  setError(null);
                }
              }}
              placeholder="Paste your video or post script here to analyze live trends..."
              className="w-full h-full p-5 bg-white border-2 border-gray-100 rounded-3xl outline-none focus:border-brand-primary/30 transition-all resize-none shadow-xs text-md leading-relaxed placeholder:text-gray-300"
            />
            {script && (
              <button
                id="clear-btn"
                onClick={() => {
                  setScript('');
                  setIsGenerated(false);
                  setError(null);
                }}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-xs"
                title="Clear Script"
              >
                <div className="hover:rotate-180 transition-all duration-300">
                  <Zap className="w-3.5 h-3.5 fill-current rotate-180" />
                </div>
              </button>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pb-2 shrink-0">
            <button
              id="reload-btn"
              onClick={() => {
                window.location.reload();
              }}
              className="px-5 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-98 whitespace-nowrap text-sm"
            >
              Reload
            </button>
            <button
              id="generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating || !script.trim()}
              className="flex-1 py-3.5 bg-brand-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/95 transition-all active:scale-98 shadow-md shadow-brand-primary/10 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Meta & TikTok Live Data...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Analyze & Generate Viral Tags
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Smart Dynamic Output */}
      <div className="w-full md:w-1/2 p-6 md:p-12 bg-gray-50/50 flex flex-col relative h-1/2 md:h-full overflow-y-auto" id="output-pane">
        {/* Ambient Blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />

        <div className="w-full max-w-lg mx-auto space-y-5 my-auto py-4">
          
          {/* Error Message Notice */}
          {error && (
            <motion.div 
              id="error-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-2xl flex items-start gap-3 shadow-xs"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-800">API Execution Issue</h4>
                <p className="text-xs text-red-700/90 mt-1 leading-relaxed">
                  {error}
                </p>
                <p className="text-[10px] text-red-600 font-medium mt-1.5 opacity-80">
                  Tip: Please make sure a valid API key is bound in the Secrets environment panel.
                </p>
              </div>
            </motion.div>
          )}

          {/* Social Platform Toolbar & Download Section */}
          {isGenerated && results && (
            <div className="space-y-3" id="actions-toolkit">
              {/* Quota optimization status block removed as requested by user */}

              <div className="flex gap-2 items-center">
                <div className="flex flex-1 bg-white p-1 rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  <button
                    id="fb-tab"
                    onClick={() => setActiveTab('facebook')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'facebook' 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Facebook className="w-3.5 h-3.5" />
                    <span>Facebook (5 tags)</span>
                  </button>
                  <button
                    id="ig-tab"
                    onClick={() => setActiveTab('instagram')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'instagram' 
                        ? 'bg-pink-600 text-white shadow-xs' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram (15 tags)</span>
                  </button>
                  <button
                    id="tt-tab"
                    onClick={() => setActiveTab('tiktok')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'tiktok' 
                        ? 'bg-black text-white shadow-xs' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>TikTok (15 tags)</span>
                  </button>
                </div>

                {/* Export Dropdown Trigger */}
                <div className="relative">
                  <button
                    id="download-dropdown-btn"
                    onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                    className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs text-gray-400 hover:text-brand-primary hover:border-brand-primary/40 transition-all active:scale-95"
                    title="Export All"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {isDownloadOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsDownloadOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-44 bg-white rounded-xl border border-gray-100 shadow-lg z-50 overflow-hidden"
                          id="download-dropdown-content"
                        >
                          <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">Download All</span>
                          </div>
                          <button
                            onClick={handleDownloadTxt}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-brand-primary transition-colors text-left"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Plain Text (.txt)</span>
                          </button>
                          <button
                            onClick={handleDownloadPdf}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-brand-primary transition-colors text-left"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF Document (.pdf)</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Master Copy Trigger */}
              <button
                id="copy-all-btn"
                onClick={handleCopyAll}
                className="w-full py-3 bg-brand-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/95 transition-all active:scale-95 shadow-xs"
              >
                {copiedType === 'all' ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied Title & Tags for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy All for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </>
                )}
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {!isGenerated || !activeData ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center p-8 bg-white/60 backdrop-blur-xs rounded-3xl border border-dashed border-gray-300 w-full shadow-xs"
                id="empty-box"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  {isGenerating ? (
                    <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                  ) : (
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <h3 className="text-md font-semibold text-gray-700">
                  {isGenerating ? "Grounding Content Analysis..." : "Ready to Analyze Meta Data"}
                </h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-normal">
                  {isGenerating 
                    ? "Searching Facebook, Instagram, and TikTok to fetch live high-performance hashtag counts..." 
                    : "Paste your raw script on the left side, click 'Analyze & Generate Viral Tags', and see live data-driven results here."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 w-full"
                id="output-results"
              >
                {/* Result Card */}
                <div id="output-card" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                  
                  {/* Dynamic Title / Caption Heading */}
                  <div className="group relative" id="optimized-title-container">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Type className="w-3.5 h-3.5 text-brand-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {activeTab === 'facebook' ? 'Facebook Title & Emoji' : activeTab === 'instagram' ? 'Reels Hook Title' : 'TikTok Hook Headliner'}
                        </span>
                      </div>
                      <button
                        onClick={() => copySectionContent(activeData.title, 'title')}
                        className="text-gray-400 hover:text-brand-primary transition-colors p-1"
                        title="Copy headline only"
                      >
                        {copiedType === 'title' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 font-bold text-md text-brand-dark hover:bg-gray-100/50 transition-colors">
                      {activeData.title}
                    </div>
                  </div>

                  {/* Aesthetic Visual Divider with Tag Stats */}
                  <div className="flex items-center justify-between py-1 px-1">
                    <div className="flex-1 h-[1px] bg-linear-to-r from-gray-100 via-gray-200 to-transparent" />
                    <span className="text-[8px] tracking-widest text-gray-400 font-bold px-3 uppercase bg-white select-none">
                      {activeData.hashtags.length} Optimized Tags Generated
                    </span>
                    <div className="flex-1 h-[1px] bg-linear-to-l from-gray-100 via-gray-200 to-transparent" />
                  </div>

                  {/* Hashtags Section */}
                  <div className="group relative" id="optimized-tags-container">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Hash className="w-3.5 h-3.5 text-brand-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {activeTab === 'facebook' ? 'Targeted FB Tags (Strictly 5)' : activeTab === 'instagram' ? 'Viral IG Tags (Strictly 15)' : 'Viral TikTok Tags (Strictly 15)'}
                        </span>
                      </div>
                      <button
                        onClick={() => copySectionContent(activeData.hashtags.join(' '), 'tags')}
                        className="text-gray-400 hover:text-brand-primary transition-colors p-1"
                        title="Copy hashtags string"
                      >
                        {copiedType === 'tags' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100/50 transition-colors">
                      <div className="flex flex-wrap gap-1.5 font-mono text-xs leading-relaxed text-brand-primary font-medium">
                        {activeData.hashtags.map((tag, idx) => (
                          <span 
                            key={idx} 
                            className="bg-orange-50/70 border border-orange-100/40 text-brand-primary px-2 py-0.5 rounded-lg select-all hover:bg-orange-100/50 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Grounding Citations Panel */}
                {sources.length > 0 && (
                  <div 
                    id="citations-panel" 
                    className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-gray-500 border-b border-gray-50 pb-2">
                      <Globe className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Grounded Research Sources Verified
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-gray-400 leading-normal">
                      Gemini cross-referenced the following live platforms & pages during this request to verify current virality metrics:
                    </p>

                    <div className="space-y-2 mt-1">
                      {sources.slice(0, 5).map((source, index) => (
                        <a 
                          key={index} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-between text-[11px] text-gray-600 hover:text-brand-primary bg-gray-50 hover:bg-orange-50/50 p-2.5 rounded-xl border border-gray-100 transition-colors group"
                        >
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <span className="text-[10px] font-mono text-gray-400 w-3 shrink-0">{(index + 1)}.</span>
                            <span className="font-bold truncate text-gray-700 group-hover:text-brand-primary">{source.title}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 group-hover:text-brand-primary shrink-0 font-medium">
                            <span>Visit</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
