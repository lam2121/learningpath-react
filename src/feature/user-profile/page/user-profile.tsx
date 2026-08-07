
import { UserProfileCard } from '@/feature/user-profile/component/UserProfileCard'
import { DailyPlanView } from '../component/DailyPlanView'
import { LearningHistoryChart } from '@/feature/user-profile/component/LearningHistoryChart'
import { MainNavigationMenu } from '@/common/component/MainNavigationMenu'
export function UserProfile() {
	return (
		<div className="min-h-screen w-full bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)]">
			<MainNavigationMenu />

			<div className="w-full px-3 pb-6 pt-3 sm:px-5 lg:px-8">
				<div
					className="
                mt-2 grid items-stretch gap-5
                xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]
                2xl:gap-8
            "
				>
					{/* Left side: 2/3 */}
					<div className="flex min-w-0 flex-col space-y-5">
						<UserProfileCard />
						<div className="flex-1">
							<LearningHistoryChart />
						</div>
					</div>

					{/* Daily plan: 1/3 */}
					<aside className="h-full min-w-0">
						<DailyPlanView />
					</aside>
				</div>
			</div>
		</div>
	)
}
