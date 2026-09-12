"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/cn";

type ContentStatus =
  | "IDEA"
  | "SCRIPT"
  | "GENERATING"
  | "READY_FOR_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "REJECTED";

interface ContentItem {
  id: string;
  title: string;
  status: ContentStatus;
  channelId: string;
  channelTitle: string;
  scheduledAt: string;
  scriptText: string;
  statusHistory: any[];
}

const getStatusColor = (status: ContentStatus) => {
  switch (status) {
    case "IDEA":
      return "bg-line text-ink-soft";
    case "SCRIPT":
      return "bg-blue-100 text-blue-800";
    case "GENERATING":
      return "bg-amber-100 text-amber-800";
    case "READY_FOR_REVIEW":
      return "bg-green-100 text-green-800 animate-pulse border border-green-300";
    case "SCHEDULED":
      return "bg-green-100 text-green-800";
    case "PUBLISHED":
      return "bg-green-500 text-paper-high";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-paper-low text-ink-soft";
  }
};

const getStatusBadgeVariant = (status: ContentStatus) => {
  switch (status) {
    case "IDEA":
      return "default";
    case "SCRIPT":
      return "info";
    case "GENERATING":
      return "warning";
    case "READY_FOR_REVIEW":
      return "brand";
    case "SCHEDULED":
      return "accent";
    case "PUBLISHED":
      return "success";
    case "REJECTED":
      return "error";
    default:
      return "default";
  }
};

