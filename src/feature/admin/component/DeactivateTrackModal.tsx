import { useState, useEffect } from 'react';
import { cn } from '@/shadcn/lib/util';
import { Button } from '@/shadcn/component/ui/button';
import { Input } from '@/shadcn/component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import { Alert, AlertDescription } from '@/shadcn/component/ui/alert';
import { Badge } from '@/shadcn/component/ui/badge';
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { deactivateTrack, getDeactivationWarning, type TrackDeactivationWarning } from '../api/adminApi';

interface DeactivateTrackModalProps {
	isOpen: boolean;
	onClose: () => void;
	trackId: string;
	trackName: string;
	onSuccess: () => void;
}

export function DeactivateTrackModal({ isOpen, onClose, trackId, trackName, onSuccess }: DeactivateTrackModalProps) {
	const [confirmText, setConfirmText] = useState('');
	const [loading, setLoading] = useState(false);
	const [warning, setWarning] = useState<TrackDeactivationWarning | null>(null);
	const [step, setStep] = useState<'confirm' | 'typing' | 'success'>('confirm');



	const handleConfirm = async () => {
		if (confirmText.toLowerCase() !== trackName.toLowerCase()) return;
		setLoading(true);
		try {
			await deactivateTrack(trackId);
			setStep('success');
			onSuccess();
			setTimeout(() => {
				onClose();
				setStep('confirm');
				setConfirmText('');
			}, 1500);
		} catch (error) {
			console.error('Deactivate failed:', error);
			alert('Tắt track thất bại');
		} finally {
			setLoading(false);
		}
	};

	// Load warning when modal opens
	useEffect(() => {
		if (isOpen) {
			const loadWarning = async () => {
				const w = await getDeactivationWarning(trackId);
				setWarning(w);
			};
			loadWarning();
		}
	}, [isOpen, trackId]);

	return (
		<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-red-600">
						<AlertTriangle className="h-5 w-5" />
						Xác nhận tắt Career Track
					</DialogTitle>
					<DialogDescription>
						Bạn sắp tắt track <strong>{trackName}</strong>. Hành động này không thể hoàn tác qua UI.
					</DialogDescription>
				</DialogHeader>

				{step === 'confirm' && warning && (
					<div className="space-y-4 py-4">
						<Alert variant="default" className={cn(
							'border-amber-200 bg-amber-50',
							!warning.hasActiveLearners && 'border-green-200 bg-green-50'
						)}>
							<AlertTriangle className="h-4 w-4" />
							<AlertDescription className="text-sm">
								{warning.message}
							</AlertDescription>
						</Alert>

						{warning.hasActiveLearners && warning.activeLearnersPreview.length > 0 && (
							<div className="text-sm space-y-2">
								<p className="font-medium text-gray-700">Học viên đang học (3/{warning.activeLearnerCount}):</p>
								<ul className="space-y-1">
									{warning.activeLearnersPreview.map(u => (
										<li key={u.id} className="flex items-center justify-between text-gray-600">
											<span>{u.name} ({u.email})</span>
											<Badge variant="outline" className="text-xs">{u.progress}%</Badge>
										</li>
									))}
								</ul>
								{warning.activeLearnerCount > 3 && (
									<p className="text-xs text-gray-500">... và {warning.activeLearnerCount - 3} học viên khác</p>
								)}
							</div>
						)}

						{!warning.hasActiveLearners && (
							<p className="text-sm text-green-700">
								✓ Track này không có học viên đang học. Có thể tắt an toàn.
							</p>
						)}
					</div>
				)}

				{step === 'typing' && (
					<div className="space-y-4 py-4">
						<p className="text-sm text-gray-600">
							Để xác nhận, vui lòng gõ chính xác tên track: <strong>{trackName}</strong>
						</p>
						<Input
							value={confirmText}
							onChange={e => setConfirmText(e.target.value)}
							placeholder={trackName}
							autoFocus
							className={cn(
								'border-2',
								confirmText.toLowerCase() === trackName.toLowerCase() ? 'border-green-400' : 'border-gray-200'
							)}
						/>
						<p className="text-xs text-gray-500">
							{confirmText.toLowerCase() === trackName.toLowerCase() 
								? '✓ Đúng - Có thể xác nhận' 
								: 'Cần gõ chính xác tên track'}
						</p>
					</div>
				)}

				{step === 'success' && (
					<div className="text-center py-8">
						<CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
						<h3 className="text-lg font-semibold text-gray-900">Đã tắt track thành công</h3>
						<p className="text-gray-500 mt-1">Học viên hiện tại không bị ảnh hưởng. Học viên mới không thể chọn track này.</p>
					</div>
				)}

				<DialogFooter className="flex-col-reverse sm:flex-row gap-3">
					{step === 'confirm' && (
						<Button 
							variant="default" 
							onClick={() => setStep('typing')}
							className="w-full sm:flex-1 bg-red-600 hover:bg-red-700"
						>
							Tiếp tục xác nhận
						</Button>
					)}
					{step === 'typing' && (
						<>
							<Button variant="outline" onClick={() => setStep('confirm')} className="w-full sm:flex-1">
								Quay lại
							</Button>
							<Button 
								variant="destructive" 
								onClick={handleConfirm}
								disabled={loading || confirmText.toLowerCase() !== trackName.toLowerCase()}
								className="w-full sm:flex-1"
							>
								{loading ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" />
										Đang tắt...
									</>
								) : (
									'Xác nhận tắt track'
								)}
							</Button>
						</>
					)}
					{step === 'success' && (
						<Button variant="outline" onClick={onClose} className="w-full">
							Đóng
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}