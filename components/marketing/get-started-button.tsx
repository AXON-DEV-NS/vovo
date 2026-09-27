"use client";

import { Link } from "@/lib/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function GetStartedButton() {
  return (
    <Link href="/login?mode=signup">
      <Button size="lg" className="w-full sm:w-auto">
        Get Started
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}
