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
  type WheelEvent as ReactWheelEvent,
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

type ViewTransform = { k: number; x: number; y: number };

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

function clampZoom(k: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));
}

function toSvgTransform({ k, x, y }: ViewTransform) {
  return `translate(${x} ${y}) scale(${k})`;
}

/** Mantém o ponto (mx, my) fixo ao mudar a escala de k para nextK. */
function zoomAtPoint(
  current: ViewTransform,
  nextK: number,
  mx: number,
  my: number,
): ViewTransform {
  const k = clampZoom(nextK);
  const ratio = k / current.k;
  return {
    k,
    x: mx - (mx - current.x) * ratio,
    y: my - (my - current.y) * ratio,
  };
}

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
  const svgRef = useRef<SVGSVGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ width: 320, height: 360 });
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const transformRef = useRef<ViewTransform>({ k: 1, x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    featureId: string | null;
    featureName: string | null;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const pinchRef = useRef<{
    startDistance: number;
    origin: ViewTransform;
    originMid: { x: number; y: number };
  } | null>(null);

  const applyTransform = useCallback((next: ViewTransform) => {
    transformRef.current = next;
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      if (layerRef.current) {
        layerRef.current.setAttribute(
          "transform",
          toSvgTransform(transformRef.current),
        );
      }
    });
  }, []);

  const commitTransform = useCallback((next: ViewTransform) => {
    transformRef.current = next;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (layerRef.current) {
      layerRef.current.setAttribute("transform", toSvgTransform(next));
    }
  }, []);

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
    commitTransform({ k: 1, x: 0, y: 0 });
  }, [geography, commitTransform]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

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

  const pointInSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: size.width / 2, y: size.height / 2 };
    const rect = svg.getBoundingClientRect();
    const sx = size.width / Math.max(1, rect.width);
    const sy = size.height / Math.max(1, rect.height);
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    };
  };

  const zoomByAt = useCallback(
    (factor: number, clientX?: number, clientY?: number) => {
      const current = transformRef.current;
      const center =
        clientX != null && clientY != null
          ? pointInSvg(clientX, clientY)
          : { x: size.width / 2, y: size.height / 2 };
      commitTransform(zoomAtPoint(current, current.k * factor, center.x, center.y));
    },
    [commitTransform, size.height, size.width],
  );

  const resetView = useCallback(() => {
    commitTransform({ k: 1, x: 0, y: 0 });
  }, [commitTransform]);

  const onWheel = useCallback(
    (event: ReactWheelEvent<SVGSVGElement>) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      zoomByAt(factor, event.clientX, event.clientY);
    },
    [zoomByAt],
  );

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === "touch" && pinchRef.current) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const current = transformRef.current;
    const target = event.target as SVGElement | null;
    const featureId = target?.getAttribute?.("data-feature-id");
    const featureName = target?.getAttribute?.("data-feature-name");
    suppressClickRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
      moved: false,
      featureId,
      featureName,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const distance = Math.abs(dx) + Math.abs(dy);

    // Só começa a arrastar depois do limiar — evita engolir tap/clique
    if (!drag.moved && distance <= 8) return;

    if (!drag.moved) {
      drag.moved = true;
      suppressClickRef.current = true;
    }

    event.preventDefault();

    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const sx = rect ? size.width / Math.max(1, rect.width) : 1;
    const sy = rect ? size.height / Math.max(1, rect.height) : 1;

    applyTransform({
      k: transformRef.current.k,
      x: drag.originX + dx * sx,
      y: drag.originY + dy * sy,
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

    const drag = dragRef.current;
    if (layerRef.current) {
      layerRef.current.setAttribute(
        "transform",
        toSvgTransform(transformRef.current),
      );
    }

    // Tap/clique: seleciona o município/estado sem depender do evento click
    if (drag && !drag.moved && drag.featureId) {
      onFeatureClick(drag.featureId, drag.featureName ?? drag.featureId);
    }

    dragRef.current = null;
  };

  const touchDistance = (touches: ReactTouchEvent["touches"]) => {
    if (touches.length < 2) return 0;
    const a = touches[0];
    const b = touches[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const touchMidpoint = (touches: ReactTouchEvent["touches"]) => {
    const a = touches[0];
    const b = touches[1];
    return {
      clientX: (a.clientX + b.clientX) / 2,
      clientY: (a.clientY + b.clientY) / 2,
    };
  };

  const onTouchStart = (event: ReactTouchEvent<SVGSVGElement>) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      dragRef.current = null;
      const mid = touchMidpoint(event.touches);
      pinchRef.current = {
        startDistance: touchDistance(event.touches),
        origin: { ...transformRef.current },
        originMid: pointInSvg(mid.clientX, mid.clientY),
      };
    }
  };

  const onTouchMove = (event: ReactTouchEvent<SVGSVGElement>) => {
    if (event.touches.length === 2 && pinchRef.current) {
      event.preventDefault();
      const pinch = pinchRef.current;
      if (pinch.startDistance <= 0) return;
      const distance = touchDistance(event.touches);
      const mid = touchMidpoint(event.touches);
      const currentMid = pointInSvg(mid.clientX, mid.clientY);
      const nextK = clampZoom(
        pinch.origin.k * (distance / pinch.startDistance),
      );
      const zoomed = zoomAtPoint(
        pinch.origin,
        nextK,
        pinch.originMid.x,
        pinch.originMid.y,
      );
      applyTransform({
        k: zoomed.k,
        x: zoomed.x + (currentMid.x - pinch.originMid.x),
        y: zoomed.y + (currentMid.y - pinch.originMid.y),
      });
      return;
    }
    // Só bloqueia scroll depois do limiar de arraste
    if (dragRef.current?.moved) event.preventDefault();
  };

  const onTouchEnd = (event: ReactTouchEvent<SVGSVGElement>) => {
    if (event.touches.length < 2) {
      pinchRef.current = null;
      if (layerRef.current) {
        layerRef.current.setAttribute(
          "transform",
          toSvgTransform(transformRef.current),
        );
      }
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
        ref={svgRef}
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        role="img"
        aria-label={
          mode === "states"
            ? "Mapa dos estados do Brasil"
            : "Mapa dos municípios"
        }
        className="absolute inset-0 block h-full w-full max-w-full cursor-grab touch-none active:cursor-grabbing"
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
        <g ref={layerRef} transform="translate(0 0) scale(1)">
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
                data-feature-id={codigo}
                data-feature-name={name}
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
                onClick={(event) => {
                  // Clique residual do browser — ignora se foi arraste
                  // ou se o pointerup já tratou a seleção
                  event.preventDefault();
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
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
          onClick={() => zoomByAt(1.25)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-9 w-9 shadow"
          aria-label="Diminuir zoom"
          onClick={() => zoomByAt(0.8)}
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
