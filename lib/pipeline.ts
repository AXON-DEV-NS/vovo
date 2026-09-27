import {
  Link2,
  Compass,
  Radar,
  Wand2,
  SlidersHorizontal,
  Rocket,
  ShieldCheck,
  Moon,
  type LucideIcon,
} from "lucide-react";

/**
 * The REAL production cycle — an endless loop for creating videos:
 *   1. Connect channel → 2. Identify content → 3. Research
 *   4. Start production → 5. Verify & optimize → 6. Publish
 *   7. Post-publish check → 8. While you rest → (back to 1, forever)
 */

export interface PipelineStage {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** rgb triplet for canvas usage */
  rgb: string;
}

export const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "connect",
    label: "Connect channel",
    description: "Securely connect your YouTube channel with limited, explicit permissions",
    icon: Link2,
    rgb: "27, 25, 21",
  },
  {
    id: "identify",
    label: "Identify content",
    description: "Define the channel's niche and target audience",
    icon: Compass,
    rgb: "51, 84, 51",
  },
  {
    id: "research",
    label: "Research",
    description: "Scan the market, competitors, and discover emerging trends",
    icon: Radar,
    rgb: "192, 133, 31",
  },
  {
    id: "produce",
    label: "Start production",
    description: "Write the script and produce the video and thumbnail",
    icon: Wand2,
    rgb: "51, 84, 51",
  },
  {
    id: "optimize",
    label: "Verify & optimize",
    description: "Review and optimize the production before publishing",
    icon: SlidersHorizontal,
    rgb: "192, 133, 31",
  },
  {
    id: "publish",
    label: "Publish",
    description: "Publish the video to the channel and run the initial checks",
    icon: Rocket,
    rgb: "27, 25, 21",
  },
  {
    id: "postcheck",
    label: "Post-publish check",
    description: "Monitor errors, audience sentiment, and video engagement",
    icon: ShieldCheck,
    rgb: "51, 84, 51",
  },
  {
    id: "rest",
    label: "While you rest",
    description:
      "Everything runs automatically while you sleep or rest — all you do is connect your channel, we handle the rest",
    icon: Moon,
    rgb: "192, 133, 31",
  },
];

export const PIPELINE_COUNT = PIPELINE_STAGES.length;
export const PIPELINE_STEP = (Math.PI * 2) / PIPELINE_COUNT;
