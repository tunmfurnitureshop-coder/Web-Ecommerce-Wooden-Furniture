import { api } from "@/lib/api";
import type { CampaignListResponse, CampaignDetailResponse } from "./campaign.types";

export async function listActiveCampaigns(
  locale: string,
  placement?: string
): Promise<CampaignListResponse> {
  const params = new URLSearchParams({ locale });
  if (placement) params.set("placement", placement);
  return api.get<CampaignListResponse>(`/api/v1/campaigns?${params}`);
}

export async function getCampaignBySlug(
  slug: string,
  locale: string
): Promise<CampaignDetailResponse> {
  return api.get<CampaignDetailResponse>(`/api/v1/campaigns/${slug}?locale=${locale}`);
}
