import { useCallback, useEffect, useRef, useState } from 'react';
import {
	ChevronLeft,
	ChevronRight,
	RotateCcw,
	Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/shadcn/component/ui/badge';
import { Button } from '@/shadcn/component/ui/button';
import { Input } from '@/shadcn/component/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shadcn/component/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shadcn/component/ui/table';
import { useAuth } from '@/common/context/AuthContext';

import {
	fetchAdminUsers,
	resetLearner,
} from '../api/adminApi';
import { ResetLearnerModal } from './UserActionModals';
import { ADMIN_ROLE_ID, type AdminUser, type UserRoleFilter } from '../type/Admin';

const PAGE_SIZE = 25;

interface Filters {
	search: string;
	role: string;
}

function displayName(user: AdminUser): string {
	return user.name || user.email;
}

function blockReason(user: AdminUser, selfId: number | undefined): string | null {
	if (user.id === selfId) return 'You cannot reset your own learning progress.';
	return null;
}

export function UserManagementTable() {
	const { user: currentUser } = useAuth();
	const selfId = currentUser?.id;

	const [users, setUsers] = useState<AdminUser[]>([]);
	const [total, setTotal] = useState(0);
	const [offset, setOffset] = useState(0);
	const [loading, setLoading] = useState(true);

	const [searchInput, setSearchInput] = useState('');
	const [filters, setFilters] = useState<Filters>({ search: '', role: 'all' });

	const [pendingUser, setPendingUser] = useState<AdminUser | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

	const requestSeq = useRef(0);

	const loadUsers = useCallback(async (flt: Filters, pageOffset: number) => {
		setLoading(true);
		const seq = ++requestSeq.current;
		try {
			const page = await fetchAdminUsers({
				search: flt.search || undefined,
				role: flt.role === 'all' ? '' : (flt.role as UserRoleFilter),
				limit: PAGE_SIZE,
				offset: pageOffset,
			});
			if (seq !== requestSeq.current) return;
			setUsers(page.items);
			setTotal(page.total);
		} catch (error) {
			if (seq === requestSeq.current) {
				toast.error(error instanceof Error ? error.message : 'Could not load users.');
			}
		} finally {
			if (seq === requestSeq.current) setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadUsers(filters, offset);
	}, [filters, offset, loadUsers]);

	// Debounce the search box so typing does not fire a request per keystroke.
	useEffect(() => {
		const timer = setTimeout(() => {
			setFilters(prev => (prev.search === searchInput ? prev : { ...prev, search: searchInput }));
			setOffset(0);
		}, 350);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const closeModal = () => {
		if (!actionLoading) setPendingUser(null);
	};

	const runAction = async (label: string, work: () => Promise<string>) => {
		setActionLoading(true);
		try {
			toast.success(await work());
			setPendingUser(null);
			await loadUsers(filters, offset);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : `Could not ${label}.`);
		} finally {
			setActionLoading(false);
		}
	};

	const handleReset = (clearFlashcards: boolean) => {
		const target = pendingUser;
		if (!target) return;
		void runAction('reset this learner', async () => {
			const result = await resetLearner(target.id, clearFlashcards);
			return `Reset ${displayName(target)}: cleared ${result.clearedLessons} lessons, ${result.clearedFlashcards} flashcards.`;
		});
	};

	const pageStart = total === 0 ? 0 : offset + 1;
	const pageEnd = Math.min(offset + PAGE_SIZE, total);

	return (
		<div className="space-y-4">
			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
					<Input
						value={searchInput}
						onChange={event => setSearchInput(event.target.value)}
						placeholder="Search by name or email"
						className="pl-9"
					/>
				</div>
				<Select
					value={filters.role}
					onValueChange={value => {
						setFilters(prev => ({ ...prev, role: value }));
						setOffset(0);
					}}
				>
					<SelectTrigger className="w-full sm:w-44">
						<SelectValue placeholder="Role" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All roles</SelectItem>
						<SelectItem value="admin">Admins</SelectItem>
						<SelectItem value="learner">Learners</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Users table */}
			<div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Career Track</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Progress</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading && users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
									Loading users...
								</TableCell>
							</TableRow>
						) : users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
									No users match these filters.
								</TableCell>
							</TableRow>
						) : (
							users.map(user => {
								const isAdmin = user.roleId === ADMIN_ROLE_ID;
								const isSelf = user.id === selfId;
								const resetBlocked = blockReason(user, selfId);

								return (
									<TableRow key={user.id}>
										<TableCell className="font-medium">
											{displayName(user)}
											{isSelf && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(you)</span>}
										</TableCell>
										<TableCell className="text-sm text-gray-600 dark:text-gray-400">{user.email}</TableCell>
										<TableCell>
											<Badge
												className={isAdmin ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}
											>
												{isAdmin ? 'Admin' : 'Learner'}
											</Badge>
										</TableCell>
										<TableCell className="text-sm">
											{user.jobRoleName ?? <span className="text-gray-400 dark:text-gray-500">—</span>}
										</TableCell>
										<TableCell>
											<Badge
												className={
													user.learningStatus === 'enrolled'
														? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
														: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
												}
											>
												{user.learningStatus === 'enrolled' ? 'Enrolled' : 'Not enrolled'}
											</Badge>
										</TableCell>
										<TableCell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
											{user.lessonsTotal > 0 || user.hasPlacementAnswers ? (
												<>
													{user.lessonsCompleted}/{user.lessonsTotal} lessons
													<span className="block text-xs text-gray-400 dark:text-gray-500">
														{user.topicQuizzesPassed} topic quiz
														{user.topicQuizzesPassed === 1 ? '' : 'zes'} passed
														{user.finalQuizStatus ? ` · final ${user.finalQuizStatus}` : ''}
													</span>
												</>
											) : (
												<span className="text-gray-400 dark:text-gray-500">Not started</span>
											)}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="outline"
												size="sm"
												disabled={Boolean(resetBlocked)}
												title={resetBlocked ?? `Reset learning progress for ${displayName(user)}`}
												onClick={() => setPendingUser(user)}
												className="text-xs h-8 px-2.5 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800"
											>
												<RotateCcw className="h-3.5 w-3.5 mr-1.5" />
												Reset learner
											</Button>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
				<span>
					{total === 0 ? 'No users' : `Showing ${pageStart}–${pageEnd} of ${total}`}
				</span>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={loading || offset === 0}
						onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
					>
						<ChevronLeft className="h-4 w-4 mr-1" />
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={loading || pageEnd >= total}
						onClick={() => setOffset(offset + PAGE_SIZE)}
					>
						Next
						<ChevronRight className="h-4 w-4 ml-1" />
					</Button>
				</div>
			</div>

			{pendingUser && (
				<ResetLearnerModal
					user={pendingUser}
					loading={actionLoading}
					onConfirm={handleReset}
					onClose={closeModal}
				/>
			)}
		</div>
	);
}
