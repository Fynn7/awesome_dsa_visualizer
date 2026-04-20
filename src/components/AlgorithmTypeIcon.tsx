import { AlignEndHorizontal, PackageSearch, SquaresUnite } from "lucide-react";
import type { AlgorithmIconKey } from "../lib/algorithmSpecs";

type Props = {
  iconKey?: AlgorithmIconKey;
};

export function AlgorithmTypeIcon({ iconKey }: Props) {
  if (!iconKey) {
    return null;
  }

  if (iconKey === "sort") {
    return (
      <span className="command-palette-row-type-icon" aria-hidden>
        <AlignEndHorizontal size={15} strokeWidth={2} />
      </span>
    );
  }

  if (iconKey === "quickUnion" || iconKey === "quickUnionFull") {
    const className =
      iconKey === "quickUnionFull"
        ? "command-palette-row-type-icon command-palette-row-type-icon--accent"
        : "command-palette-row-type-icon";
    return (
      <span className={className} aria-hidden>
        <SquaresUnite size={15} strokeWidth={2} />
      </span>
    );
  }

  if (iconKey === "quickFind" || iconKey === "quickFindFull") {
    const className =
      iconKey === "quickFindFull"
        ? "command-palette-row-type-icon command-palette-row-type-icon--accent"
        : "command-palette-row-type-icon";
    return (
      <span className={className} aria-hidden>
        <PackageSearch size={15} strokeWidth={2} />
      </span>
    );
  }

  return null;
}
