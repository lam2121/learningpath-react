import { MainNavigationMenu } from '@/common/component/MainNavigationMenu'
import { Home } from '@/common/component/Home'
import { MainFooter } from '@/common/component/MainFooter'
export function HomePage() {
    return (
        <>
            <div className="relative min-h-screen overflow-x-hidden flex flex-col">
                <MainNavigationMenu />
                <div className="flex-1">
                    <Home />
                </div>
                <MainFooter />
            </div>
        </>
    )
}