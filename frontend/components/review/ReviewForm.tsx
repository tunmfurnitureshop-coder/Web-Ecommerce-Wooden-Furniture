"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { RatingStars } from "./RatingStars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const t = useTranslations("reviews");
  const { customerFetch } = useCustomerAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setErrorMsg(t("form.ratingRequired")); return; }

    setSubmitting(true);
    setErrorMsg("");
    try {
      await customerFetch(`/api/v1/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, title: title || undefined, content: content || undefined }),
      });
      setSuccessMsg(t("form.success"));
      setRating(0);
      setTitle("");
      setContent("");
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("ALREADY_REVIEWED")) {
        setErrorMsg(t("alreadyReviewed"));
      } else if (msg.includes("NOT_ELIGIBLE") || (err as { status?: number })?.status === 403) {
        setErrorMsg(t("notEligible"));
      } else {
        setErrorMsg(t("form.error"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (successMsg) {
    return <p className="text-sm text-primary bg-primary/10 rounded p-3">{successMsg}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-muted/20 rounded-lg border">
      <h3 className="font-medium text-sm">{t("form.submit")}</h3>

      <div className="space-y-1.5">
        <Label className="text-sm">{t("form.rating")}</Label>
        <RatingStars value={rating} onChange={setRating} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-title" className="text-sm">{t("form.title")}</Label>
        <Input
          id="review-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={t("form.titlePlaceholder")}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-content" className="text-sm">{t("form.content")}</Label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder={t("form.contentPlaceholder")}
        />
      </div>

      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

      <Button type="submit" disabled={submitting} size="sm">
        {submitting ? t("form.submitting") : t("form.submitLabel")}
      </Button>
    </form>
  );
}
