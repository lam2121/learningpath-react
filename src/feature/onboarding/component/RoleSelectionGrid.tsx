import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import tmaLogo from '@/asset/image/tma_logo.png'
import bannerBg from '@/asset/image/banner_background.png'

// ─── Role Data (sourced from TOEIC_Phase2_Task1.1_ver1.4.html spec) ─────────

interface SkillWeight {
  D_doc: number   // Documentation
  C_comm: number  // Communication
  T_trouble: number // Troubleshooting
  G_biz: number   // Business / Commercial
}

interface RoleCard {
  id: string
  title: string
  subtitle: string
  toeicTarget: string
  weights: SkillWeight
  tier1: string[]
  tier2: string[]
  icon: string
  color: string
  gradient: string
  accentColor: string
}

const ROLES: RoleCard[] = [
  {
    id: 'pm',
    title: 'Project Manager',
    subtitle: 'Client Communication',
    toeicTarget: '750 – 850',
    weights: { D_doc: 20, C_comm: 50, T_trouble: 10, G_biz: 20 },
    tier1: ['Dẫn dắt cuộc họp Kick-off dự án', 'Báo cáo Status Updates trong Stand-up', 'Viết email báo cáo tiến độ tuần'],
    tier2: ['Thương lượng từ chối Scope Creep', 'Email giải trình vi phạm SLA/Deadline', 'Xoa dịu khách hàng vì lỗi Production'],
    icon: '🎯',
    color: 'from-violet-500 to-purple-600',
    gradient: 'from-violet-50 to-purple-50',
    accentColor: 'violet',
  },
  {
    id: 'ba',
    title: 'Business Analyst',
    subtitle: 'Requirements & Analysis',
    toeicTarget: '700 – 800',
    weights: { D_doc: 35, C_comm: 45, T_trouble: 5, G_biz: 15 },
    tier1: ['Phỏng vấn khai thác yêu cầu (Elicitation)', 'Trình bày và giải thích User Story', 'Q&A: Đặt câu hỏi làm rõ điểm mơ hồ'],
    tier2: ['Thuyết trình báo cáo Gap Analysis', 'Từ chối các yêu cầu thiếu khả thi', 'Xử lý mâu thuẫn yêu cầu Stakeholders'],
    icon: '📊',
    color: 'from-blue-500 to-indigo-600',
    gradient: 'from-blue-50 to-indigo-50',
    accentColor: 'blue',
  },
  {
    id: 'tech-lead',
    title: 'Tech Lead',
    subtitle: 'Team Leadership',
    toeicTarget: '650 – 750',
    weights: { D_doc: 20, C_comm: 40, T_trouble: 30, G_biz: 10 },
    tier1: ['Cập nhật tiến độ kỹ thuật trong Daily Scrum', 'Nhận xét Code Review lịch sự, xây dựng', 'Giao tiếp hướng dẫn (Mentoring) Junior'],
    tier2: ['Biện luận xin thời gian xử lý Nợ kỹ thuật', 'Bảo vệ quyết định Kiến trúc', 'Phát ngôn chính thức khi hệ thống sập'],
    icon: '⚡',
    color: 'from-emerald-500 to-teal-600',
    gradient: 'from-emerald-50 to-teal-50',
    accentColor: 'emerald',
  },
  {
    id: 'sa',
    title: 'Software Architect',
    subtitle: 'System Design & Strategy',
    toeicTarget: '700 – 800',
    weights: { D_doc: 40, C_comm: 30, T_trouble: 20, G_biz: 10 },
    tier1: ['Thuyết trình bảo vệ kiến trúc hệ thống (HLD)', 'Giải thích các biểu đồ (Diagram Walkthroughs)', 'Trình bày ưu/nhược điểm Tech Stack'],
    tier2: ['Thuyết trình phân tích đánh đổi (Trade-off)', 'Pitching kế hoạch dịch chuyển Cloud', 'Báo cáo định hướng công nghệ cho CTO/CEO'],
    icon: '🏗️',
    color: 'from-amber-500 to-orange-600',
    gradient: 'from-amber-50 to-orange-50',
    accentColor: 'amber',
  },
  {
    id: 'qa',
    title: 'QA / Tester',
    subtitle: 'Quality Assurance',
    toeicTarget: '600 – 700',
    weights: { D_doc: 35, C_comm: 25, T_trouble: 30, G_biz: 10 },
    tier1: ['Viết báo cáo Bug (Bug reporting) mạch lạc', 'Mô tả chi tiết các bước tái hiện lỗi', 'Giao tiếp hỗ trợ khách hàng giai đoạn UAT'],
    tier2: ['Bảo vệ mức độ nghiêm trọng của Bug (Triage)', 'Phản đối release khi còn Bug nặng', 'Viết báo cáo phân tích nguyên nhân (RCA)'],
    icon: '🔍',
    color: 'from-rose-500 to-pink-600',
    gradient: 'from-rose-50 to-pink-50',
    accentColor: 'rose',
  },
  {
    id: 'devops',
    title: 'DevOps / SRE',
    subtitle: 'Infrastructure & Reliability',
    toeicTarget: '600 – 700',
    weights: { D_doc: 25, C_comm: 15, T_trouble: 50, G_biz: 10 },
    tier1: ['Thông báo cấu hình luồng CI/CD', 'Gửi email trạng thái Deploy', 'Báo cáo tóm tắt tình trạng Uptime/Downtime'],
    tier2: ['Họp Post-mortem sau sự cố sập mạng', 'Giải trình vi phạm cam kết SLA', 'Thông báo và điều phối khi rò rỉ bảo mật'],
    icon: '🛠️',
    color: 'from-slate-500 to-gray-600',
    gradient: 'from-slate-50 to-gray-50',
    accentColor: 'slate',
  },
  {
    id: 'frontend',
    title: 'Frontend / UI-UX',
    subtitle: 'User Interface & Experience',
    toeicTarget: '600 – 700',
    weights: { D_doc: 20, C_comm: 40, T_trouble: 30, G_biz: 10 },
    tier1: ['Giải thích logic Animation/Flow trên UI', 'Báo cáo lỗi hiển thị đa trình duyệt', 'Trình bày bản Prototype/Figma cho team'],
    tier2: ['Bảo vệ quyết định UX/UI trước Khách hàng', 'Từ chối khéo các yêu cầu thiết kế phi lý', 'Đàm phán chốt phương án thiết kế cuối'],
    icon: '🎨',
    color: 'from-cyan-500 to-sky-600',
    gradient: 'from-cyan-50 to-sky-50',
    accentColor: 'cyan',
  },
  {
    id: 'data-ai',
    title: 'Data / AI Engineer',
    subtitle: 'Data Pipeline & AI Models',
    toeicTarget: '650 – 750',
    weights: { D_doc: 30, C_comm: 20, T_trouble: 40, G_biz: 10 },
    tier1: ['Báo cáo trạng thái luồng dữ liệu (Data Pipeline)', 'Trình bày chỉ số độ chính xác Model', 'Cảnh báo lỗi tiến trình ETL'],
    tier2: ['Giải thích hiện tượng AI ảo giác (Hallucinations)', 'Biện luận tính tuân thủ bảo mật dữ liệu (GDPR)', 'Thuyết trình xin ngân sách nâng cấp Model'],
    icon: '🤖',
    color: 'from-fuchsia-500 to-violet-600',
    gradient: 'from-fuchsia-50 to-violet-50',
    accentColor: 'fuchsia',
  },
]

