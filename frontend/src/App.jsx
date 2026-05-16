import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

export default function App() {
  const [prData, setPrData] = useState(null)
  const [selectedFinding, setSelectedFinding] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isAnimated, setIsAnimated] = useState(false)
  const [prUrl, setPrUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState(null)
  const [recentPRs, setRecentPRs] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    setIsAnimated(true)
    // Load recent PRs from localStorage
    const stored = localStorage.getItem('recentPRs')
    if (stored) {
      setRecentPRs(JSON.parse(stored))
    }
  }, [])

  // Save to recent PRs
  const addToRecentPRs = (pr) => {
    const newRecent = [
      { url: pr.title, prUrl: prUrl, timestamp: new Date().toISOString(), score: pr.qualityScore },
      ...recentPRs.filter(p => p.prUrl !== prUrl)
    ].slice(0, 10)
    setRecentPRs(newRecent)
    localStorage.setItem('recentPRs', JSON.stringify(newRecent))
  }

  const analyzePR = async () => {
    if (!prUrl.trim()) {
      setError('Please enter a GitHub PR URL')
      return
    }

    setLoading(true)
    setError(null)
    setPrData(null)
    setSelectedFinding(null)

    try {
      // Step 1: Fetching PR
      setLoadingStep('Fetching PR from GitHub...')
      await new Promise(resolve => setTimeout(resolve, 500))

      const response = await fetch(`${API_URL}/analyze-pr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prUrl }),
      })

      // Step 2: Analyzing
      setLoadingStep('Analyzing code with AI...')
      
      const result = await response.json()

      if (!response.ok) {
        // Better error messages
        let errorMessage = result.error || 'Analysis failed'
        if (errorMessage.includes('not found')) {
          errorMessage = '❌ PR not found. Please check the URL and ensure you have access to the repository.'
        } else if (errorMessage.includes('authentication')) {
          errorMessage = '🔐 GitHub authentication failed. Please check your API token configuration.'
        } else if (errorMessage.includes('Invalid')) {
          errorMessage = '⚠️ Invalid PR URL format. Expected: https://github.com/owner/repo/pull/123'
        }
        throw new Error(errorMessage)
      }

      // Step 3: Done
      setLoadingStep('Generating report...')
      await new Promise(resolve => setTimeout(resolve, 300))

      setPrData(result.data)
      addToRecentPRs(result.data)
    } catch (err) {
      setError(err.message)
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      analyzePR()
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'medium': return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/30'
      case 'medium': return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
      case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  // Export results as JSON
  const exportAsJSON = () => {
    if (!prData) return
    const dataStr = JSON.stringify(prData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pr-analysis-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Export results as PDF (simplified - creates formatted text)
  const exportAsPDF = () => {
    if (!prData) return
    
    let content = `SMART PR ANALYSIS REPORT\n\n`
    content += `PR: ${prData.title}\n`
    content += `Author: ${prData.author}\n`
    content += `Branch: ${prData.branch}\n`
    content += `Quality Score: ${prData.qualityScore}/100\n\n`
    
    content += `SECURITY FINDINGS (${prData.securityFindings.length}):\n`
    prData.securityFindings.forEach((f, i) => {
      content += `\n${i + 1}. [${f.severity.toUpperCase()}] ${f.title}\n`
      content += `   File: ${f.file}:${f.line}\n`
      content += `   ${f.description}\n`
    })
    
    content += `\n\nPERFORMANCE FINDINGS (${prData.performanceFindings.length}):\n`
    prData.performanceFindings.forEach((f, i) => {
      content += `\n${i + 1}. [${f.impact.toUpperCase()}] ${f.title}\n`
      content += `   File: ${f.file}:${f.line}\n`
      content += `   ${f.description}\n`
    })
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `pr-analysis-${Date.now()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Share analysis
  const shareAnalysis = () => {
    if (!prData) return
    
    // Create shareable URL (in production, this would be a backend-generated short URL)
    const shareData = btoa(JSON.stringify({
      title: prData.title,
      score: prData.qualityScore,
      prUrl: prUrl
    }))
    const url = `${window.location.origin}?share=${shareData}`
    setShareUrl(url)
    setShowShareModal(true)
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      console.log('Link copied to clipboard!')
    })
  }

  // Load shared analysis
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareData = params.get('share')
    if (shareData) {
      try {
        const decoded = JSON.parse(atob(shareData))
        setPrUrl(decoded.prUrl)
      } catch (e) {
        console.error('Invalid share link')
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0c0e13] relative">
      {/* Subtle noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.04]">
        <svg className="w-full h-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>
      </div>

      {/* Flat header - no gradients */}
      <header className="border-b border-[rgba(255,255,255,0.06)] bg-[#141720] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-[#0c0e13]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-base font-semibold text-white tracking-tight">Smart PR</span>
            </div>
            <div className="flex items-center gap-2">
              {prData && (
                <>
                  <button
                    onClick={exportAsJSON}
                    className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1"
                    title="Export as JSON"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export
                  </button>
                  <button
                    onClick={shareAnalysis}
                    className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1"
                    title="Share analysis"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                </>
              )}
              <button className="px-4 py-1.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0c0e13] rounded-md transition-colors">
                Docs
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PR URL Input */}
        <div className="mb-6 bg-[#141720] border border-[rgba(255,255,255,0.06)] rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Analyze Pull Request</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="https://github.com/owner/repo/pull/123"
              className="flex-1 px-4 py-2.5 bg-[#0c0e13] border border-[rgba(255,255,255,0.06)] rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
              disabled={loading}
            />
            <button
              onClick={analyzePR}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0c0e13] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Loading State with Progress */}
        {loading && (
          <div className="mb-6 bg-[#141720] border border-[rgba(255,255,255,0.06)] rounded-lg p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
              <p className="text-emerald-400 text-base font-semibold mb-2">{loadingStep || 'Starting analysis...'}</p>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className={loadingStep.includes('Fetching') ? 'text-emerald-400' : ''}>① Fetch PR</span>
                <span>→</span>
                <span className={loadingStep.includes('Analyzing') ? 'text-emerald-400' : ''}>② Analyze Code</span>
                <span>→</span>
                <span className={loadingStep.includes('Generating') ? 'text-emerald-400' : ''}>③ Generate Report</span>
              </div>
              <p className="text-slate-600 text-xs mt-3">This usually takes 10-20 seconds</p>
            </div>
          </div>
        )}

        {/* Recent PRs List */}
        {!loading && !prData && recentPRs.length > 0 && (
          <div className="mb-6 bg-[#141720] border border-[rgba(255,255,255,0.06)] rounded-lg p-6">
            <h3 className="text-sm font-bold text-white mb-4">Recent Analyses</h3>
            <div className="space-y-2">
              {recentPRs.slice(0, 5).map((pr, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrUrl(pr.prUrl)}
                  className="w-full text-left p-3 bg-[#0c0e13] hover:bg-[#1a1d2e] border border-[rgba(255,255,255,0.06)] rounded-lg transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate group-hover:text-emerald-400 transition-colors">{pr.url}</p>
                      <p className="text-xs text-slate-600 mt-1">{new Date(pr.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <span className={`text-sm font-semibold ${getScoreColor(pr.score)}`}>{pr.score}</span>
                      <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PR Info Card - Only show when data is loaded */}
        {prData && (
          <>
        <div className="mb-6 bg-[#141720] border border-[rgba(255,255,255,0.06)] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded border border-emerald-500/20">
                  {prData.status}
                </span>
                <span className="text-slate-600 text-sm">•</span>
                <span className="text-slate-500 text-sm font-medium">{prData.timestamp}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 leading-tight tracking-tight">{prData.title}</h2>
              <div className="flex items-center gap-5 text-sm">
                <span className="flex items-center gap-2 text-slate-400">
                  <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {prData.author.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{prData.author}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span className="font-medium">{prData.branch}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  <span className="font-medium">{prData.comments}</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-medium">{prData.reviewers} reviewers</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Score - Flat design with green ring */}
        <div className="mb-6">
          <div className="bg-[#141720] border border-[rgba(255,255,255,0.06)] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Quality Score</h3>
                <p className="text-sm text-slate-500 font-medium">AI-analyzed metrics</p>
              </div>
              <div className="relative">
                {/* Circular Progress - Green only */}
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - prData.qualityScore / 100)}`}
                    className="text-emerald-500 transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white">
                      {prData.qualityScore}
                    </div>
                    <div className="text-xs text-slate-600 font-semibold">/ 100</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0c0e13] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(255,255,255,0.1)] transition-colors">
                <div className="text-2xl font-bold text-white mb-1">3</div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Security</div>
                <div className="text-xs text-slate-600">1 high, 1 med, 1 low</div>
              </div>
              <div className="bg-[#0c0e13] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(255,255,255,0.1)] transition-colors">
                <div className="text-2xl font-bold text-white mb-1">3</div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Performance</div>
                <div className="text-xs text-slate-600">1 high, 1 med, 1 low</div>
              </div>
              <div className="bg-[#0c0e13] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 hover:border-[rgba(255,255,255,0.1)] transition-colors">
                <div className="text-2xl font-bold text-white mb-1">12</div>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Files</div>
                <div className="text-xs text-slate-600">+245 -89 lines</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Security Findings - Flat */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Security Findings</h3>
              <span className="text-xs text-slate-500 font-semibold">{prData.securityFindings.length} issues</span>
            </div>
            <div className="space-y-3">
              {prData.securityFindings.map((finding) => (
                <div
                  key={finding.id}
                  onClick={() => setSelectedFinding({ ...finding, type: 'security' })}
                  className={`bg-[#141720] border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedFinding?.id === finding.id && selectedFinding?.type === 'security'
                      ? 'border-[rgba(255,255,255,0.12)]'
                      : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityColor(finding.severity)} uppercase`}>
                          {finding.severity}
                        </span>
                        <span className="text-xs text-slate-600 font-mono">#{finding.id}</span>
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-2 leading-tight">
                        {finding.title}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">{finding.description}</p>
                  <div className="text-xs text-slate-600 font-mono">{finding.file}:{finding.line}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Findings - Flat */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Performance Findings</h3>
              <span className="text-xs text-slate-500 font-semibold">{prData.performanceFindings.length} issues</span>
            </div>
            <div className="space-y-3">
              {prData.performanceFindings.map((finding) => (
                <div
                  key={finding.id}
                  onClick={() => setSelectedFinding({ ...finding, type: 'performance' })}
                  className={`bg-[#141720] border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedFinding?.id === finding.id && selectedFinding?.type === 'performance'
                      ? 'border-[rgba(255,255,255,0.12)]'
                      : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getImpactColor(finding.impact)} uppercase`}>
                          {finding.impact}
                        </span>
                        <span className="text-xs text-slate-600 font-mono">#{finding.id}</span>
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-2 leading-tight">
                        {finding.title}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">{finding.description}</p>
                  <div className="text-xs text-slate-600 font-mono">{finding.file}:{finding.line}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panels - Flat */}
        {selectedFinding && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Explanation Panel */}
            <div className="bg-[#141720] border border-[rgba(255,255,255,0.06)] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-base font-bold text-white">AI Analysis</h3>
              </div>
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Issue</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedFinding.type === 'security' 
                      ? "This security vulnerability occurs when user-provided data is directly incorporated into database queries without proper sanitization or parameterization. Attackers can exploit this to execute arbitrary SQL commands, potentially accessing, modifying, or deleting sensitive data."
                      : "This performance issue arises from executing multiple database queries within a loop iteration. Each query incurs network latency and database overhead, resulting in the 'N+1 problem' where N additional queries are made for N items, significantly degrading application performance."
                    }
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Impact</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedFinding.type === 'security'
                      ? "Could lead to database compromise and data breaches. Should be addressed immediately."
                      : "Can cause significant slowdowns and poor user experience in production."
                    }
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Recommendations</h4>
                  <ul className="text-sm text-slate-400 space-y-1.5">
                    {selectedFinding.type === 'security' ? (
                      <>
                        <li className="flex items-start gap-2"><span className="text-slate-600">•</span><span>Use parameterized queries</span></li>
                        <li className="flex items-start gap-2"><span className="text-slate-600">•</span><span>Implement input validation</span></li>
                        <li className="flex items-start gap-2"><span className="text-slate-600">•</span><span>Apply least privilege principle</span></li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-start gap-2"><span className="text-slate-600">•</span><span>Use eager loading</span></li>
                        <li className="flex items-start gap-2"><span className="text-slate-600">•</span><span>Optimize database queries</span></li>
                        <li className="flex items-start gap-2"><span className="text-slate-600">•</span><span>Implement caching</span></li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Suggested Fix Panel */}
            <div className="bg-[#141720] border border-[rgba(255,255,255,0.06)] rounded-lg p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white">Suggested Fix</h3>
                <button className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#0c0e13] rounded transition-colors">
                  Apply
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Before</div>
                  <div className="bg-[#0c0e13] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
                    <pre className="text-xs text-slate-400 font-mono leading-relaxed">
{selectedFinding.type === 'security' 
  ? `const query = "SELECT * FROM users WHERE 
  username = '" + userInput + "'";
db.execute(query);`
  : `users.forEach(user => {
  const posts = db.query(
    'SELECT * FROM posts WHERE user_id = ?',
    [user.id]
  );
  user.posts = posts;
});`
}
                    </pre>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">After</div>
                  <div className="bg-[#0c0e13] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
                    <pre className="text-xs text-emerald-400 font-mono leading-relaxed">
{selectedFinding.type === 'security'
  ? `const query = "SELECT * FROM users WHERE 
  username = ?";
db.execute(query, [userInput]);`
  : `const userIds = users.map(u => u.id);
const posts = db.query(
  'SELECT * FROM posts WHERE user_id IN (?)',
  [userIds]
);
users.forEach(user => {
  user.posts = posts.filter(
    p => p.user_id === user.id
  );
});`
}
                    </pre>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-slate-400">
                    Addresses {selectedFinding.type} issue following best practices
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedFinding && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-[#141720] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Select a Finding</h3>
            <p className="text-sm text-slate-500 text-center max-w-md">
              Choose a finding to view analysis and fixes
            </p>
          </div>
        )}
        </>
        )}

        {/* Initial Empty State - No PR analyzed yet */}
        {!prData && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-[#141720] border border-[rgba(255,255,255,0.06)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Ready to Analyze</h3>
            <p className="text-sm text-slate-500 text-center max-w-md">
              Enter a GitHub PR URL above to start AI-powered analysis
            </p>
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-[#141720] border border-[rgba(255,255,255,0.06)] rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Share Analysis</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">Share this analysis with your team</p>
            <div className="bg-[#0c0e13] border border-[rgba(255,255,255,0.06)] rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-500 font-mono break-all">{shareUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  alert('Link copied to clipboard!')
                }}
                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0c0e13] rounded-lg font-semibold text-sm transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-[#0c0e13] hover:bg-[#1a1d2e] text-slate-400 rounded-lg font-semibold text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto pt-6 pb-4 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <p>Last analyzed: {new Date().toLocaleString()}</p>
            <div className="flex items-center gap-4">
              <button className="hover:text-slate-400 transition-colors">Docs</button>
              <button className="hover:text-slate-400 transition-colors">Settings</button>
              <button className="hover:text-slate-400 transition-colors">Support</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Made with Bob
