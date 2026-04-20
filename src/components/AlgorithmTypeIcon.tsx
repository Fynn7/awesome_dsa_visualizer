import {
  AlignEndHorizontal,
  PackageSearch,
  SquaresUnite,
  type LucideIcon,
} from "lucide-react";
import type { AlgorithmIconKey } from "../lib/algorithmSpecs";

type Props = {
  iconKey: AlgorithmIconKey;
};

function assertNever(value: never): never {
  throw new Error(`Unhandled algorithm icon key: ${String(value)}`);
}

function resolveIcon(iconKey: AlgorithmIconKey): LucideIcon {
  switch (iconKey) {
    case "sort":
      return AlignEndHorizontal;
    case "quickUnion":
    case "quickUnionFull":
      return SquaresUnite;
    case "quickFind":
    case "quickFindFull":
      return PackageSearch;
    default:
      return assertNever(iconKey);
  }
}

export function AlgorithmTypeIcon({ iconKey }: Props) {
  const className = `command-palette-row-type-icon${
    iconKey.endsWith("Full") ? " command-palette-row-type-icon--accent" : ""
  }`;
  const Icon = resolveIcon(iconKey);

  return (
    <span className={className} aria-hidden>
      <Icon size={15} strokeWidth={2} />
    </span>
  );
}
