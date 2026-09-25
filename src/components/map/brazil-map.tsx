"use client";

import { geoMercator, geoPath } from "d3-geo";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import type { BrazilGeoJSON } from "@/lib/ibge-geo";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type TooltipState = {
  label: string;
  visited: boolean;
  hasPhoto: boolean;
} | null;

type BrazilMapProps = {
  geography: BrazilGeoJSON;
  mode: "states" | "municipalities";
  visitedSet: Set<string>;
  photoSet?: Set<string>;
  highlightCode?: string | null;
  onFeatureClick: (id: string, name: string) => void;
  className?: string;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

export function BrazilMap({
  geography,
  mode,
  visitedSet,
  photoSet,
  highlightCode,
  onFeatureClick,
  className,
}: BrazilMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 320, height: 360 });
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const transformRef = useRef(transform);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
  } | null>(null);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const width = Math.max(1, Math.floor(el.clientWidth));
      const height = Math.max(1, Math.floor(el.clientHeight));
      setSize({ width, height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setTransform({ k: 1, x: 0, y: 0 });
  }, [geography]);

  const pathGenerator = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [12, 12],
        [Math.max(24, size.width - 12), Math.max(24, size.height - 12)],
      ],
      geography,
    );
    return geoPath(projection);
  }, [geography, size.height, size.width]);

  const clampZoom = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

  const zoomBy = useCallback((factor: number) => {
    setTransform((prev) => ({
      ...prev,
      k: clampZoom(prev.k * factor),
    }));
  }, []);

  const resetView = useCallback(() => {
    setTransform({ k: 1, x: 0, y: 0 });
  }, []);

  const onWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      k: clampZoom(prev.k * delta),
    }));
  }, []);

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch" && pinchRef.current) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const current = transformRef.current;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    setTransform({
      k: transformRef.current.k,
      x: drag.originX + dx,
      y: drag.originY + dy,
    });
  };

  const onPointerUp = (event?: ReactPointerEvent<SVGSVGElement>) => {
    if (
      event &&
      dragRef.current &&
      dragRef.current.pointerId !== event.pointerId
    ) {
      return;
    }
    dragRef.current = null;
  };

  const touchDistance = (touches: ReactTouchEvent["touches"]) => {
    if (touches.length < 2) return 0;
    const a = touches[0];
    const b = touches[1];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.hypot(dx, dy);
  };

  const onTouchStart = (event: ReactTouchEvent<SVGSVGElement>) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      dragRef.current = null;
      pinchRef.current = {
        startDistance: touchDistance(event.touches),
        startScale: transformRef.current.k,
      };
    }
  };

  const onTouchMove = (event: ReactTouchEvent<SVGSVGElement>) => {
    if (event.touches.length === 2 && pinchRef.current) {
      event.preventDefault();
      const distance = touchDistance(event.touches);
      if (pinchRef.current.startDistance <= 0) return;
      const scale =
        pinchRef.current.startScale *
        (distance / pinchRef.current.startDistance);
      setTransform((prev) => ({
        ...prev,
        k: clampZoom(scale),
      }));
      return;
    }
    if (dragRef.current) {
      event.preventDefault();
    }
  };

  const onTouchEnd = (event: ReactTouchEvent<SVGSVGElement>) => {
    if (event.touches.length < 2) {
      pinchRef.current = null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative isolate h-[min(58vh,420px)] w-full max-w-full overflow-hidden rounded-xl border bg-[#f7f4ef] sm:h-full sm:min-h-[360px]",
        className,
      )}
    >
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label={
          mode === "states"
            ? "Mapa dos estados do Brasil"
            : "Mapa dos municípios"
        }
        className="absolute inset-0 block h-full w-full max-w-full touch-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onPointerLeave={() => {
          onPointerUp();
          setTooltip(null);
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <g
          transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}
        >
          {geography.features.map((feature, index) => {
            const codigo = String(
              mode === "states"
                ? (feature.properties?.stateCode ??
                    feature.id ??
                    feature.properties?.codarea ??
                    index)
                : (feature.properties?.codarea ?? feature.id ?? index),
            );
            const name = String(
              feature.properties?.name ??
                feature.properties?.stateCode ??
                codigo,
            );
            const visitado =
              mode === "municipalities" ? visitedSet.has(codigo) : false;
            const hasPhoto =
              mode === "municipalities" ? Boolean(photoSet?.has(codigo)) : false;
            const highlighted = highlightCode === codigo;
            const d = pathGenerator(feature) ?? undefined;

            let fill = mode === "states" ? "#9bb8a8" : "#e8f0ea";
            if (mode === "municipalities" && visitado) fill = "#0f7a4c";
            if (highlighted) fill = "#f0b429";

            return (
              <path
                key={codigo}
                d={d}
                tabIndex={0}
                role="button"
                aria-label={`${name}${visitado ? ", visitado" : ""}${hasPhoto ? ", com foto" : ""}`}
                fill={fill}
                stroke={hasPhoto ? "#b45309" : "#1c2a24"}
                strokeWidth={
                  hasPhoto ? 1.4 : mode === "municipalities" ? 0.7 : 0.5
                }
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer outline-none transition-[fill] duration-150 hover:fill-[#93c5fd] focus-visible:stroke-2 focus-visible:stroke-[#2f6b52]"
                onClick={() => {
                  if (dragRef.current?.moved) return;
                  onFeatureClick(codigo, name);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onFeatureClick(codigo, name);
                  }
                }}
                onMouseEnter={() => {
                  setTooltip({
                    label: name,
                    visited: visitado,
                    hasPhoto,
                  });
                }}
                onMouseMove={() => {
                  setTooltip({
                    label: name,
                    visited: visitado,
                    hasPhoto,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </g>
      </svg>

      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-9 w-9 shadow"
          aria-label="Aumentar zoom"
          onClick={() => zoomBy(1.25)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-9 w-9 shadow"
          aria-label="Diminuir zoom"
          onClick={() => zoomBy(0.8)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-9 w-9 shadow"
          aria-label="Resetar mapa"
          onClick={resetView}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {tooltip && (
        <div className="pointer-events-none absolute top-3 left-3 right-14 z-10 max-w-[220px] rounded-md bg-foreground/95 px-3 py-2 text-xs text-background shadow backdrop-blur sm:left-auto sm:right-14">
          <p className="font-medium leading-snug">{tooltip.label}</p>
          {mode === "municipalities" && (
            <p className="mt-0.5 opacity-80">
              {tooltip.visited
                ? tooltip.hasPhoto
                  ? "Visitado · com foto"
                  : "Visitado"
                : "Não visitado"}
            </p>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/85 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
        {geography.features.length}{" "}
        {mode === "municipalities" ? "municípios" : "estados"}
      </div>
    </div>
  );
}

export function BrazilMapSkeleton() {
  return (
    <div className="relative flex h-[min(58vh,420px)] w-full max-w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border bg-[#f7f4ef] p-4 sm:h-full sm:min-h-[360px] sm:p-6">
      <Skeleton className="h-[70%] w-[80%] rounded-lg" />
      <p className="text-sm text-muted-foreground">Carregando malha do mapa…</p>
    </div>
  );
}
