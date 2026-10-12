import { MainNavigationMenu } from '@/common/component/MainNavigationMenu'
import { Guide } from '@/common/component/Guide'
import { MainFooter } from '@/common/component/MainFooter'

export function GuidePage() {
    return (
        <>
            <div className="relative min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden flex flex-col bg-background text-foreground">

                <MainNavigationMenu />

                <div className="flex-1">
                    <Guide />
                </div>

                <MainFooter />

            </div>
        </>
    )
}