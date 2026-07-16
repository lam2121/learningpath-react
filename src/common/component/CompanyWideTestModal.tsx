import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/component/ui/dialog";
import { Button } from "@/shadcn/component/ui/button";
import { Input } from "@/shadcn/component/ui/input";
import { Label } from "@/shadcn/component/ui/label";
import {
  ClipboardCheck,
  UserCircle,
  Loader2,
  RotateCcw,
  PlayCircle,
} from "lucide-react";
import { axiosBase, axiosJWT } from "@/common/lib/axios";
import { isAxiosError } from "axios";
import { useAuth } from "@/common/context/AuthContext";
import { saveUserSession } from "@/feature/auth/helper/authHelper";

interface CompanyWideTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  user?: { username: string; email: string; role?: string } | null;
}

export function CompanyWideTestModal({
  isOpen,
  onClose,
  isAuthenticated,
  user,
}: CompanyWideTestModalProps) {
  const navigate = useNavigate();
  const auth = useAuth();

  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  const isValidGuestEmail = (email: string) => email.includes("@");

  const isValidGuestPhone = (phone: string) => {
    const normalizedPhone = phone.replace(/\s+/g, "");
    return /^(0\d{9}|\+84\d{9})$/.test(normalizedPhone);
  };

  const isEmployee = isAuthenticated && user?.role !== "guest";

  useEffect(() => {
    if (!isOpen || !isAuthenticated) {
      setHasActiveSession(false);
      return;
    }

    const checkSession = async () => {
      setIsCheckingSession(true);
      try {
        const res = await axiosJWT.get(
          "tests/random-tests/active/session/check",
        );
        setHasActiveSession(res.data.has_session);
      } catch {
        setHasActiveSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [isOpen, isAuthenticated]);

  const handleConfirm = async () => {
    setError("");
    if (isEmployee) {
      onClose();
      navigate({ to: "/company-wide-test/exam" });
    } else {
      const trimmedName = guestInfo.name.trim();
      const trimmedEmail = guestInfo.email.trim();
      const normalizedPhone = guestInfo.phone.trim().replace(/\s+/g, "");

      if (!trimmedName || !trimmedEmail || !normalizedPhone) {
        setError("Vui lòng điền đầy đủ thông tin để bắt đầu bài test.");
        return;
      }

      if (!isValidGuestEmail(trimmedEmail)) {
        setError("Email phải chứa ký tự @.");
        return;
      }

      if (!isValidGuestPhone(normalizedPhone)) {
        setError(
          "Số điện thoại không hợp lệ. Vui lòng nhập dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.",
        );
        return;
      }

      setIsLoading(true);
      try {
        const response = await axiosBase.post("/auth/guest/login", {
          name: trimmedName,
          email: trimmedEmail,
          phone: normalizedPhone,
        });
        saveUserSession(response.data);
        await auth.refreshAuth();
        onClose();
        navigate({ to: "/company-wide-test/exam" });
      } catch (err) {
        if (isAxiosError(err)) {
          const errorMsg =
            err.response?.data?.detail?.message ||
            err.response?.data?.detail ||
            "Lỗi hệ thống. Vui lòng thử lại!";
          setError(
            typeof errorMsg === "string" ? errorMsg : "Lỗi không xác định",
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Lỗi kết nối hoặc lỗi không xác định.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleContinue = () => {
    onClose();
    navigate({ to: "/company-wide-test/exam" });
  };

  // ✅ Xóa session server rồi mới cho làm mới
  const handleNewSession = async () => {
    try {
      await axiosJWT.delete("tests/random-tests/active/session");
    } catch {
      // Bỏ qua lỗi, vẫn cho tiếp tục
    }
    setHasActiveSession(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={!isLoading ? onClose : undefined}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-sidebar-primary/5 p-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-sidebar-primary rounded-lg text-white">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-sidebar-primary uppercase tracking-tight">
                {isEmployee
                  ? "Internal TOEIC Assessment"
                  : "Intern Entrance Test"}
              </DialogTitle>
            </div>
            {isEmployee && (
              <DialogDescription className="text-base text-gray-600">
                Bài kiểm tra năng lực định kỳ dành cho nhân viên TMA.
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        <div className="px-8 py-4 space-y-4">
          {isCheckingSession ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : hasActiveSession ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 border border-orange-200 bg-orange-50 rounded-xl">
                <RotateCcw className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-700">
                    Bạn có bài thi chưa hoàn thành!
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    Tiếp tục từ lúc bạn dừng lại, thời gian và đáp án sẽ được
                    khôi phục.
                  </p>
                </div>
              </div>
            </div>
          ) : isEmployee ? (
            <div className="flex items-center gap-4 p-4 border rounded-xl bg-gray-50/50">
              <UserCircle className="w-10 h-10 text-primary shrink-0" />
              <div>
                <p className="font-medium">{user?.username}</p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sidebar-primary font-semibold">
                <UserCircle className="w-5 h-5" />
                <span>Thông tin ứng viên</span>
              </div>
              <div className="grid gap-4 pl-1">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Họ và tên
                  </Label>
                  <Input
                    id="name"
                    placeholder="Nhập họ và tên đầy đủ"
                    className="focus-visible:ring-sidebar-primary"
                    disabled={isLoading}
                    onChange={(e) =>
                      setGuestInfo({ ...guestInfo, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@gmail.com"
                      disabled={isLoading}
                      onChange={(e) =>
                        setGuestInfo({ ...guestInfo, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      placeholder="09xx xxx xxx"
                      disabled={isLoading}
                      onChange={(e) =>
                        setGuestInfo({ ...guestInfo, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
              * {error}
            </p>
          )}
        </div>

        <DialogFooter className="px-8 py-6 bg-gray-50 border-t gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="hover:bg-gray-200"
            disabled={isLoading || isCheckingSession}
          >
            Hủy bỏ
          </Button>

          {hasActiveSession ? (
            <>
              <Button
                variant="outline"
                onClick={handleNewSession}
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                Làm bài mới
              </Button>
              <Button
                onClick={handleContinue}
                className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-white px-8"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Tiếp tục
              </Button>
            </>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={isLoading || isCheckingSession}
              className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-white px-8 shadow-lg shadow-sidebar-primary/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Bắt đầu làm bài"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
