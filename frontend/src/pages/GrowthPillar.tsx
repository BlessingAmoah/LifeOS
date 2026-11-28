import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import './GrowthPillar.css';

type Pillar = 'christian_life' | 'personal_growth';
interface GrowthContent {
  content: Record<string, string>;
  updated_at: string | null;
}

const sections = {
  christian_life: [
    { key: 'upward', title: 'Upward', prompt: 'Prayer, worship, and your relationship with God.' },
    { key: 'inward', title: 'Inward', prompt: 'Rest, examination, and inner formation.' },
    { key: 'withward', title: 'Withward', prompt: 'Community, fellowship, and shared spiritual rhythms.' },
    { key: 'outward', title: 'Outward', prompt: 'Service, generosity, and love of neighbor.' },
    { key: 'scripture_anchors', title: 'Scripture Anchors', prompt: 'Scripture references and reflections for this season.' },
    { key: 'intercession_legacy', title: 'Intercession & Legacy Log', prompt: 'People you are praying for and the legacy you hope to leave.' },
    { key: 'work_altar', title: 'Work-Altar Note (Avodah)', prompt: 'Reflect on work as service and worship.' },
  ],
  personal_growth: [
    { key: 'learning_themes', title: 'Learning Themes', prompt: 'What themes are shaping your learning in this season?' },
    { key: 'book_archive', title: 'Book Archive', prompt: 'Book titles, authors, insights, and reflections. No reading targets required.' },
    { key: 'relational_reflections', title: 'Relational Pattern Reflections', prompt: 'Notice patterns in relationships, communication, and boundaries.' },
    { key: 'character_notes', title: 'Character Formation Notes', prompt: 'Reflect on character, lessons learned, and who you are becoming.' },
  ],
};

const GrowthPillar = ({ pillar }: { pillar: Pillar }) => {
  const christian = pillar === 'christian_life';
  const title = christian ? 'Christian Life' : 'Personal Growth';
  const client = useQueryClient();
  const queryKey = ['growth-content', pillar];
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const { data, isLoading, error, refetch } = useQuery<GrowthContent>({
    queryKey,
    queryFn: () => api.get(`/stewardship/growth/${pillar}`).then(response => response.data),
  });
  const save = useMutation({
    mutationFn: (content: Record<string, string>) =>
      api.put<GrowthContent>(`/stewardship/growth/${pillar}`, { content }).then(response => response.data),
    onSuccess: (saved) => {
      client.setQueryData(queryKey, saved);
      setDraft(null);
    },
  });

  if (isLoading) return <LoadingSpinner message={`Loading ${title}...`} />;
  if (error) return <ErrorMessage message={`Failed to load ${title}`} onRetry={() => { void refetch(); }} />;

  const content = draft ?? data?.content ?? {};
  return (
    <div className={`growth-pillar ${christian ? 'growth-pillar-christian' : ''}`}>
      <header>
        <h1>{title}</h1>
        <p>{christian ? 'Formation & faithfulness, not performance.' : 'Character & learning beyond career.'}</p>
        {christian && (
          <aside className="growth-scripture" aria-label="Scripture anchor">
            <strong>Isaiah 43:19 (WEB)</strong>
            <p>Behold, I will do a new thing. It springs out now. Don&apos;t you know it? I will even make a way in the wilderness, and rivers in the desert.</p>
          </aside>
        )}
      </header>
      <form onSubmit={event => {
        event.preventDefault();
        save.mutate(content);
      }}>
        {christian && <h2>Rule of Life</h2>}
        <div className={christian ? 'growth-sections growth-cross' : 'growth-sections'}>
          {sections[pillar].map(section => (
            <section key={section.key} className={`growth-section growth-${section.key}`}>
              <h2><label htmlFor={`growth-${section.key}`}>{section.title}</label></h2>
              <p>{section.prompt}</p>
              <textarea
                id={`growth-${section.key}`}
                value={content[section.key] ?? ''}
                rows={5}
                maxLength={5000}
                disabled={save.isPending}
                onChange={event => {
                  save.reset();
                  setDraft({ ...content, [section.key]: event.target.value });
                }}
              />
            </section>
          ))}
        </div>
        {save.isError && <ErrorMessage message="Unable to save your reflections. Your edits are still here; please retry." />}
        <div className="growth-save">
          <button type="submit" disabled={draft === null || save.isPending}>
            {save.isPending ? 'Saving...' : 'Save reflections'}
          </button>
          <span role="status">
            {save.isSuccess ? 'Reflections saved.' : draft !== null ? 'Unsaved changes' : ''}
          </span>
          {data?.updated_at && <small>Last saved: {new Date(data.updated_at).toLocaleString()}</small>}
        </div>
      </form>
      <nav className="growth-related" aria-label={`${title} reflections`}>
        <Link to={`/dashboard/quarterly-audit?pillar=${pillar}`}>
          {christian ? 'Quarterly Spiritual Audit (Selah Questions)' : 'Quarterly Growth Audit'}
        </Link>
        <Link to={`/dashboard/evidence-of-grace?pillar=${pillar}`}>
          {christian ? 'Grace Log' : 'Evidence of Grace'}
        </Link>
      </nav>
    </div>
  );
};

export default GrowthPillar;
