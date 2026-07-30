import { BookOpen, Target, Trophy, TrendingUp, Clock, Star, ChevronRight, Zap } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/common/context/AuthContext'

// ─── Static mock data (replace with real API data later) ─────────────────────

const STAT_CARDS = [
	{
		id: 'stat-lessons',
		icon: BookOpen,
		label: 'Bài học hoàn thành',
		value: '12',
		sub: '+3 tuần này',
		color: 'stat-blue',
	},
	{
		id: 'stat-score',
		icon: Trophy,
		label: 'Điểm TOEIC hiện tại',
		value: '650',
		sub: 'Mục tiêu: 750',
		color: 'stat-gold',
	},
	{
		id: 'stat-streak',
		icon: Zap,
		label: 'Ngày liên tiếp',
		value: '7',
		sub: 'Giữ vững phong độ!',
		color: 'stat-green',
	},
	{
		id: 'stat-time',
		icon: Clock,
		label: 'Giờ học tổng cộng',
		value: '24h',
		sub: 'Tháng này',
		color: 'stat-purple',
	},
]

const QUICK_ACTIONS = [
	{
		id: 'action-listening',
		title: 'Luyện Nghe',
		desc: 'Part 1–4 • 20 câu hỏi',
		icon: '🎧',
		badge: 'Phổ biến',
	},
	{
		id: 'action-reading',
		title: 'Luyện Đọc',
		desc: 'Part 5–7 • 30 câu hỏi',
		icon: '📖',
		badge: null,
	},
	{
		id: 'action-vocab',
		title: 'Từ Vựng',
		desc: '500+ từ nghề nghiệp',
		icon: '📝',
		badge: 'Mới',
	},
	{
		id: 'action-mock',
		title: 'Thi Thử',
		desc: 'Đề thi đầy đủ 200 câu',
		icon: '🏆',
		badge: null,
	},
]

const RECENT_LESSONS = [
	{ id: 'lesson-1', title: 'Business Email Writing', progress: 80, part: 'Part 7', time: '15 phút' },
	{ id: 'lesson-2', title: 'Office Conversations', progress: 50, part: 'Part 3', time: '10 phút' },
	{ id: 'lesson-3', title: 'Job Interview Vocab', progress: 100, part: 'Từ vựng', time: '20 phút' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function MainDashboard() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()

	const displayName = user?.username || user?.email?.split('@')[0] || 'Học viên'

	// Hour-based greeting
	const hour = new Date().getHours()
	const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'

	return (
		<div className="dashboard-root">
			{/* ── Sidebar ─────────────────────────────────────── */}
			<aside className="dashboard-sidebar">
				<div className="sidebar-logo">
					<span className="logo-text">CareerPath</span>
					<div className="logo-underline" />
				</div>

				<nav className="sidebar-nav">
					<a href="#" className="sidebar-nav-item sidebar-nav-item--active">
						<BookOpen size={18} /> Tổng Quan
					</a>
					<a href="#" className="sidebar-nav-item">
						<TrendingUp size={18} /> Lộ Trình
					</a>
					<a href="#" className="sidebar-nav-item">
						<Target size={18} /> Bài Tập
					</a>
					<a href="#" className="sidebar-nav-item">
						<Trophy size={18} /> Thành Tích
					</a>
					<a href="#" className="sidebar-nav-item">
						<Star size={18} /> Từ Vựng
					</a>
				</nav>

				<div className="sidebar-footer">
					<div className="sidebar-user-info">
						<div className="sidebar-avatar">{displayName[0].toUpperCase()}</div>
						<div>
							<p className="sidebar-username">{displayName}</p>
							<p className="sidebar-role">Học viên</p>
						</div>
					</div>
					<button
						id="dashboard-logout-btn"
						className="sidebar-logout-btn"
						onClick={() => { logout(); navigate({ to: '/login' }) }}
						title="Đăng xuất"
					>
						Đăng xuất
					</button>
				</div>
			</aside>

			{/* ── Main content ─────────────────────────────────── */}
			<main className="dashboard-main">
				{/* Header */}
				<header className="dashboard-header">
					<div>
						<h1 className="dashboard-greeting">
							{greeting}, <span className="dashboard-greeting-name">{displayName}! 👋</span>
						</h1>
						<p className="dashboard-subheading">
							Hãy tiếp tục hành trình chinh phục TOEIC của bạn hôm nay.
						</p>
					</div>
					<div className="header-target-badge">
						<Target size={16} />
						<span>Mục tiêu: 750 điểm</span>
					</div>
				</header>

				{/* Stat Cards */}
				<section className="dashboard-stats" aria-label="Thống kê học tập">
					{STAT_CARDS.map((s) => {
						const Icon = s.icon
						return (
							<div key={s.id} id={s.id} className={`stat-card ${s.color}`}>
								<div className="stat-icon-wrap">
									<Icon size={22} />
								</div>
								<div>
									<p className="stat-value">{s.value}</p>
									<p className="stat-label">{s.label}</p>
									<p className="stat-sub">{s.sub}</p>
								</div>
							</div>
						)
					})}
				</section>

				{/* Quick Actions */}
				<section className="dashboard-section">
					<div className="section-header">
						<h2 className="section-title">Luyện Tập Ngay</h2>
						<a href="#" className="section-more">
							Xem tất cả <ChevronRight size={14} />
						</a>
					</div>
					<div className="quick-action-grid">
						{QUICK_ACTIONS.map((a) => (
							<button key={a.id} id={a.id} className="quick-action-card" type="button">
								<span className="qa-icon">{a.icon}</span>
								<div className="qa-content">
									<p className="qa-title">{a.title}</p>
									<p className="qa-desc">{a.desc}</p>
								</div>
								{a.badge && <span className="qa-badge">{a.badge}</span>}
								<ChevronRight size={16} className="qa-arrow" />
							</button>
						))}
					</div>
				</section>

				{/* Recent Lessons */}
				<section className="dashboard-section">
					<div className="section-header">
						<h2 className="section-title">Tiếp Tục Học</h2>
						<a href="#" className="section-more">
							Xem tất cả <ChevronRight size={14} />
						</a>
					</div>
					<div className="recent-lessons">
						{RECENT_LESSONS.map((l) => (
							<div key={l.id} id={l.id} className="lesson-card">
								<div className="lesson-info">
									<p className="lesson-title">{l.title}</p>
									<p className="lesson-meta">
										<span className="lesson-part">{l.part}</span>
										<span>•</span>
										<span>{l.time}</span>
									</p>
								</div>
								<div className="lesson-progress-wrap">
									<div className="lesson-progress-bar">
										<div
											className="lesson-progress-fill"
											style={{ width: `${l.progress}%` }}
										/>
									</div>
									<span className="lesson-progress-pct">{l.progress}%</span>
								</div>
								<button className="lesson-continue-btn" type="button">
									{l.progress === 100 ? 'Ôn tập' : 'Tiếp tục'}
								</button>
							</div>
						))}
					</div>
				</section>
			</main>
		</div>
	)
}
