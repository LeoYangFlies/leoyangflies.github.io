import { getCollection, type CollectionEntry } from 'astro:content';
import { TIP_TOPICS, type TipTopic } from '../consts';

export type Tip = CollectionEntry<'guides'>;

/** All published guides, newest first. Drafts show while previewing locally only. */
export async function getTips(): Promise<Tip[]> {
  const all = await getCollection('guides', ({ data }) => import.meta.env.DEV || !data.draft);
  return all.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

export function topicLabel(topic: TipTopic): string {
  return TIP_TOPICS[topic];
}

export function tipUrl(tip: Tip): string {
  return `/guides/${tip.id}/`;
}

/** Rough reading time from the Markdown body. */
export { readingMinutes } from './reading';
