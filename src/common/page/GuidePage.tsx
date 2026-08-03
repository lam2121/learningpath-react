import { MainNavigationMenu } from '@/common/component/MainNavigationMenu'
import { Guide } from '@/common/component/Guide'
import { MainFooter } from '@/common/component/MainFooter'

export function GuidePage() {
    return (
        <>
            <div className="relative min-h-screen overflow-x-hidden flex flex-col">

                <MainNavigationMenu />

                <div className="flex-1">
                    <Guide />
                </div>

                <MainFooter />

            </div>
        </>
    )
}