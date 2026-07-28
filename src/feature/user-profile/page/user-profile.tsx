
import { UserProfileCard } from '@/feature/user-profile/component/UserProfileCard'
import { DailyPlanView } from '../component/DailyPlanView'
import { LearningCalendar } from '@/feature/user-profile/component/LearningCalendar'
import { LearningHistoryChart } from '@/feature/user-profile/component/LearningHistoryChart'
import { MainNavigationMenu } from '@/common/component/MainNavigationMenu'
export function MainPage() {
	return (
		<>
			<MainNavigationMenu />
			<div className="flex gap-6">
				<DailyPlanView />

				<div className="flex-1 space-y-6">
					<UserProfileCard />
					<LearningHistoryChart />
					<LearningCalendar />
				</div>
			</div>
		</>
	)
}
