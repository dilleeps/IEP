import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit,
  Clock,
  DollarSign,
  Zap,
  BookOpen,
  Target,
  Users,
  MessageSquare,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/app/providers/AuthProvider';
import { getCounselorDataService } from '@/domain/counselor/counselor.service';
import type {
  CounselorServiceItem,
  CounselorServiceMetadata,
  CounselorServiceTemplate,
} from '@/domain/counselor/types';
import { useNotification } from '@/hooks/useNotification';

interface ServiceForm {
  name: string;
  serviceType: string;
  customDepartment: string;
  durationMinutes: number;
  isFree: boolean;
  priceDollars: string;
  paymentRequired: boolean;
  description: string;
}

const ICONS: Record<string, LucideIcon> = {
  Briefcase,
  Zap,
  BookOpen,
  Target,
  Users,
  MessageSquare,
  FileText,
};

const FALLBACK_CUSTOM_OPTION = 'Custom';
const FALLBACK_FILTER_ALL = 'All Departments';
const FALLBACK_DURATIONS = [15, 20, 30, 45, 60, 90, 120];

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function formatPrice(cents: number | null): string {
  return cents === null ? 'Free' : `$${(cents / 100).toFixed(2)}`;
}

const INITIAL_FORM: ServiceForm = {
  name: '',
  serviceType: '',
  customDepartment: '',
  durationMinutes: 60,
  isFree: false,
  priceDollars: '',
  paymentRequired: true,
  description: '',
};

function getDefaultForm(knownDepartments: string[], customOption: string): ServiceForm {
  return {
    ...INITIAL_FORM,
    serviceType: knownDepartments[0] || customOption,
  };
}

