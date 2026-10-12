import { MainNavigationMenu } from '@/common/component/MainNavigationMenu'
import { Home } from '@/common/component/Home'
import { MainFooter } from '@/common/component/MainFooter'
export function HomePage() {
    return (
        <>
            <div className="relative min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden flex flex-col bg-[#f5fbff] dark:bg-slate-950">
                <MainNavigationMenu />
                <div className="flex-1">
                    <Home />
                </div>
                <MainFooter />
            </div>
        </>
    )
}