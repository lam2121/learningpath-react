import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Check,
    FlipHorizontal,
    ImagePlus,
    Loader2,
    Move,
    RefreshCw,
    RotateCcw,
    RotateCw,
    ZoomIn,
    ZoomOut,
} from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shadcn/component/ui/dialog";
import { Button } from "@/shadcn/component/ui/button";
import { Slider } from "@/shadcn/component/ui/slider";

export interface AvatarCropDialogProps {
    open: boolean;
    imageSrc: string | null;
    onOpenChange: (open: boolean) => void;
    onSave: (croppedDataUrl: string) => void;
    onSelectNewImage?: (file: File) => void;
}

export function AvatarCropDialog({
    open,
    imageSrc,
    onOpenChange,
    onSave,
    onSelectNewImage,
}: AvatarCropDialogProps) {
    const { t } = useTranslation("profile");

    // Interactive adjustment states
    const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
    const [zoom, setZoom] = useState<number>(1.0);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [rotation, setRotation] = useState<number>(0);
    const [flipH, setFlipH] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    // Viewport dimensions (CSS pixels)
    const viewportSize = 300;
    const cropDiameter = 240;
    const cropRadius = cropDiameter / 2;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    // Pointer drag refs
    const isPointerDownRef = useRef(false);
    const startPointRef = useRef({ x: 0, y: 0 });
    const startPanRef = useRef({ x: 0, y: 0 });

    // Touch pinch refs
    const initialPinchDistRef = useRef<number | null>(null);
    const initialPinchZoomRef = useRef<number>(1.0);

    // Load Image Object on imageSrc change
    useEffect(() => {
        if (!imageSrc) {
            setImgObj(null);
            return;
        }

        let isCancelled = false;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            if (isCancelled) return;
            setImgObj(img);
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
            setRotation(0);
            setFlipH(false);
        };
        img.onerror = () => {
            if (isCancelled) return;
            // Fallback without crossOrigin in case CORS restriction blocks image loading
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
                if (isCancelled) return;
                setImgObj(fallbackImg);
                setZoom(1.0);
                setPan({ x: 0, y: 0 });
                setRotation(0);
                setFlipH(false);
            };
            fallbackImg.src = imageSrc;
        };
        img.src = imageSrc;

        return () => {
            isCancelled = true;
        };
    }, [imageSrc]);

    // Reset transforms whenever dialog opens fresh
    useEffect(() => {
        if (open) {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
            setRotation(0);
            setFlipH(false);
        }
    }, [open]);

    // Calculate dimensions & bounds based on rotation
    const isRotated90or270 = rotation % 180 !== 0;
    const naturalW = imgObj ? (isRotated90or270 ? imgObj.naturalHeight : imgObj.naturalWidth) : 1;
    const naturalH = imgObj ? (isRotated90or270 ? imgObj.naturalWidth : imgObj.naturalHeight) : 1;

    // Minimum scale required so image always covers the crop circle
    const baseScale = Math.max(cropDiameter / naturalW, cropDiameter / naturalH);
    const currentScale = baseScale * zoom;

    const displayW = naturalW * currentScale;
    const displayH = naturalH * currentScale;

    // Maximum pan bounds to prevent blank gaps inside crop circle
    const maxPanX = Math.max(0, (displayW - cropDiameter) / 2);
    const maxPanY = Math.max(0, (displayH - cropDiameter) / 2);

    const clampPan = useCallback(
        (p: { x: number; y: number }) => ({
            x: Math.max(-maxPanX, Math.min(maxPanX, p.x)),
            y: Math.max(-maxPanY, Math.min(maxPanY, p.y)),
        }),
        [maxPanX, maxPanY]
    );

    // Clamp current pan whenever zoom or rotation changes
    useEffect(() => {
        setPan((prev) => clampPan(prev));
    }, [clampPan]);

    // Draw Live Previews to canvas
    const drawToCanvas = useCallback(
        (canvas: HTMLCanvasElement, targetSize: number) => {
            if (!imgObj) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.clearRect(0, 0, targetSize, targetSize);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            const k = targetSize / cropDiameter;

            ctx.save();
            ctx.translate(targetSize / 2, targetSize / 2);
            ctx.translate(pan.x * k, pan.y * k);
            ctx.rotate((rotation * Math.PI) / 180);
            if (flipH) {
                ctx.scale(-1, 1);
            }

            const drawW = imgObj.naturalWidth * baseScale * zoom * k;
            const drawH = imgObj.naturalHeight * baseScale * zoom * k;

            ctx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        },
        [imgObj, cropDiameter, pan.x, pan.y, rotation, flipH, baseScale, zoom]
    );


    // Pointer events for mouse & touch panning
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return; // Primary button only
        isPointerDownRef.current = true;
        setIsDragging(true);
        startPointRef.current = { x: e.clientX, y: e.clientY };
        startPanRef.current = { x: pan.x, y: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isPointerDownRef.current) return;
        const dx = e.clientX - startPointRef.current.x;
        const dy = e.clientY - startPointRef.current.y;
        setPan(
            clampPan({
                x: startPanRef.current.x + dx,
                y: startPanRef.current.y + dy,
            })
        );
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        isPointerDownRef.current = false;
        setIsDragging(false);
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            // Ignore capture release errors
        }
    };

    // Touch pinch-to-zoom
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialPinchDistRef.current = dist;
            initialPinchZoomRef.current = zoom;
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2 && initialPinchDistRef.current) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = dist / initialPinchDistRef.current;
            const newZoom = Math.min(3.5, Math.max(1.0, +(initialPinchZoomRef.current * factor).toFixed(2)));
            setZoom(newZoom);
        }
    };

    const handleTouchEnd = () => {
        initialPinchDistRef.current = null;
    };

    // Mouse wheel zoom
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        setZoom((prev) => Math.min(3.5, Math.max(1.0, +(prev + delta).toFixed(2))));
    };

    // Transform handlers
    const handleRotateCw = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    const handleRotateCcw = () => {
        setRotation((prev) => (prev - 90 + 360) % 360);
    };

    const handleFlipH = () => {
        setFlipH((prev) => !prev);
    };

    const handleReset = () => {
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
        setRotation(0);
        setFlipH(false);
    };

    // File replacement
    const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith("image/")) return;

        if (onSelectNewImage) {
            onSelectNewImage(file);
        } else {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === "string") {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => {
                        setImgObj(img);
                        setZoom(1.0);
                        setPan({ x: 0, y: 0 });
                        setRotation(0);
                        setFlipH(false);
                    };
                    img.src = reader.result;
                }
            };
            reader.readAsDataURL(file);
        }
        e.target.value = "";
    };

    // Apply & Save
    const handleApplyAndSave = () => {
        if (!imgObj) return;
        setIsSaving(true);

        try {
            const exportCanvas = document.createElement("canvas");
            exportCanvas.width = 512;
            exportCanvas.height = 512;
            drawToCanvas(exportCanvas, 512);

            // Export as crisp JPEG (0.92) to keep storage footprint light
            const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.92);
            onSave(dataUrl);
            onOpenChange(false);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md sm:max-w-lg overflow-hidden p-5 sm:p-6">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                            <Move className="h-4 w-4" />
                        </span>
                        {t("adjustAvatarTitle", { defaultValue: "Adjust & Crop Avatar" })}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {t("adjustAvatarDescription", {
                            defaultValue:
                                "Drag to reposition, adjust zoom or rotate before saving your profile picture.",
                        })}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-1">
                    {/* Crop Viewport & Live Preview Container */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
                        {/* Interactive Crop Viewport */}
                        <div
                            ref={viewportRef}
                            tabIndex={0}
                            role="region"
                            aria-label="Avatar crop viewport"
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerCancel={handlePointerUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onWheel={handleWheel}
                            style={{ width: `${viewportSize}px`, height: `${viewportSize}px` }}
                            className={`relative select-none overflow-hidden rounded-2xl bg-slate-950 shadow-inner touch-none ${
                                isDragging ? "cursor-grabbing" : "cursor-grab"
                            }`}
                        >
                            {/* Rendered source image with synchronized transforms */}
                            {imgObj && (
                                <img
                                    src={imgObj.src}
                                    alt="Crop source preview"
                                    draggable={false}
                                    style={{
                                        position: "absolute",
                                        left: "50%",
                                        top: "50%",
                                        transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) rotate(${rotation}deg) scale(${
                                            flipH ? -baseScale * zoom : baseScale * zoom
                                        }, ${baseScale * zoom})`,
                                        transformOrigin: "center center",
                                        maxWidth: "none",
                                        maxHeight: "none",
                                        userSelect: "none",
                                        pointerEvents: "none",
                                    }}
                                />
                            )}

                            {/* Circular Mask & HUD Guidelines */}
                            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                                <defs>
                                    <mask id="avatar-crop-mask">
                                        <rect width="100%" height="100%" fill="white" />
                                        <circle cx="50%" cy="50%" r={cropRadius} fill="black" />
                                    </mask>
                                </defs>

                                {/* Translucent dark scrim outside the crop circle */}
                                <rect
                                    width="100%"
                                    height="100%"
                                    fill="rgba(15, 23, 42, 0.68)"
                                    mask="url(#avatar-crop-mask)"
                                />

                                {/* Subtle Rule-of-Thirds Grid inside crop circle */}
                                <g clipPath="url(#avatar-circle-clip)">
                                    <clipPath id="avatar-circle-clip">
                                        <circle cx="50%" cy="50%" r={cropRadius} />
                                    </clipPath>
                                    <line
                                        x1={viewportSize / 2 - cropRadius}
                                        y1={viewportSize / 2 - cropRadius / 3}
                                        x2={viewportSize / 2 + cropRadius}
                                        y2={viewportSize / 2 - cropRadius / 3}
                                        stroke="rgba(255, 255, 255, 0.15)"
                                        strokeDasharray="3 3"
                                    />
                                    <line
                                        x1={viewportSize / 2 - cropRadius}
                                        y1={viewportSize / 2 + cropRadius / 3}
                                        x2={viewportSize / 2 + cropRadius}
                                        y2={viewportSize / 2 + cropRadius / 3}
                                        stroke="rgba(255, 255, 255, 0.15)"
                                        strokeDasharray="3 3"
                                    />
                                    <line
                                        x1={viewportSize / 2 - cropRadius / 3}
                                        y1={viewportSize / 2 - cropRadius}
                                        x2={viewportSize / 2 - cropRadius / 3}
                                        y2={viewportSize / 2 + cropRadius}
                                        stroke="rgba(255, 255, 255, 0.15)"
                                        strokeDasharray="3 3"
                                    />
                                    <line
                                        x1={viewportSize / 2 + cropRadius / 3}
                                        y1={viewportSize / 2 - cropRadius}
                                        x2={viewportSize / 2 + cropRadius / 3}
                                        y2={viewportSize / 2 + cropRadius}
                                        stroke="rgba(255, 255, 255, 0.15)"
                                        strokeDasharray="3 3"
                                    />
                                </g>

                                {/* Glowing primary avatar boundary ring */}
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r={cropRadius}
                                    fill="none"
                                    stroke="rgba(59, 130, 246, 0.85)"
                                    strokeWidth="2"
                                    className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                />
                                <circle
                                    cx="50%"
                                    cy="50%"
                                    r={cropRadius}
                                    fill="none"
                                    stroke="rgba(255, 255, 255, 0.4)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />

                                {/* Center crosshair indicator */}
                                <line
                                    x1={viewportSize / 2 - 6}
                                    y1={viewportSize / 2}
                                    x2={viewportSize / 2 + 6}
                                    y2={viewportSize / 2}
                                    stroke="rgba(255, 255, 255, 0.4)"
                                    strokeWidth="1"
                                />
                                <line
                                    x1={viewportSize / 2}
                                    y1={viewportSize / 2 - 6}
                                    x2={viewportSize / 2}
                                    y2={viewportSize / 2 + 6}
                                    stroke="rgba(255, 255, 255, 0.4)"
                                    strokeWidth="1"
                                />
                            </svg>

                            {/* Floating hint badge */}
                            <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/80 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-slate-300 backdrop-blur-xs">
                                {t("dragToReposition", {
                                    defaultValue: "Drag to reposition · Scroll to zoom",
                                })}
                            </div>
                        </div>

                        {/* Real-time Live Preview Column */}
                        <div className="flex flex-row items-center gap-4 sm:flex-col sm:items-center sm:justify-center sm:gap-3">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                {t("cropPreview", { defaultValue: "Live Preview" })}
                            </span>

                            {/* Profile View (72px) */}
                            <div className="flex flex-col items-center gap-1">
                                <div
                                    style={{ width: "72px", height: "72px" }}
                                    className="relative overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-blue-500/25 bg-slate-950 dark:border-slate-800"
                                >
                                    {imgObj && (
                                        <img
                                            src={imgObj.src}
                                            alt="Profile preview"
                                            draggable={false}
                                            style={{
                                                position: "absolute",
                                                left: "50%",
                                                top: "50%",
                                                transform: `translate(calc(-50% + ${pan.x * (72 / cropDiameter)}px), calc(-50% + ${pan.y * (72 / cropDiameter)}px)) rotate(${rotation}deg) scale(${
                                                    (flipH ? -baseScale * zoom : baseScale * zoom) * (72 / cropDiameter)
                                                }, ${(baseScale * zoom) * (72 / cropDiameter)})`,
                                                transformOrigin: "center center",
                                                maxWidth: "none",
                                                maxHeight: "none",
                                                userSelect: "none",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">Profile</span>
                            </div>

                            {/* Navbar View (36px) */}
                            <div className="flex flex-col items-center gap-1">
                                <div
                                    style={{ width: "36px", height: "36px" }}
                                    className="relative overflow-hidden rounded-full border border-white shadow-sm ring-1 ring-blue-500/20 bg-slate-950 dark:border-slate-800"
                                >
                                    {imgObj && (
                                        <img
                                            src={imgObj.src}
                                            alt="Navbar preview"
                                            draggable={false}
                                            style={{
                                                position: "absolute",
                                                left: "50%",
                                                top: "50%",
                                                transform: `translate(calc(-50% + ${pan.x * (36 / cropDiameter)}px), calc(-50% + ${pan.y * (36 / cropDiameter)}px)) rotate(${rotation}deg) scale(${
                                                    (flipH ? -baseScale * zoom : baseScale * zoom) * (36 / cropDiameter)
                                                }, ${(baseScale * zoom) * (36 / cropDiameter)})`,
                                                transformOrigin: "center center",
                                                maxWidth: "none",
                                                maxHeight: "none",
                                                userSelect: "none",
                                                pointerEvents: "none",
                                            }}
                                        />
                                    )}
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">Navbar</span>
                            </div>
                        </div>
                    </div>

                    {/* Zoom Slider Control */}
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-2.5 dark:bg-slate-900/60">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={zoom <= 1.0}
                            onClick={() => setZoom((prev) => Math.max(1.0, +(prev - 0.1).toFixed(2)))}
                            className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            aria-label="Zoom out"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>

                        <div className="flex-1">
                            <Slider
                                value={[zoom]}
                                min={1.0}
                                max={3.5}
                                step={0.05}
                                onValueChange={([val]) => setZoom(val)}
                                className="cursor-pointer"
                            />
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={zoom >= 3.5}
                            onClick={() => setZoom((prev) => Math.min(3.5, +(prev + 0.1).toFixed(2)))}
                            className="h-8 w-8 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            aria-label="Zoom in"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>

                        <span className="w-12 text-right font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {Math.round(zoom * 100)}%
                        </span>
                    </div>

                    {/* Transform Action Bar: Rotate, Flip, Reset */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRotateCcw}
                                className="h-8 gap-1.5 px-2 sm:px-2.5 text-xs font-medium"
                                title={t("rotateLeft", { defaultValue: "Rotate -90°" })}
                            >
                                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                                <span>-90°</span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRotateCw}
                                className="h-8 gap-1.5 px-2 sm:px-2.5 text-xs font-medium"
                                title={t("rotateRight", { defaultValue: "Rotate +90°" })}
                            >
                                <RotateCw className="h-3.5 w-3.5 text-slate-500" />
                                <span>+90°</span>
                            </Button>

                            <Button
                                type="button"
                                variant={flipH ? "secondary" : "outline"}
                                size="sm"
                                onClick={handleFlipH}
                                className={`h-8 gap-1.5 px-2 sm:px-2.5 text-xs font-medium ${
                                    flipH ? "border-blue-500 text-blue-600 dark:text-blue-400" : ""
                                }`}
                                title={t("flipHorizontal", { defaultValue: "Flip horizontal" })}
                            >
                                <FlipHorizontal className="h-3.5 w-3.5 text-slate-500" />
                                <span>{t("flipHorizontal", { defaultValue: "Flip" })}</span>
                            </Button>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="h-8 gap-1.5 px-2 sm:px-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            title={t("resetAdjustments", { defaultValue: "Reset adjustments" })}
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                            <span>{t("resetAdjustments", { defaultValue: "Reset" })}</span>
                        </Button>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                        className="gap-1.5 border-dashed border-blue-300 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                        <ImagePlus className="h-4 w-4" />
                        <span>{t("chooseDifferentPhoto", { defaultValue: "Change photo" })}</span>
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleNewFileChange}
                        className="hidden"
                    />

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                            className="text-xs sm:text-sm"
                        >
                            {t("cancel", { defaultValue: "Cancel" })}
                        </Button>

                        <Button
                            type="button"
                            onClick={handleApplyAndSave}
                            disabled={isSaving || !imgObj}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-xs sm:text-sm font-semibold"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>{t("savingAvatar", { defaultValue: "Saving..." })}</span>
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    <span>{t("applyAndSaveAvatar", { defaultValue: "Apply & Save Avatar" })}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
