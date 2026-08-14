import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shadcn/component/ui/dialog';
import { Button } from '@/shadcn/component/ui/button';
import { Badge } from '@/shadcn/component/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Eye } from 'lucide-react';

interface AiPreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	data: { examples: string[]; warning?: string; error?: string } | null;
}

export function AiPreviewModal({ isOpen, onClose, data }: AiPreviewModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Eye className="h-5 w-5 text-blue-600" />
						Preview AI Generation
					</DialogTitle>
					<DialogDescription>
						How AI interprets your Job Description and the four role-specific skill definitions. If examples are too generic, refine the skill descriptions before saving.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 max-h-[60vh] overflow-y-auto">
					{!data ? (
						<div className="flex items-center justify-center h-48">
							<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
						</div>
					) : (
						<>
							{data.error && (
								<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
									{data.error}
								</div>
							)}

							{data.warning && (
								<Badge variant="destructive" className="text-sm px-3 py-1.5">
									<AlertTriangle className="h-3 w-3 mr-1.5" />
									{data.warning}
								</Badge>
							)}
							
							<div className="space-y-3">
								{data.examples.map((example, idx) => (
									<div key={idx} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
										<div className="flex items-start gap-3">
											<div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
												{idx + 1}
											</div>
											<p className="text-gray-800 text-sm leading-relaxed">{example}</p>
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</div>

				<DialogFooter className="flex-row justify-end gap-3">
					<Button variant="outline" onClick={onClose}>
						Close
					</Button>
					<Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
						<CheckCircle className="h-4 w-4 mr-2" />
						Understood, continue saving
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
