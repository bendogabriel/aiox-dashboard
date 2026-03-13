/**
 * useCreativeDispatch — Hook for dispatching creative approvals/rejections
 * to AIOS agent squads via Engine API.
 *
 * Approved creatives → media-buy squad (ad-midas)
 * Rejected creatives → creative-studio squad (creative-director)
 * Batch submit → media-buy squad (media-buy-chief)
 */
import { useState, useCallback } from 'react';
import { engineApi } from '../services/api/engine';
import { engineAvailable } from '../lib/connection';
import {
  creativeVotesService,
  type DispatchStatus,
} from '../services/supabase/creative-votes';

export interface Creative {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  headline: string;
  primaryText: string;
  cta: string;
}

export interface CampaignConfig {
  product: string;
  sigla: string;
  dailyBudget: number;
  totalBudget: number;
  targeting: string;
  objective: string;
  startDate?: string;
  endDate?: string;
}

export interface UseCreativeDispatchReturn {
  dispatchApproval: (creative: Creative, galleryId: string) => Promise<void>;
  dispatchRejection: (creative: Creative, galleryId: string, notes: string) => Promise<void>;
  dispatchBatch: (creatives: Creative[], galleryId: string, config: CampaignConfig) => Promise<void>;
  dispatchStatus: Record<string, DispatchStatus>;
  isEngineOnline: boolean;
}