export default function ContentCalendarPage() {
  const t = useTranslations("contentCalendar");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  
  // Channels and status filters mock
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate API delay

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      const MOCK_ITEMS: ContentItem[] = [
        {
          id: "1",
          title: "How AI is Changing YouTube in 2026",
          status: "PUBLISHED",
          channelId: "ch1",
          channelTitle: "Tech Insights",
          scheduledAt: new Date(year, month, 1).toISOString(),
          scriptText: "...",
          statusHistory: [],
        },
        {
          id: "2",
          title: "Top 10 AI Tools for Creators",
          status: "READY_FOR_REVIEW",
          channelId: "ch1",
          channelTitle: "Tech Insights",
          scheduledAt: new Date(year, month, 5).toISOString(),
          scriptText:
            "Hello and welcome back to Tech Insights! Today we're looking at the top 10 AI tools that every creator should be using right now.\n\nFirst up, let's talk about automated script generation...",
          statusHistory: [],
        },
        {
          id: "3",
          title: "The Future of Autonomous Agents",
          status: "SCRIPT",
          channelId: "ch1",
          channelTitle: "Tech Insights",
          scheduledAt: new Date(year, month, 10).toISOString(),
          scriptText: "...",
          statusHistory: [],
        },
        {
          id: "4",
          title: "كيف يغير الذكاء الاصطناعي المحتوى",
          status: "GENERATING",
          channelId: "ch2",
          channelTitle: "AI Daily",
          scheduledAt: new Date(year, month, 15).toISOString(),
          scriptText: "",
          statusHistory: [],
        },
        {
          id: "5",
          title: "Building a 100K Channel with AI Automation",
          status: "SCHEDULED",
          channelId: "ch1",
          channelTitle: "Tech Insights",
          scheduledAt: new Date(year, month, 20).toISOString(),
          scriptText: "...",
          statusHistory: [],
        },
        {
          id: "6",
          title: "AI vs Human Content: The Truth",
          status: "IDEA",
          channelId: "ch2",
          channelTitle: "AI Daily",
          scheduledAt: new Date(year, month, 25).toISOString(),
          scriptText: "",
          statusHistory: [],
        },
      ];
      setItems(MOCK_ITEMS);
      setLoading(false);
    };
    fetchItems();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAction = async (action: "approve" | "reject" | "request_changes") => {
    if (!selectedItem) return;

    try {
      // Mocking fetch call
      await fetch(`/api/content/${selectedItem.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });

      // Write rejected/changed work into the niche's Mistake Log so the
      // agent checks against it before producing future content.
      if (action === "reject" || action === "request_changes") {
        const channelNiches: Record<string, string> = {
          "Tech Insights": "technology",
          "AI Daily": "technology",
        };
        try {
          await fetch("/api/niche/mistake", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              niche: channelNiches[selectedItem.channelTitle] ?? "general",
              channelId: selectedItem.channelId,
              title: `${action === "reject" ? "Rejected" : "Changes requested"}: ${selectedItem.title}`,
              description: `The AI's draft "${selectedItem.title}" for "${selectedItem.channelTitle}" was ${action === "reject" ? "rejected" : "sent back for changes"} during client review.`,
              correction:
                comment ||
                "Rework this content following the client's review feedback.",
            }),
          });
        } catch {
          // Mistake logging is best-effort — never block the review action.
        }
      }

      setToastMessage(t("actions.success"));
      setModalOpen(false);

      // Optimistic update
      const newStatus: ContentStatus =
        action === "approve"
          ? "SCHEDULED"
          : action === "reject"
          ? "REJECTED"
          : "SCRIPT";

      setItems(
        items.map((item) =>
          item.id === selectedItem.id ? { ...item, status: newStatus } : item
        )
      );
      setComment("");

      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      setToastMessage(t("actions.error"));
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0-6
    const numDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= numDays; i++) days.push(new Date(year, month, i));

    return days;
  }, [currentDate]);

  const filteredItems = items.filter((item) => {
    if (selectedChannel !== "all" && item.channelId !== selectedChannel)
      return false;
    if (selectedStatus !== "all" && item.status !== selectedStatus)
      return false;
    return true;
  });

  const getItemsForDate = (date: Date) => {
    return filteredItems.filter((item) => {
      const itemDate = new Date(item.scheduledAt);
      return (
        itemDate.getFullYear() === date.getFullYear() &&
        itemDate.getMonth() === date.getMonth() &&
        itemDate.getDate() === date.getDate()
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
          <p className="text-ink-mute">{t("description")}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-line bg-paper-high p-1">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-sm font-medium text-ink" suppressHydrationWarning>
              {currentDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <Button variant="ghost" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-paper-low pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Tabs defaultValue="month" className="w-[200px]">
                <TabsList>
                  <TabsTrigger value="month">{t("views.month")}</TabsTrigger>
                  <TabsTrigger value="week">{t("views.week")}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-paper-high px-3 py-1.5 text-sm text-ink-soft">
                <Filter className="h-4 w-4" />
                <select
                  className="bg-transparent focus:outline-none"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                >
                  <option value="all">{t("filters.allChannels")}</option>
                  <option value="ch1">Tech Insights</option>
                  <option value="ch2">AI Daily</option>
                </select>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-paper-high px-3 py-1.5 text-sm text-ink-soft">
                <select
                  className="bg-transparent focus:outline-none"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">{t("filters.allStatuses")}</option>
                  <option value="IDEA">{t("statuses.IDEA")}</option>
                  <option value="READY_FOR_REVIEW">
                    {t("statuses.READY_FOR_REVIEW")}
                  </option>
                  <option value="PUBLISHED">{t("statuses.PUBLISHED")}</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b border-paper-low">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-ink-mute"
              >
                {t(`days.${day.toLowerCase()}`)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[120px]">
            {loading ? (
              <div className="col-span-7 flex h-[480px] items-center justify-center">
                <p className="text-ink-faint">{t("loading")}</p>
              </div>
            ) : (
              daysInMonth.map((date, i) => (
                <div
                  key={i}
                  className={cn(
                    "min-h-[120px] border-b border-r border-paper-low p-2 transition-colors",
                    date
                      ? "hover:bg-paper"
                      : "bg-paper/50"
                  )}
                >
                  {date && (
                    <>
                      <div
                        className={cn(
                          "mb-2 text-right text-sm",
                          date.toDateString() === new Date().toDateString()
                            ? "font-bold text-green-600"
                            : "text-ink-mute"
                        )}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1.5">
                        {getItemsForDate(date).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedItem(item);
                              setModalOpen(true);
                            }}
                            className={cn(
                              "cursor-pointer truncate rounded-md px-2 py-1 text-xs font-medium transition-transform hover:scale-[1.02]",
                              getStatusColor(item.status)
                            )}
                            title={item.title}
                          >
                            {item.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Item Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedItem(null);
          setComment("");
        }}
        title={selectedItem?.title}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6 mt-4">
            <div className="flex items-center gap-4">
              <Badge variant={getStatusBadgeVariant(selectedItem.status)}>
                {t(`statuses.${selectedItem.status}`)}
              </Badge>
              <span className="text-sm text-ink-mute" suppressHydrationWarning>
                {t("modal.scheduledFor")}:{" "}
                {new Date(selectedItem.scheduledAt).toLocaleDateString("en-US")}
              </span>
              <span className="text-sm text-ink-mute">
                {t("modal.channel")}: {selectedItem.channelTitle}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-ink">
                {t("modal.script")}
              </h3>
              <div className="max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-paper p-4 font-mono text-sm text-ink-soft">
                {selectedItem.scriptText || t("modal.noScript")}
              </div>
            </div>

            {selectedItem.status === "READY_FOR_REVIEW" && (
              <div className="space-y-4 rounded-xl border border-line p-4 bg-paper-high">
                <h3 className="text-sm font-semibold text-ink">
                  {t("modal.reviewActions")}
                </h3>
                <textarea
                  className="w-full rounded-lg border border-line p-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder={t("modal.commentPlaceholder")}
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    className="bg-green-500 hover:bg-green-600 text-paper-high"
                    onClick={() => handleAction("approve")}
                  >
                    {t("actions.approve")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleAction("request_changes")}
                  >
                    {t("actions.requestChanges")}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleAction("reject")}
                  >
                    {t("actions.reject")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-ink px-4 py-3 text-sm font-medium text-paper-high shadow-soft-xl animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
