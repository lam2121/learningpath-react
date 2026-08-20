import { useState } from 'react';
import { cn } from '@/shadcn/lib/util';
import { Button } from '@/shadcn/component/ui/button';
import { Label } from '@/shadcn/component/ui/label';
import { Switch } from '@/shadcn/component/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/component/ui/card';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Zap, Shield, ShieldOff, Loader2, AlertTriangle } from 'lucide-react';

interface KillSwitchToggleProps {
	enabled: boolean;
	onToggle: (enabled: boolean) => void;
	disabled?: boolean;
	compact?: boolean;
}

export function KillSwitchToggle({ enabled, onToggle, disabled, compact = false }: KillSwitchToggleProps) {
	const [toggling, setToggling] = useState(false);

	const handleChange = async (checked: boolean) => {
		if (disabled || toggling) return;
		setToggling(true);
		try {
			await onToggle(checked);
		} catch (error) {
			console.error('Failed to toggle kill switch:', error);
			alert('Failed to change status');
		} finally {
			setToggling(false);
		}
	};

	if (compact) {
		return (
			<div className={cn(
				'flex items-center gap-3 rounded-xl border p-3 transition-colors',
				enabled
					? 'border-red-200 bg-red-50'
					: 'border-emerald-200 bg-emerald-50'
			)}>
				<Zap className={cn('h-5 w-5', enabled ? 'text-red-600' : 'text-emerald-600')} />
				<div className="flex-1 min-w-0">
					<p className={cn('text-sm font-medium', enabled ? 'text-red-800' : 'text-emerald-800')}>
						Emergency Kill Switch
					</p>
					<p className={cn('text-xs', enabled ? 'text-red-600' : 'text-emerald-700')}>
						{enabled ? 'AI generation disabled. Serving cache only.' : 'AI generation active and accepting new jobs.'}
					</p>
				</div>
				<Switch
					checked={enabled}
					onCheckedChange={handleChange}
					disabled={disabled || toggling}
					aria-label="Toggle AI Kill Switch"
				/>
				{toggling && <Loader2 className={cn('h-4 w-4 animate-spin', enabled ? 'text-red-500' : 'text-emerald-500')} />}
			</div>
		);
	}

	return (
		<Card className="border-red-200 bg-red-50">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-red-700">
					<Zap className="h-5 w-5" />
					Emergency Kill Switch
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<Alert variant={enabled ? 'destructive' : 'default'} className={cn(
					'border-2',
					enabled ? 'border-red-300 bg-red-50' : 'border-green-200 bg-green-50'
				)}>
					{enabled ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
					<AlertDescription className="flex flex-col gap-1">
						<span className="font-medium">
							{enabled 
								? 'AI Generation DISABLED - Serving cache only' 
								: 'AI Generation NORMALLY OPERATIONAL'}
						</span>
						<span className="text-sm text-gray-600">
							{enabled 
								? 'All AI calls (Placement Test, Course Generator, Quiz Generator, Evaluator) will be blocked. System will only return cached content from DB. Learners can still study but no new content will be generated.'
								: 'System operating normally. AI will be called when needed to generate new content.'}
						</span>
					</AlertDescription>
				</Alert>

				{enabled && (
					<Alert className="border-amber-200 bg-amber-50">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription className="flex flex-col gap-1">
							<span className="font-medium">⚠️ WARNING: Kill Switch IS ON</span>
							<span className="text-sm text-amber-800">
								This means AI budget is exhausted or there's an issue. Please re-enable when budget is replenished or issue is resolved.
							</span>
						</AlertDescription>
					</Alert>
				)}

				<div className="flex items-center justify-between p-4 rounded-lg bg-white border">
					<div>
						<p className="text-sm text-gray-500">Current Status</p>
						<p className={cn(
							'font-bold text-lg',
							enabled ? 'text-red-600' : 'text-green-600'
						)}>
							{enabled ? '🔴 DISABLED' : '🟢 ENABLED'}
						</p>
					</div>
					<Switch
						checked={enabled}
						onCheckedChange={handleChange}
						disabled={disabled || toggling}
						id="kill-switch-main"
					/>
<Label htmlFor="kill-switch-main" className="text-sm text-gray-600">
							{enabled ? 'Enable AI Generation' : 'Disable AI Generation (Emergency)'}
						</Label>
					{toggling && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
				</div>

				{enabled && (
<Button
							variant="default"
							className="w-full bg-red-600 hover:bg-red-700"
							onClick={() => handleChange(false)}
							disabled={toggling}
						>
							<Shield className="h-4 w-4 mr-2" />
							RE-ENABLE AI GENERATION (Resolve Emergency)
						</Button>
				)}
			</CardContent>
		</Card>
	);
}

export function KillSwitchBanner({ enabled }: { enabled: boolean }) {
	if (!enabled) return null;

	return (
		<Alert className="fixed bottom-4 right-4 z-50 max-w-sm border-red-300 bg-red-50 shadow-lg animate-slide-in">
			<AlertTriangle className="h-4 w-4 text-red-500" />
			<AlertDescription className="flex flex-col gap-1">
				<span className="font-medium">🔴 KILL SWITCH ACTIVE</span>
				<span className="text-xs text-red-700">AI Generation disabled. Serving cached content only.</span>
			</AlertDescription>
		</Alert>
	);
}
