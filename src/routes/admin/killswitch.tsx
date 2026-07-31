import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { KillSwitchToggle } from '@/feature/admin/component/KillSwitchToggle';
import { fetchKillSwitchState, toggleKillSwitch, type KillSwitchState } from '@/feature/admin/api/adminApi';
import { Badge } from '@/shadcn/component/ui/badge';
import { Loader2 } from 'lucide-react';

function KillSwitchPage() {
	const [killSwitch, setKillSwitch] = useState<KillSwitchState>({ enabled: false });
	const [loading, setLoading] = useState(true);
	const [toggling, setToggling] = useState(false);

	useEffect(() => {
		loadKillSwitch();
		
		// Listen for kill switch changes from other tabs
		const handleKillSwitchChange = (e: CustomEvent) => {
			setKillSwitch(e.detail);
		};
		window.addEventListener('kill-switch-changed', handleKillSwitchChange as EventListener);
		return () => window.removeEventListener('kill-switch-changed', handleKillSwitchChange as EventListener);
	}, []);

	const loadKillSwitch = async () => {
		try {
			const state = await fetchKillSwitchState();
			setKillSwitch(state);
		} catch (error) {
			console.error('Failed to load kill switch:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleToggleKillSwitch = async (enabled: boolean) => {
		setToggling(true);
		try {
			const result = await toggleKillSwitch(enabled, enabled ? 'Manual toggle by admin' : 'Manual toggle by admin');
			setKillSwitch(result);
		} catch (error) {
			console.error('Failed to toggle kill switch:', error);
		} finally {
			setToggling(false);
		}
	};

	if (loading) {
		return (
			<div className="space-y-6 max-w-2xl">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Emergency Kill Switch</h1>
<p className="text-gray-500">Disable AI Generation when budget exhausted or issue occurs</p>
				</div>
				<div className="flex items-center justify-center h-32">
					<Loader2 className="h-6 w-6 animate-spin text-blue-600" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-2xl">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Emergency Kill Switch</h1>
				<p className="text-gray-500">Disable AI Generation when budget exhausted or issue occurs</p>
			</div>
			
			<div className="p-6 bg-white rounded-lg border border-gray-200 space-y-4">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-gray-900">Current Status</h2>
						<p className="text-sm text-gray-500">Enable/disable entire AI generation system</p>
					</div>
					<div className="flex items-center gap-3">
						<Badge variant={killSwitch.enabled ? 'destructive' : 'default'} className="text-sm px-3 py-1">
							{killSwitch.enabled ? 'ON' : 'OFF'}
						</Badge>
					</div>
				</div>
				
				{killSwitch.enabled && killSwitch.enabledAt && (
					<div className="text-sm text-gray-500">
Activated at: {new Date(killSwitch.enabledAt).toLocaleString()}
							{killSwitch.enabledBy && ` by ${killSwitch.enabledBy}`}
							{killSwitch.reason && ` - Reason: ${killSwitch.reason}`}
					</div>
				)}
				
				<div className="pt-4 border-t border-gray-100">
					<KillSwitchToggle 
						enabled={killSwitch.enabled} 
						onToggle={handleToggleKillSwitch}
						disabled={toggling}
					/>
				</div>
			</div>
			
			<div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
<p className="text-sm text-amber-800">
						<strong>Note:</strong> When Kill Switch is enabled, all AI generation will be completely stopped. 
						Learners can still access existing content but no new content will be generated.
					</p>
			</div>
		</div>
	)
}

export const Route = createFileRoute('/admin/killswitch')({
	component: KillSwitchPage,
});
