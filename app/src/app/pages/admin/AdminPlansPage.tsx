import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Check,
  X,
  Tag,
} from 'lucide-react';
import {
  planService,
  type PlanResponse,
  type CreatePlanDto,
  type UpdatePlanDto,
} from '../../../domain/admin/plans.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNotification } from '@/hooks/useNotification';

const PLAN_COLORS = [
  { label: 'Gray', value: '#6B7280' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Green', value: '#10B981' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Teal', value: '#14B8A6' },
];

type PlanFormData = {
  name: string;
  slug: string;
  description: string;
  priceCents: string;
  billingPeriod: string;
  featuresRaw: string;
  color: string;
  badgeText: string;
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: string;
  targetAudience: string;
};

const emptyForm = (): PlanFormData => ({
  name: '',
  slug: '',
  description: '',
  priceCents: '0',
  billingPeriod: 'month',
  featuresRaw: '',
  color: '#6B7280',
  badgeText: '',
  isFeatured: false,
  isActive: true,
  sortOrder: '0',
  targetAudience: '',
});

function planToForm(plan: PlanResponse): PlanFormData {
  return {
    name: plan.name,
    slug: plan.slug,
    description: plan.description ?? '',
    priceCents: String(plan.priceCents),
    billingPeriod: plan.billingPeriod,
    featuresRaw: plan.features.join('\n'),
    color: plan.color ?? '#6B7280',
    badgeText: plan.badgeText ?? '',
    isFeatured: plan.isFeatured,
    isActive: plan.isActive,
    sortOrder: String(plan.sortOrder),
    targetAudience: plan.targetAudience ?? '',
  };
}

function formToDto(form: PlanFormData): CreatePlanDto {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || undefined,
    priceCents: parseInt(form.priceCents, 10) || 0,
    billingPeriod: form.billingPeriod.trim() || 'month',
    features: form.featuresRaw
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean),
    color: form.color || undefined,
    badgeText: form.badgeText.trim() || undefined,
    isFeatured: form.isFeatured,
    isActive: form.isActive,
    sortOrder: parseInt(form.sortOrder, 10) || 0,
    targetAudience: form.targetAudience.trim() || undefined,
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function formatPrice(cents: number, period: string): string {
  if (cents === 0) return '$0/month';
  return `$${(cents / 100).toFixed(2)}/${period}`;
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanFormData>(emptyForm());
  const [draggedPlanId, setDraggedPlanId] = useState<string | null>(null);
  const [dragOverPlanId, setDragOverPlanId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => planService.adminListPlans(),
  });

  const plans = data?.plans ?? [];

  const createMutation = useMutation({
    mutationFn: (dto: CreatePlanDto) => planService.adminCreatePlan(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      showSuccess('Plan created successfully');
      setDialogOpen(false);
    },
    onError: (err: any) => showError(err?.message ?? 'Failed to create plan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlanDto }) =>
      planService.adminUpdatePlan(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      showSuccess('Plan updated successfully');
      setDialogOpen(false);
    },
    onError: (err: any) => showError(err?.message ?? 'Failed to update plan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => planService.adminDeletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      showSuccess('Plan deleted');
      setDeleteId(null);
    },
    onError: (err: any) => showError(err?.message ?? 'Failed to delete plan'),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlanDto }) =>
      planService.adminUpdatePlan(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
    },
  });

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (plan: PlanResponse) => {
    setEditingPlan(plan);
    setForm(planToForm(plan));
    setDialogOpen(true);
  };

  const handleSave = () => {
    const dto = formToDto(form);
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  const handleToggleActive = (plan: PlanResponse) => {
    updateMutation.mutate({ id: plan.id, dto: { isActive: !plan.isActive } });
  };

  const handleToggleFeatured = (plan: PlanResponse) => {
    updateMutation.mutate({ id: plan.id, dto: { isFeatured: !plan.isFeatured } });
  };

  const handleDragStart = (planId: string) => {
    setDraggedPlanId(planId);
  };

  const handleDragOver = (e: React.DragEvent, planId: string) => {
    e.preventDefault();
    if (draggedPlanId !== planId) setDragOverPlanId(planId);
  };

  const handleDrop = (targetPlanId: string) => {
    if (!draggedPlanId || draggedPlanId === targetPlanId) {
      setDraggedPlanId(null);
      setDragOverPlanId(null);
      return;
    }
    const draggedPlan = plans.find((p) => p.id === draggedPlanId);
    const targetPlan = plans.find((p) => p.id === targetPlanId);
    if (!draggedPlan || !targetPlan) return;
    reorderMutation.mutate({ id: draggedPlanId, dto: { sortOrder: targetPlan.sortOrder } });
    reorderMutation.mutate({ id: targetPlanId, dto: { sortOrder: draggedPlan.sortOrder } });
    setDraggedPlanId(null);
    setDragOverPlanId(null);
  };

  const handleDragEnd = () => {
    setDraggedPlanId(null);
    setDragOverPlanId(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage pricing tiers shown to users on the login page
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" />
          New Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Plans</p>
            <p className="text-3xl font-bold text-foreground">{plans.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {plans.filter((p) => p.isActive).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Featured</p>
            <p className="text-3xl font-bold text-amber-500">
              {plans.filter((p) => p.isFeatured).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Tag className="size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No plans yet</p>
            <Button variant="outline" onClick={openCreate} className="gap-2">
              <Plus className="size-4" />
              Create your first plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isDragging={draggedPlanId === plan.id}
                isDragOver={dragOverPlanId === plan.id}
                onEdit={() => openEdit(plan)}
                onDelete={() => setDeleteId(plan.id)}
                onToggleActive={() => handleToggleActive(plan)}
                onToggleFeatured={() => handleToggleFeatured(plan)}
                onDragStart={() => handleDragStart(plan.id)}
                onDragOver={(e) => handleDragOver(e, plan.id)}
                onDrop={() => handleDrop(plan.id)}
                onDragEnd={handleDragEnd}
              />
            ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'Update the plan details below.'
                : 'Fill in the details for the new subscription plan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Plan Name *</Label>
                <Input
                  value={form.name}
                  placeholder="e.g. Pro Advocate"
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: editingPlan ? f.slug : slugify(name),
                    }));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug *</Label>
                <Input
                  value={form.slug}
                  placeholder="pro_advocate"
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                placeholder="Brief description…"
                rows={2}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price (cents) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.priceCents}
                  placeholder="1499"
                  onChange={(e) => setForm((f) => ({ ...f, priceCents: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  = {formatPrice(parseInt(form.priceCents) || 0, form.billingPeriod)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Billing Period</Label>
                <Input
                  value={form.billingPeriod}
                  placeholder="month"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, billingPeriod: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Features (one per line) *</Label>
              <Textarea
                value={form.featuresRaw}
                rows={5}
                placeholder="Dashboard&#10;Child Profile&#10;IEP Analyzer (3 scans/mo)"
                onChange={(e) => setForm((f) => ({ ...f, featuresRaw: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Input
                value={form.targetAudience}
                placeholder="e.g. Active parents managing ongoing IEP process"
                onChange={(e) =>
                  setForm((f) => ({ ...f, targetAudience: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Badge Text</Label>
                <Input
                  value={form.badgeText}
                  placeholder="Most Popular"
                  onChange={(e) => setForm((f) => ({ ...f, badgeText: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <Label>Card Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PLAN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                    className="size-7 rounded-full transition-all"
                    style={{
                      backgroundColor: c.value,
                      outlineStyle: 'solid',
                      outlineWidth: form.color === c.value ? '3px' : '2px',
                      outlineColor: form.color === c.value ? c.value : 'transparent',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 pt-1">
              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="isFeatured"
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name || !form.slug || isSaving}>
              {isSaving ? 'Saving…' : editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plan. Users currently on this plan will not be
              affected immediately but the plan will no longer appear publicly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Plan Card Component ─────────────────────────────────────────────── */

interface PlanCardProps {
  plan: PlanResponse;
  isDragging: boolean;
  isDragOver: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleFeatured: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function PlanCard({
  plan,
  isDragging,
  isDragOver,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleFeatured,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: PlanCardProps) {
  const accentColor = plan.color ?? '#6B7280';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`relative rounded-2xl border-2 bg-card shadow-sm flex flex-col overflow-hidden transition-all select-none
        ${plan.isActive ? 'opacity-100' : 'opacity-60'}
        ${plan.isFeatured ? 'shadow-lg' : ''}
        ${isDragging ? 'opacity-40 scale-95' : ''}
        ${isDragOver ? 'ring-2 ring-offset-2' : ''}
      `}
      style={{ borderColor: accentColor, ...(isDragOver ? { ringColor: accentColor } : {}) }}
    >
      {/* Top color bar */}
      <div className="h-2 w-full" style={{ backgroundColor: accentColor }} />

      {/* Badge */}
      {plan.badgeText && (
        <div
          className="absolute top-5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {plan.badgeText}
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Name + price */}
        <div>
          <h3 className="font-bold text-lg text-card-foreground">{plan.name}</h3>
          <p className="text-2xl font-extrabold mt-0.5" style={{ color: accentColor }}>
            {formatPrice(plan.priceCents, plan.billingPeriod)}
          </p>
          {plan.targetAudience && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{plan.targetAudience}</p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-1.5 flex-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-card-foreground/80">
              <Check className="size-3.5 mt-0.5 shrink-0 text-green-500" />
              {f}
            </li>
          ))}
        </ul>

        {/* Status badges */}
        <div className="flex gap-1.5 flex-wrap">
          {plan.isActive ? (
            <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Active</Badge>
          ) : (
            <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">Inactive</Badge>
          )}
          {plan.isFeatured && (
            <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">⭐ Featured</Badge>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-1 bg-muted/40">
        <div className="flex gap-1">
          <span
            title="Drag to reorder"
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground cursor-grab active:cursor-grabbing transition-colors"
          >
            <GripVertical className="size-4" />
          </span>
        </div>
        <div className="flex gap-1">
          <button
            title={plan.isActive ? 'Deactivate' : 'Activate'}
            onClick={onToggleActive}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            {plan.isActive ? (
              <ToggleRight className="size-4 text-green-500" />
            ) : (
              <ToggleLeft className="size-4" />
            )}
          </button>
          <button
            title={plan.isFeatured ? 'Unfeature' : 'Mark as Featured'}
            onClick={onToggleFeatured}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            {plan.isFeatured ? (
              <Star className="size-4 text-amber-500 fill-amber-500" />
            ) : (
              <StarOff className="size-4" />
            )}
          </button>
          <button
            title="Edit"
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <Pencil className="size-4" />
          </button>
          <button
            title="Delete"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 transition-colors"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