export function useCreativeDispatch(): UseCreativeDispatchReturn {
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, DispatchStatus>>({});
  const isEngineOnline = engineAvailable();

  const updateStatus = useCallback((creativeId: string, status: DispatchStatus) => {
    setDispatchStatus(prev => ({ ...prev, [creativeId]: status }));
  }, []);

  const dispatchApproval = useCallback(async (creative: Creative, galleryId: string) => {
    if (!isEngineOnline) return;

    updateStatus(creative.id, 'dispatching');
    await creativeVotesService.updateDispatchStatus(galleryId, creative.id, 'dispatching');

    try {
      const message = [
        'Publique este criativo aprovado no Meta Ads:',
        '',
        `**Criativo:** ${creative.id} — ${creative.title}`,
        `**Imagem:** ${creative.imageUrl}`,
        `**Headline:** ${creative.headline}`,
        `**Texto Primário:** ${creative.primaryText}`,
        `**CTA:** ${creative.cta}`,
        `**Categoria:** ${creative.category}`,
        '',
        'Config:',
        '- Objetivo: OUTCOME_SALES',
        '- Status inicial: PAUSED (aguardar aprovação humana final)',
        '',
        'Use meta-ads-ops.mjs para: upload-image → create-creative → create-ad.',
        'Retorne o ad_id e preview_link criados.',
      ].join('\n');

      const result = await engineApi.triggerSquad('media-buy', {
        message,
        agentId: 'ad-midas',
      });

      updateStatus(creative.id, 'executing');
      await creativeVotesService.updateDispatchStatus(
        galleryId, creative.id, 'executing', result.job_id,
      );

      // Poll for completion (simple polling — SSE integration is future enhancement)
      pollJobStatus(result.job_id, creative.id, galleryId);
    } catch (err) {
      console.error('[Dispatch] Approval failed:', err);
      updateStatus(creative.id, 'failed');
      await creativeVotesService.updateDispatchStatus(galleryId, creative.id, 'failed');
    }
  }, [isEngineOnline, updateStatus]);

  const dispatchRejection = useCallback(async (
    creative: Creative,
    galleryId: string,
    notes: string,
  ) => {
    if (!isEngineOnline) return;

    updateStatus(creative.id, 'dispatching');
    await creativeVotesService.updateDispatchStatus(galleryId, creative.id, 'dispatching');

    try {
      const message = [
        'Criativo rejeitado — criar revisão:',
        '',
        `**Criativo:** ${creative.id} — ${creative.title}`,
        `**Categoria:** ${creative.category}`,
        `**Motivo da rejeição:** ${notes}`,
        `**Imagem original:** ${creative.imageUrl}`,
        `**Copy original:** ${creative.primaryText}`,
        '',
        'Crie uma variação corrigida baseada no feedback.',
        'Se necessário, gere nova imagem com fal-ai.',
        'Atualize a galeria com a versão revisada.',
      ].join('\n');

      const result = await engineApi.triggerSquad('creative-studio', {
        message,
        agentId: 'creative-director',
      });

      updateStatus(creative.id, 'executing');
      await creativeVotesService.updateDispatchStatus(
        galleryId, creative.id, 'executing', result.job_id,
      );

      pollJobStatus(result.job_id, creative.id, galleryId);
    } catch (err) {
      console.error('[Dispatch] Rejection failed:', err);
      updateStatus(creative.id, 'failed');
      await creativeVotesService.updateDispatchStatus(galleryId, creative.id, 'failed');
    }
  }, [isEngineOnline, updateStatus]);

  const dispatchBatch = useCallback(async (
    creatives: Creative[],
    galleryId: string,
    config: CampaignConfig,
  ) => {
    if (!isEngineOnline || creatives.length === 0) return;

    // Mark all as dispatching
    for (const c of creatives) {
      updateStatus(c.id, 'dispatching');
      await creativeVotesService.updateDispatchStatus(galleryId, c.id, 'dispatching');
    }

    try {
      const manifest = creatives.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        imageUrl: c.imageUrl,
        headline: c.headline,
        primaryText: c.primaryText,
        cta: c.cta,
      }));

      const message = [
        `Campanha completa para publicação — ${creatives.length} criativos aprovados:`,
        '',
        `**Produto:** ${config.product} (${config.sigla})`,
        `**Budget total:** R$ ${config.totalBudget}`,
        `**Objetivo:** ${config.objective}`,
        config.startDate ? `**Schedule:** ${config.startDate} → ${config.endDate || 'ongoing'}` : '',
        `**Público:** ${config.targeting}`,
        '',
        '**Criativos aprovados:**',
        '```json',
        JSON.stringify(manifest, null, 2),
        '```',
        '',
        'Fluxo:',
        '1. Criar campanha: meta-ads-ops.mjs create-campaign',
        '2. Para cada criativo: upload-image → create-creative → create-ad',
        '3. Criar adset(s) com budget distribuído',
        '4. Status: PAUSED (aguardar ativação manual)',
        '5. Retornar: campaign_id, ad_ids[], preview_links[]',
      ].filter(Boolean).join('\n');

      const result = await engineApi.triggerSquad('media-buy', {
        message,
        agentId: 'media-buy-chief',
      });

      for (const c of creatives) {
        updateStatus(c.id, 'executing');
        await creativeVotesService.updateDispatchStatus(
          galleryId, c.id, 'executing', result.job_id,
        );
      }

      // Poll for batch completion
      pollBatchJobStatus(result.job_id, creatives.map(c => c.id), galleryId);
    } catch (err) {
      console.error('[Dispatch] Batch failed:', err);
      for (const c of creatives) {
        updateStatus(c.id, 'failed');
        await creativeVotesService.updateDispatchStatus(galleryId, c.id, 'failed');
      }
    }
  }, [isEngineOnline, updateStatus]);

  // Simple polling for job status
  const pollJobStatus = useCallback(async (
    jobId: string,
    creativeId: string,
    galleryId: string,
  ) => {
    const maxAttempts = 60; // 5 minutes at 5s intervals
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const { job } = await engineApi.getJob(jobId);
        if (job.status === 'completed') {
          updateStatus(creativeId, 'completed');
          await creativeVotesService.updateDispatchStatus(
            galleryId, creativeId, 'completed', jobId,
            { output: job.output_result },
          );
          return;
        }
        if (job.status === 'failed') {
          updateStatus(creativeId, 'failed');
          await creativeVotesService.updateDispatchStatus(
            galleryId, creativeId, 'failed', jobId,
            { error: job.error_message },
          );
          return;
        }
      } catch {
        // Engine unreachable — stop polling
        return;
      }
    }
  }, [updateStatus]);

  const pollBatchJobStatus = useCallback(async (
    jobId: string,
    creativeIds: string[],
    galleryId: string,
  ) => {
    const maxAttempts = 120; // 10 minutes
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const { job } = await engineApi.getJob(jobId);
        if (job.status === 'completed') {
          for (const cid of creativeIds) {
            updateStatus(cid, 'completed');
            await creativeVotesService.updateDispatchStatus(
              galleryId, cid, 'completed', jobId,
              { output: job.output_result },
            );
          }
          return;
        }
        if (job.status === 'failed') {
          for (const cid of creativeIds) {
            updateStatus(cid, 'failed');
            await creativeVotesService.updateDispatchStatus(
              galleryId, cid, 'failed', jobId,
              { error: job.error_message },
            );
          }
          return;
        }
      } catch {
        return;
      }
    }
  }, [updateStatus]);

  return {
    dispatchApproval,
    dispatchRejection,
    dispatchBatch,
    dispatchStatus,
    isEngineOnline,
  };
}