export function CounselorServicesPage() {
  const { accessToken } = useAuth();
  const { showError, showSuccess } = useNotification();
  const counselorDataService = getCounselorDataService();
  const [myServices, setMyServices] = useState<CounselorServiceItem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingService, setEditingService] = useState<CounselorServiceItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDepartmentFilter, setActiveDepartmentFilter] = useState(FALLBACK_FILTER_ALL);
  const [form, setForm] = useState<ServiceForm>(INITIAL_FORM);
  const [metadata, setMetadata] = useState<CounselorServiceMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => metadata?.categories || [], [metadata]);
  const templates = useMemo(() => metadata?.templates || [], [metadata]);
  const durations = useMemo(
    () => (metadata?.durations?.length ? metadata.durations : FALLBACK_DURATIONS),
    [metadata],
  );
  const customOption = metadata?.customOption || FALLBACK_CUSTOM_OPTION;
  const filterAllLabel = metadata?.filterAllLabel || FALLBACK_FILTER_ALL;

  const knownDepartments = useMemo(() => categories.map((category) => category.department), [categories]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;

    setIsLoading(true);
    Promise.all([
      counselorDataService.listServiceMetadata(accessToken),
      counselorDataService.listServices(accessToken),
    ])
      .then(([metadataResponse, items]) => {
        if (!active) return;
        setMetadata(metadataResponse);
        setMyServices(items);
        setActiveDepartmentFilter((prev) => (prev === FALLBACK_FILTER_ALL ? metadataResponse.filterAllLabel : prev));
        setForm((prev) => (prev.serviceType ? prev : getDefaultForm(
          metadataResponse.categories.map((category) => category.department),
          metadataResponse.customOption,
        )));
      })
      .catch((error) => {
        if (!active) return;
        showError('Failed to load services', error instanceof Error ? error.message : 'Please try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, counselorDataService, showError]);

  const customDepartments = useMemo(
    () =>
      Array.from(
        new Set(
          myServices
            .map((s) => normalizeText(s.serviceType))
            .filter((d) => d && !knownDepartments.includes(d)),
        ),
      ).sort(),
    [myServices, knownDepartments],
  );

  const allFilters = useMemo(
    () => [filterAllLabel, ...knownDepartments, ...customDepartments],
    [customDepartments, filterAllLabel, knownDepartments],
  );

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return myServices.filter((service) => {
      const matchDept = activeDepartmentFilter === filterAllLabel || service.serviceType === activeDepartmentFilter;
      const matchText =
        !q ||
        service.name.toLowerCase().includes(q) ||
        service.serviceType.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q);
      return matchDept && matchText;
    });
  }, [myServices, activeDepartmentFilter, filterAllLabel, searchTerm]);

  const filteredTemplates = useMemo(() => {
    if (activeDepartmentFilter === filterAllLabel) {
      return templates;
    }

    return templates.filter((template) => template.serviceType === activeDepartmentFilter);
  }, [templates, activeDepartmentFilter, filterAllLabel]);

  const resetForm = () => setForm(getDefaultForm(knownDepartments, customOption));

  const openFromTemplate = (template: CounselorServiceTemplate) => {
    const known = knownDepartments.includes(template.serviceType);
    setForm({
      name: template.name,
      serviceType: known ? template.serviceType : customOption,
      customDepartment: known ? '' : template.serviceType,
      durationMinutes: template.durationMinutes,
      isFree: template.priceCents === null,
      priceDollars: template.priceCents === null ? '' : (template.priceCents / 100).toFixed(2),
      paymentRequired: template.paymentRequired,
      description: template.description,
    });
    setIsAddOpen(true);
  };

  const openEdit = (service: CounselorServiceItem) => {
    const known = knownDepartments.includes(service.serviceType);
    setEditingService(service);
    setForm({
      name: service.name,
      serviceType: known ? service.serviceType : customOption,
      customDepartment: known ? '' : service.serviceType,
      durationMinutes: service.durationMinutes,
      isFree: service.priceCents === null,
      priceDollars: service.priceCents === null ? '' : (service.priceCents / 100).toFixed(2),
      paymentRequired: service.paymentRequired,
      description: service.description,
    });
  };

  const handleSave = async () => {
    if (!accessToken) {
      showError('Unable to save service', 'You are not authenticated.');
      return;
    }

    const resolvedType = form.serviceType === customOption ? normalizeText(form.customDepartment) : form.serviceType;
    if (!form.name.trim() || !resolvedType) return;

    const parsedPrice = parseFloat(form.priceDollars || '0');
    if (!form.isFree && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      showError('Invalid price', 'Please provide a valid non-negative price.');
      return;
    }

    const payload = {
      name: normalizeText(form.name),
      serviceType: resolvedType,
      durationMinutes: form.durationMinutes,
      priceCents: form.isFree ? null : Math.round(parsedPrice * 100),
      paymentRequired: !form.isFree && form.paymentRequired,
      description: normalizeText(form.description),
    };

    setIsSubmitting(true);
    try {
      if (editingService) {
        const updated = await counselorDataService.updateService(accessToken, editingService.id, payload);
        setMyServices((prev) => prev.map((s) => (s.id === editingService.id ? updated : s)));
        setEditingService(null);
        showSuccess('Service updated', `${updated.name} has been updated.`);
      } else {
        const created = await counselorDataService.createService(accessToken, payload);
        setMyServices((prev) => [created, ...prev]);
        setIsAddOpen(false);
        showSuccess('Service added', `${created.name} has been added to your catalog.`);
      }
      resetForm();
    } catch (error) {
      showError('Failed to save service', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      showError('Unable to delete service', 'You are not authenticated.');
      return;
    }

    try {
      await counselorDataService.deleteService(accessToken, id);
      setMyServices((prev) => prev.filter((s) => s.id !== id));
      showSuccess('Service removed', 'The service has been removed.');
    } catch (error) {
      showError('Failed to delete service', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-6 pb-20">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 text-white p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-violet-500/20 blur-[80px] rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-widest text-violet-200 mb-2">
              <Briefcase className="w-3.5 h-3.5" /> Service Catalog
            </div>
            <h2 className="text-2xl md:text-3xl font-black">My Services</h2>
            <p className="text-violet-100/70 text-sm">Templates and categories are loaded from your live database.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-3xl font-black">{myServices.length}</span>
            <span className="text-xs text-violet-200 font-bold uppercase tracking-widest">Services Active</span>
          </div>
        </div>
      </section>

      <div className="rounded-[24px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-violet-600" />
          <h3 className="text-base font-black text-foreground">Suggested Service Categories (For Filtering)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {categories.map((category) => {
            const Icon = ICONS[category.iconKey] || Briefcase;
            const active = activeDepartmentFilter === category.department;
            return (
              <button
                key={category.department}
                onClick={() => setActiveDepartmentFilter(category.department)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  active ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : 'border-border hover:border-violet-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-violet-600" />
                  <p className="text-sm font-black text-foreground">{category.department}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{category.examples}</p>
              </button>
            );
          })}
        </div>
        {customDepartments.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Your Custom Categories</p>
            <div className="flex flex-wrap gap-2">
              {customDepartments.map((dept) => (
                <Badge
                  key={dept}
                  className="cursor-pointer bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0"
                  onClick={() => setActiveDepartmentFilter(dept)}
                >
                  {dept}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-black text-foreground mb-4">Quick-Add Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = ICONS[categories.find((c) => c.department === template.serviceType)?.iconKey || 'Briefcase'] || Briefcase;
            const alreadyAdded = myServices.some((s) => s.name === template.name);
            return (
              <button
                key={template.name}
                onClick={() => !alreadyAdded && openFromTemplate(template)}
                disabled={alreadyAdded}
                className={`group text-left p-5 rounded-[20px] border shadow-sm transition-all ${
                  alreadyAdded
                    ? 'opacity-50 cursor-not-allowed border-border bg-muted'
                    : 'border-border bg-card hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700'
                }`}
              >
                <div className="w-9 h-9 bg-violet-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <p className="text-sm font-black text-foreground mb-1 leading-snug">{template.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {template.durationMinutes} min
                  <span className="text-foreground font-bold">{formatPrice(template.priceCents)}</span>
                </div>
                <Badge className="mt-2 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0 text-[10px]">
                  {template.serviceType}
                </Badge>
              </button>
            );
          })}
        </div>
        {filteredTemplates.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No quick templates for <span className="font-bold text-foreground">{activeDepartmentFilter}</span>.
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-4">
          <h3 className="text-lg font-black text-foreground">My Services</h3>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or category"
                className="pl-9 rounded-xl"
              />
            </div>
            <Select value={activeDepartmentFilter} onValueChange={setActiveDepartmentFilter}>
              <SelectTrigger className="sm:w-56 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allFilters.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-bold flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="w-4 h-4" /> Add Custom
                </Button>
              </DialogTrigger>
              <ServiceFormDialog
                form={form}
                setForm={setForm}
                onSave={handleSave}
                isSubmitting={isSubmitting}
                onCancel={() => { setIsAddOpen(false); resetForm(); }}
                title="Add Custom Service"
                departments={knownDepartments}
                durations={durations}
                customOption={customOption}
              />
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-[24px]">
            <p className="text-sm font-bold text-muted-foreground">Loading services...</p>
          </div>
        ) : myServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-[24px] bg-amber-50/50 dark:bg-amber-950/10">
            <Briefcase className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-base font-black text-foreground">You haven't added any services yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Parents can't book you until you define what you offer.</p>
            <p className="text-xs text-muted-foreground mt-3">Use the templates above or the <span className="font-bold text-foreground">Add Custom</span> button to get started.</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-[24px]">
            <Briefcase className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-base font-black text-muted-foreground">No matching services</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between gap-4 bg-card border border-border rounded-[20px] p-5 shadow-sm">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-foreground">{service.name}</p>
                    <Badge className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0 font-bold">
                      {service.serviceType}
                    </Badge>
                    {!service.paymentRequired && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0 font-bold">Free</Badge>}
                  </div>
                  {service.description && <p className="text-xs text-muted-foreground truncate">{service.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{service.durationMinutes} min</span>
                    <span className="flex items-center gap-1 font-bold text-foreground"><DollarSign className="w-3 h-3" />{formatPrice(service.priceCents)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Dialog open={editingService?.id === service.id} onOpenChange={(open) => { if (!open) { setEditingService(null); resetForm(); } }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => openEdit(service)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </DialogTrigger>
                    <ServiceFormDialog
                      form={form}
                      setForm={setForm}
                      onSave={handleSave}
                      isSubmitting={isSubmitting}
                      onCancel={() => { setEditingService(null); resetForm(); }}
                      title="Edit Service"
                      departments={knownDepartments}
                      durations={durations}
                      customOption={customOption}
                    />
                  </Dialog>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceFormDialog({
  form,
  setForm,
  onSave,
  isSubmitting,
  onCancel,
  title,
  departments,
  durations,
  customOption,
}: {
  form: ServiceForm;
  setForm: React.Dispatch<React.SetStateAction<ServiceForm>>;
  onSave: () => void;
  isSubmitting: boolean;
  onCancel: () => void;
  title: string;
  departments: string[];
  durations: number[];
  customOption: string;
}) {
  const requiresCustomDepartment = form.serviceType === customOption;
  const disableSave = !form.name.trim() || (requiresCustomDepartment && !form.customDepartment.trim());

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Service Name</Label>
          <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="e.g. IEP Review Consultation" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <Select value={form.serviceType} onValueChange={(value) => setForm((prev) => ({ ...prev, serviceType: value, customDepartment: value === customOption ? prev.customDepartment : '' }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {departments.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}
              <SelectItem value={customOption}>{customOption}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {requiresCustomDepartment && (
          <div className="space-y-2">
            <Label>Custom Department</Label>
            <Input value={form.customDepartment} onChange={(e) => setForm((prev) => ({ ...prev, customDepartment: e.target.value }))} placeholder="e.g. Assistive Technology" className="rounded-xl" />
          </div>
        )}
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Select value={String(form.durationMinutes)} onValueChange={(value) => setForm((prev) => ({ ...prev, durationMinutes: parseInt(value, 10) }))}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{durations.map((duration) => <SelectItem key={duration} value={String(duration)}>{duration} min</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Pricing</Label>
            <button onClick={() => setForm((prev) => ({ ...prev, isFree: !prev.isFree }))} className={`text-xs font-bold px-2 py-1 rounded-lg transition-colors ${form.isFree ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
              {form.isFree ? '✓ Free' : 'Set as Free'}
            </button>
          </div>
          {!form.isFree && (
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="number" min="0" step="0.01" value={form.priceDollars} onChange={(e) => setForm((prev) => ({ ...prev, priceDollars: e.target.value }))} placeholder="0.00" className="pl-8 rounded-xl" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Description (optional)</Label>
          <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Short description for parents" className="rounded-xl" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
        <Button onClick={onSave} disabled={disableSave || isSubmitting} className="rounded-xl">{isSubmitting ? 'Saving...' : 'Save Service'}</Button>
      </DialogFooter>
    </DialogContent>
  );
}