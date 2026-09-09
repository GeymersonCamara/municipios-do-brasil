"use client";

import { geoMercator, geoPath } from "d3-geo";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { BrazilGeoJSON } from "@/lib/ibge-geo";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type TooltipState = {
  x: number;
  y: number;
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
  const [size, setSize] = useState({ width: 800, height: 640 });
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: Math.max(320, Math.floor(entry.contentRect.width)),
        height: Math.max(360, Math.floor(entry.contentRect.height)),
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setTransform({ k: 1, x: 0, y: 0 });
  }, [geography]);

  const pathGenerator = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
        [16, 16],
        [size.width - 16, size.height - 16],
      ],
      geography,
    );
    return geoPath(projection);
  }, [geography, size.height, size.width]);

  const onWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      k: Math.min(8, Math.max(1, prev.k * delta)),
    }));
  }, []);

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    setTransform({
      k: transform.k,
      x: drag.originX + dx,
      y: drag.originY + dy,
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full min-h-[360px] w-full overflow-hidden rounded-xl border bg-[#f7f4ef]",
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
        className="touch-none cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          onPointerUp();
          setTooltip(null);
        }}
      >
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
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
                onMouseEnter={(event) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    label: name,
                    visited: visitado,
                    hasPhoto,
                  });
                }}
                onMouseMove={(event) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
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

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[200px] rounded-md bg-foreground px-2 py-1 text-xs text-background shadow"
          style={{
            left: Math.min(tooltip.x + 28, size.width - 200),
            top: Math.min(tooltip.y + 40, size.height - 48),
          }}
        >
          <span className="font-medium">{tooltip.label}</span>
          {mode === "municipalities" && (
            <span className="ml-2 opacity-80">
              {tooltip.visited
                ? tooltip.hasPhoto
                  ? "Visitado · com foto"
                  : "Visitado"
                : "Não visitado"}
            </span>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-background/85 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
        {geography.features.length}{" "}
        {mode === "municipalities" ? "municípios" : "estados"}
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-background/85 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
        Scroll · arraste
      </div>
    </div>
  );
}

export function BrazilMapSkeleton() {
  return (
    <div className="relative flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-3 rounded-xl border bg-[#f7f4ef] p-6">
      <Skeleton className="h-[70%] w-[80%] rounded-lg" />
      <p className="text-sm text-muted-foreground">Carregando malha do mapa…</p>
    </div>
  );
}