// ─── Skill Weight Bar Component ───────────────────────────────────────────────

function SkillBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    D_doc: 'bg-blue-500',
    C_comm: 'bg-emerald-500',
    T_trouble: 'bg-rose-500',
    G_biz: 'bg-amber-500',
  }

  const labelMap: Record<string, string> = {
    D_doc: 'D',
    C_comm: 'C',
    T_trouble: 'T',
    G_biz: 'G',
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold text-gray-500 w-3 flex-shrink-0">{labelMap[color]}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorMap[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-gray-600 w-7 text-right">{value}%</span>
    </div>
  )
}

// ─── Role Card Component ───────────────────────────────────────────────────────

function RoleCardItem({
  role,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: {
  role: RoleCard
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onHover: () => void
  onLeave: () => void
}) {
  return (
    <div
      id={`role-card-${role.id}`}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 select-none
        ${isSelected
          ? 'border-indigo-500 shadow-lg shadow-indigo-100 scale-[1.02] bg-white'
          : isHovered
          ? 'border-gray-300 shadow-md scale-[1.01] bg-white'
          : 'border-gray-200 shadow-sm bg-white/80 hover:bg-white'
        }
      `}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
          {role.icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{role.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{role.subtitle}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-semibold">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            TOEIC {role.toeicTarget}
          </span>
        </div>
      </div>

      {/* Skill Weights (G-Axis) */}
      <div className="mb-4 space-y-1.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Trọng số kỹ năng</p>
        <SkillBar label="D" value={role.weights.D_doc} color="D_doc" />
        <SkillBar label="C" value={role.weights.C_comm} color="C_comm" />
        <SkillBar label="T" value={role.weights.T_trouble} color="T_trouble" />
        <SkillBar label="G" value={role.weights.G_biz} color="G_biz" />
      </div>

      {/* Skill highlights */}
      <div className={`rounded-xl p-3 bg-gradient-to-br ${role.gradient} border border-white/60`}>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kỹ năng thực chiến</p>
        <ul className="space-y-1">
          {role.tier1.slice(0, 2).map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700">
              <span className="mt-0.5 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Legend Component ─────────────────────────────────────────────────────────

function SkillLegend() {
  const items = [
    { key: 'D', label: 'Tài liệu (D_doc)', color: 'bg-blue-500' },
    { key: 'C', label: 'Giao tiếp (C_comm)', color: 'bg-emerald-500' },
    { key: 'T', label: 'Sự cố (T_trouble)', color: 'bg-rose-500' },
    { key: 'G', label: 'Thương mại (G_biz)', color: 'bg-amber-500' },
  ]
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {items.map(({ key, label, color }) => (
        <div key={key} className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-xs text-white/60">{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RoleSelectionGrid() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null)
  const navigate = useNavigate()

  const selectedRole = ROLES.find(r => r.id === selectedRoleId) ?? null

  function handleConfirm() {
    if (!selectedRoleId) return
    // Navigate to the next onboarding step (survey)
    navigate({ to: '/onboarding/survey' })
  }


  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundImage: `url(${bannerBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Deep blue overlay */}
      <div className="fixed inset-0 bg-blue-700/80" />

      {/* Subtle radial glow decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* TMA Logo — top left */}
      <img
        src={tmaLogo}
        alt="TMA Solutions"
        className="absolute top-6 left-6 w-45 h-auto z-20"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step === 1
                        ? 'bg-blue-400 text-white shadow-md shadow-blue-900'
                        : 'bg-white/10 text-white/40'
                    }`}
                  >
                    {step < 1 ? '✓' : step}
                  </div>

                  {step < 4 && (
                    <div className="w-10 h-0.5 bg-white/20 mx-2 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-blue-200 text-sm font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" />
            Bước 1 / 4 — Chọn Career Track
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-3 drop-shadow-md">
            Bạn đang đảm nhận
            <span className="block bg-gradient-to-r from-blue-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent mt-1">
              vai trò nào tại TMA?
            </span>
          </h1>
          <p className="text-base sm:text-lg text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
            Hệ thống sẽ xây dựng lộ trình học tiếng Anh IT cá nhân hóa dựa trên
            <span className="font-semibold text-white"> trọng số kỹ năng D/C/T/G</span> đặc thù của từng career track.
          </p>

          {/* Legend */}
          <div className="mt-5">
            <SkillLegend />
          </div>
        </div>

        {/* Role Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {ROLES.map((role) => (
            <RoleCardItem
              key={role.id}
              role={role}
              isSelected={selectedRoleId === role.id}
              isHovered={hoveredRoleId === role.id}
              onSelect={() => setSelectedRoleId(role.id)}
              onHover={() => setHoveredRoleId(role.id)}
              onLeave={() => setHoveredRoleId(null)}
            />
          ))}
        </div>

        {/* Selection summary & CTA */}
        <div
          className={`transition-all duration-500 ${selectedRole ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-50 p-6">
              {selectedRole && (
                <div className="flex items-start gap-4 mb-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedRole.color} flex items-center justify-center text-3xl shadow flex-shrink-0`}>
                    {selectedRole.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-gray-900">{selectedRole.title}</h2>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                        TOEIC {selectedRole.toeicTarget}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedRole.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRole.tier2.slice(0, 2).map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <button
                id="btn-confirm-role"
                onClick={handleConfirm}
                disabled={!selectedRoleId}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-base shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2.5"
              >
                <span>Tiếp tục với {selectedRole?.title ?? 'vai trò đã chọn'}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Bạn có thể thay đổi Career Track sau này trong phần Cài đặt
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder CTA when nothing selected */}
        {!selectedRole && (
          <div className="text-center mt-4">
            <p className="text-sm text-white/40 animate-pulse">
              ☝️ Chọn một Career Track để bắt đầu hành trình học tiếng Anh IT của bạn
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
