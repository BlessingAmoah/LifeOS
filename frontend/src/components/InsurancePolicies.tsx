import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import EmptyState from './EmptyState';
import { financialCurrencies, financeErrorMessage } from '../utils/finance';
import {
  policyTypes, policyStatuses, premiumFrequencies, renewalNotice,
  type InsurancePolicy, type PolicyType, type PolicyStatus, type PremiumFrequency,
} from '../utils/insurance';
import './InsurancePolicies.css';

interface PolicyForm {
  name: string;
  policy_type: PolicyType;
  insurer_name: string;
  policy_suffix: string;
  currency: string;
  premium_amount: string;
  premium_frequency: PremiumFrequency | '';
  coverage_amount: string;
  start_date: string;
  end_date: string;
  renewal_date: string;
  status: PolicyStatus;
  notes: string;
}
const newForm = (): PolicyForm => ({
  name: '', policy_type: 'life', insurer_name: '', policy_suffix: '', currency: 'USD',
  premium_amount: '', premium_frequency: '', coverage_amount: '', start_date: '',
  end_date: '', renewal_date: '', status: 'active', notes: '',
});

export default function InsurancePolicies() {
  const client = useQueryClient();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [filterType, setFilterType] = useState<PolicyType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<PolicyStatus | 'all'>('all');
  const [editing, setEditing] = useState<InsurancePolicy | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(newForm);
  const [notice, setNotice] = useState('');
  const policies = useQuery<InsurancePolicy[]>({
    queryKey: ['insurance-policies', includeArchived, filterType, filterStatus],
    queryFn: () => {
      const params = new URLSearchParams({ include_archived: String(includeArchived) });
      if (filterType !== 'all') params.set('policy_type', filterType);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      return api.get(`/insurance-policies?${params}`).then(response => response.data);
    },
  });
  const refresh = () => { void client.invalidateQueries({ queryKey: ['insurance-policies'] }); };
  const save = useMutation({
    mutationFn: () => {
      const metadata = {
        ...form, policy_suffix: form.policy_suffix || null,
        premium_amount: form.premium_amount || null, premium_frequency: form.premium_frequency || null,
        coverage_amount: form.coverage_amount || null, start_date: form.start_date || null,
        end_date: form.end_date || null, renewal_date: form.renewal_date || null, notes: form.notes.trim() || null,
      };
      return editing ? api.put(`/insurance-policies/${editing.id}`, metadata) : api.post('/insurance-policies', metadata);
    },
    onSuccess: () => { refresh(); setShowForm(false); setEditing(null); setNotice('Policy saved.'); },
  });
  const archive = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      api.patch(`/insurance-policies/${id}`, { is_archived: archived }),
    onSuccess: (_, variables) => { refresh(); setNotice(variables.archived ? 'Policy archived. Its details are preserved.' : 'Policy restored.'); },
  });
  const openForm = (policy: InsurancePolicy | null) => {
    save.reset();
    setNotice('');
    setEditing(policy);
    setForm(policy ? {
      name: policy.name, policy_type: policy.policy_type, insurer_name: policy.insurer_name,
      policy_suffix: policy.policy_suffix ?? '', currency: policy.currency,
      premium_amount: policy.premium_amount ?? '', premium_frequency: policy.premium_frequency ?? '',
      coverage_amount: policy.coverage_amount ?? '', start_date: policy.start_date ?? '',
      end_date: policy.end_date ?? '', renewal_date: policy.renewal_date ?? '', status: policy.status, notes: policy.notes ?? '',
    } : newForm());
    setShowForm(true);
  };
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };

  return (
    <section className="insurance-policies" aria-label="Manual insurance policies">
      <div className="insurance-actions">
        <h2>Insurance</h2>
        <button className="btn-primary" disabled={save.isPending || archive.isPending} onClick={() => openForm(null)}>Add Policy</button>
      </div>
      <p>Manually recorded policies, not insurer connections. No automatic payments, transaction changes, or net-worth updates. Currencies are kept separate.</p>
      <p>Statuses are manually maintained. Renewal indicators use UTC calendar dates and do not confirm coverage or send notifications.</p>
      <div className="insurance-filters">
        <div className="form-group"><label htmlFor="policy-type-filter">Filter by policy type</label><select id="policy-type-filter" value={filterType} onChange={event => setFilterType(event.target.value as PolicyType | 'all')}><option value="all">All types</option>{policyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="form-group"><label htmlFor="policy-status-filter">Filter by status</label><select id="policy-status-filter" value={filterStatus} onChange={event => setFilterStatus(event.target.value as PolicyStatus | 'all')}><option value="all">All statuses</option>{policyStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <label><input type="checkbox" checked={includeArchived} onChange={event => setIncludeArchived(event.target.checked)} /> Include archived policies</label>
      </div>
      <p role="status">{notice}</p>
      {archive.error && <ErrorMessage message={financeErrorMessage(archive.error)} />}
      {showForm && (
        <form className="financial-form" onSubmit={submit}>
          <fieldset className="insurance-fieldset" disabled={save.isPending || archive.isPending}>
            <h3>{editing ? 'Edit Policy' : 'New Policy'}</h3>
            <div className="insurance-fields">
              <div className="form-group"><label htmlFor="policy-name">Policy nickname</label><input id="policy-name" required maxLength={100} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></div>
              <div className="form-group"><label htmlFor="policy-type">Policy type</label><select id="policy-type" value={form.policy_type} onChange={event => setForm({ ...form, policy_type: event.target.value as PolicyType })}>{policyTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="form-group"><label htmlFor="policy-insurer">Insurer name</label><input id="policy-insurer" required maxLength={100} value={form.insurer_name} onChange={event => setForm({ ...form, insurer_name: event.target.value })} /></div>
              <div className="form-group"><label htmlFor="policy-suffix">Last four reference characters (optional)</label><input id="policy-suffix" pattern="[A-Za-z0-9]{4}" maxLength={4} value={form.policy_suffix} onChange={event => setForm({ ...form, policy_suffix: event.target.value })} /><p>Only the last four letters/digits, not a full policy number.</p></div>
              <div className="form-group"><label htmlFor="policy-currency">Currency</label><select id="policy-currency" value={form.currency} onChange={event => setForm({ ...form, currency: event.target.value })}>{financialCurrencies.map(currency => <option key={currency} value={currency}>{currency === 'GHS' ? 'GHS - Ghanaian cedi' : currency}</option>)}</select><p>Labels the entered amounts. Changing currency does not convert them.</p></div>
              <div className="form-group"><label htmlFor="policy-status">Recorded status</label><select id="policy-status" value={form.status} onChange={event => setForm({ ...form, status: event.target.value as PolicyStatus })}>{policyStatuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="form-group"><label htmlFor="policy-premium">Premium amount (optional)</label><input id="policy-premium" type="number" min="0" step="0.01" required={form.premium_frequency !== ''} value={form.premium_amount} onChange={event => setForm({ ...form, premium_amount: event.target.value })} /><p>Leave blank if unknown. Enter zero only for an actual zero premium.</p></div>
              <div className="form-group"><label htmlFor="policy-frequency">Premium frequency</label><select id="policy-frequency" required={form.premium_amount !== ''} value={form.premium_frequency} onChange={event => setForm({ ...form, premium_frequency: event.target.value as PremiumFrequency | '' })}><option value="">Not recorded</option>{premiumFrequencies.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="form-group"><label htmlFor="policy-coverage">Coverage amount (optional)</label><input id="policy-coverage" type="number" min="0" step="0.01" value={form.coverage_amount} onChange={event => setForm({ ...form, coverage_amount: event.target.value })} /></div>
              <div className="form-group"><label htmlFor="policy-start">Coverage start date (optional)</label><input id="policy-start" type="date" value={form.start_date} onChange={event => setForm({ ...form, start_date: event.target.value })} /></div>
              <div className="form-group"><label htmlFor="policy-end">Coverage end date (optional)</label><input id="policy-end" type="date" min={form.start_date || undefined} value={form.end_date} onChange={event => setForm({ ...form, end_date: event.target.value })} /></div>
              <div className="form-group"><label htmlFor="policy-renewal">Renewal date (optional)</label><input id="policy-renewal" type="date" value={form.renewal_date} onChange={event => setForm({ ...form, renewal_date: event.target.value })} /></div>
            </div>
            <div className="form-group"><label htmlFor="policy-notes">Notes (optional)</label><textarea id="policy-notes" rows={3} maxLength={2000} value={form.notes} onChange={event => setForm({ ...form, notes: event.target.value })} /><p>Do not enter medical information or beneficiary details.</p></div>
            {save.error && <ErrorMessage message={financeErrorMessage(save.error)} />}
            <div className="insurance-actions"><button className="btn-primary">{save.isPending ? 'Saving...' : 'Save Policy'}</button><button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button></div>
          </fieldset>
        </form>
      )}
      {policies.isLoading ? <LoadingSpinner message="Loading insurance policies..." /> :
        policies.error ? <ErrorMessage message={financeErrorMessage(policies.error)} onRetry={() => { void policies.refetch(); }} /> :
          policies.data?.length ? [...new Set(policies.data.map(policy => policy.currency))].map(currency => (
            <section key={currency} aria-label={`${currency} insurance policies`}>
              <h3>{currency} policies</h3>
              <div className="insurance-list">{policies.data?.filter(policy => policy.currency === currency).map(policy => {
                const renewal = renewalNotice(policy);
                return (
                  <article className="insurance-card" key={policy.id} aria-labelledby={`policy-${policy.id}`}>
                    <h4 id={`policy-${policy.id}`}>{policy.name}{policy.is_archived ? ' (Archived)' : ''}</h4>
                    <p>{policyTypes.find(([value]) => value === policy.policy_type)?.[1]} - {policy.insurer_name}{policy.policy_suffix ? ` - ending ${policy.policy_suffix}` : ''}</p>
                    <p>Recorded status: <strong>{policyStatuses.find(([value]) => value === policy.status)?.[1]}</strong></p>
                    {renewal && <p className="insurance-renewal">{renewal}</p>}
                    {!policy.is_archived && policy.status === 'active' && policy.end_date && policy.end_date < new Date().toISOString().slice(0, 10) && <p className="insurance-renewal">Coverage end date has passed. Review the recorded status.</p>}
                    <dl className="insurance-details">
                      <div><dt>Premium</dt><dd>{policy.premium_amount === null ? 'N/A (not recorded)' : `${currency} ${policy.premium_amount} / ${premiumFrequencies.find(([value]) => value === policy.premium_frequency)?.[1]}`}</dd></div>
                      <div><dt>Coverage amount</dt><dd>{policy.coverage_amount === null ? 'N/A (not recorded)' : `${currency} ${policy.coverage_amount}`}</dd></div>
                      <div><dt>Coverage starts</dt><dd><time dateTime={policy.start_date ?? undefined}>{policy.start_date ?? 'N/A'}</time></dd></div>
                      <div><dt>Coverage ends</dt><dd><time dateTime={policy.end_date ?? undefined}>{policy.end_date ?? 'N/A'}</time></dd></div>
                      <div><dt>Renewal date</dt><dd><time dateTime={policy.renewal_date ?? undefined}>{policy.renewal_date ?? 'N/A'}</time></dd></div>
                    </dl>
                    {policy.notes && <p className="insurance-notes">{policy.notes}</p>}
                    <div className="insurance-actions">
                      <button className="btn-secondary" aria-label={`Edit ${policy.name}`} disabled={policy.is_archived || save.isPending || archive.isPending} onClick={() => openForm(policy)}>Edit</button>
                      <button className="btn-secondary" aria-label={`${policy.is_archived ? 'Restore' : 'Archive'} ${policy.name}`} disabled={save.isPending || archive.isPending} onClick={() => archive.mutate({ id: policy.id, archived: !policy.is_archived })}>{policy.is_archived ? 'Restore' : 'Archive'}</button>
                    </div>
                  </article>
                );
              })}</div>
            </section>
          )) : <EmptyState title="No insurance policies found" message="Add a manually tracked policy or adjust the filters. Existing financial records are unchanged." />}
    </section>
  );
}
