// AgriEdge appearance rubric v1. These are provisional app grades, not AGMARK certification.
export function appearanceGrade(
  crop: string,
  label: string,
): "A" | "B" | "C" | null {
  const rubric: Record<string, Record<string, "A" | "B" | "C">> = {
    tomato: { Ripe: "A", Unripe: "B", Old: "B", Damaged: "C" },
    potato: { fresh: "A", rotten: "C" },
    rice: { entero: "A", tiza: "B", quebrado: "B", mancha: "C" },
    groundnut: { "without mold": "A", "with mold": "C" },
  };
  return rubric[crop]?.[label] || null;
}
