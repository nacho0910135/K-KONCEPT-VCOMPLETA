import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronRight, Edit, FolderPlus, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import Modal from '../../components/common/Modal.jsx';
import Badge from '../../components/common/Badge.jsx';
import FormInput from '../../components/forms/FormInput.jsx';
import FormTextarea from '../../components/forms/FormTextarea.jsx';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../utils/errorHandler.js';
import {
  activateCategory,
  activateSubcategory,
  createCategory,
  createSubcategory,
  deactivateCategory,
  deactivateSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategories,
  updateCategory,
  updateSubcategory
} from '../../services/category.client.service.js';

const categorySchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  description: z.string().min(5, 'Descripcion requerida')
});

const Categorias = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState([]);
  const [editing, setEditing] = useState(null);
  const [subParent, setSubParent] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const { showToast } = useToast();
  const form = useForm({ resolver: zodResolver(categorySchema), defaultValues: { name: '', description: '' } });

  const loadCategories = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setIsLoading(true);
    setError(null);
    try {
      const result = await listCategories({ limit: 100, sortBy: 'name', sortOrder: 'asc' });
      const categories = Array.isArray(result) ? result : result?.items || result?.data || [];
      setData(categories);
      setExpanded((current) => current.length ? current : categories.slice(0, 2).map((category) => category.id));
    } catch (loadError) {
      const message = getErrorMessage(loadError, 'No pudimos cargar las categorias.');
      setError(message);
      showToast({ type: 'error', title: 'No se cargaron las categorias', message });
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const toggleExpanded = (id) => setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  const openCategory = (category = null) => {
    setEditing(category || { type: 'category' });
    form.reset({ name: category?.name || '', description: category?.description || '' });
  };

  const openSubcategory = (parent, subcategory = null) => {
    setSubParent(parent);
    setEditing(subcategory || { type: 'subcategory' });
    form.reset({ name: subcategory?.name || '', description: subcategory?.description || '' });
  };

  const save = async (values) => {
    setIsSaving(true);
    try {
      if (subParent) {
        if (editing?.id) {
          await updateSubcategory(editing.id, values);
        } else {
          await createSubcategory(subParent.id, values);
          setExpanded((current) => current.includes(subParent.id) ? current : [...current, subParent.id]);
        }
      } else if (editing?.id) {
        await updateCategory(editing.id, values);
      } else {
        const result = await createCategory(values);
        const createdId = result?.category?.id;
        if (createdId) setExpanded((current) => [...current, createdId]);
      }
      await loadCategories({ quiet: true });
      setEditing(null);
      setSubParent(null);
      showToast({ type: 'success', title: 'Catalogo actualizado', message: 'Los cambios fueron guardados en la base de datos.' });
    } catch (saveError) {
      showToast({ type: 'error', title: 'No se pudo guardar', message: getErrorMessage(saveError, 'Revisa la informacion e intenta de nuevo.') });
    } finally {
      setIsSaving(false);
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    setIsConfirming(true);
    try {
      const { type, item, isSubcategory } = confirmAction;
      if (type === 'delete') {
        await (isSubcategory ? deleteSubcategory(item.id) : deleteCategory(item.id));
        showToast({ type: 'success', title: 'Registro eliminado', message: `${item.name} fue eliminado correctamente.` });
      } else {
        const nextActive = !item.active;
        if (isSubcategory) {
          await (nextActive ? activateSubcategory(item.id) : deactivateSubcategory(item.id));
        } else {
          await (nextActive ? activateCategory(item.id) : deactivateCategory(item.id));
        }
        showToast({ type: 'success', title: nextActive ? 'Registro activado' : 'Registro desactivado', message: `${item.name} fue actualizado correctamente.` });
      }
      await loadCategories({ quiet: true });
      setConfirmAction(null);
    } catch (actionError) {
      showToast({ type: 'error', title: 'No se pudo completar la accion', message: getErrorMessage(actionError, 'Intenta de nuevo en unos minutos.') });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Categorias y subcategorias</h1>
          <p className="mt-1 text-sm text-neutral-500">Catalogo jerarquico para clasificacion de tickets.</p>
        </div>
        <Button onClick={() => openCategory()}><Plus className="h-4 w-4" />Nueva categoria</Button>
      </div>

      <div className="grid gap-3">
        {isLoading && Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-white" />)}
        {error && <Card className="border-danger/30 p-5 text-sm font-semibold text-danger">{error}</Card>}
        {!isLoading && !error && data.length === 0 && (
          <Card className="p-6 text-center">
            <p className="font-semibold text-neutral-900">No hay categorias registradas</p>
            <p className="mt-1 text-sm text-neutral-500">Crea la primera categoria para que los clientes puedan clasificar tickets.</p>
          </Card>
        )}
        {data.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button className="flex min-w-0 items-center gap-2 text-left" onClick={() => toggleExpanded(category.id)} type="button">
                {expanded.includes(category.id) ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <div className="min-w-0">
                  <h2 className="flex flex-wrap items-center gap-2 font-semibold text-neutral-900">{category.name} {!category.active && <Badge>Inactiva</Badge>}</h2>
                  <p className="text-sm text-neutral-500">{category.description}</p>
                </div>
              </button>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => openCategory(category)}><Edit className="h-4 w-4" />Editar</Button>
                <Button variant="ghost" onClick={() => openSubcategory(category)}><FolderPlus className="h-4 w-4" />Subcategoria</Button>
                <Button variant="ghost" onClick={() => setConfirmAction({ type: 'toggle', item: category, isSubcategory: false })}>
                  <RotateCcw className="h-4 w-4" />{category.active ? 'Desactivar' : 'Activar'}
                </Button>
                <Button variant="danger" onClick={() => setConfirmAction({ type: 'delete', item: category, isSubcategory: false })}>
                  <Trash2 className="h-4 w-4" />Eliminar
                </Button>
              </div>
            </div>
            {expanded.includes(category.id) && (
              <div className="mt-4 grid gap-2 border-l border-neutral-200 pl-4">
                {(category.subcategories || []).length === 0 && (
                  <div className="rounded-lg bg-neutral-50 px-3 py-3 text-sm text-neutral-500">Esta categoria no tiene subcategorias.</div>
                )}
                {(category.subcategories || []).map((sub) => (
                  <div key={sub.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-neutral-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{sub.name} {!sub.active && <Badge>Inactiva</Badge>}</p>
                      <p className="text-xs text-neutral-500">{sub.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => openSubcategory(category, sub)}>Editar</Button>
                      <Button variant="ghost" onClick={() => setConfirmAction({ type: 'toggle', item: sub, isSubcategory: true })}>{sub.active ? 'Desactivar' : 'Activar'}</Button>
                      <Button variant="danger" onClick={() => setConfirmAction({ type: 'delete', item: sub, isSubcategory: true })}>Eliminar</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={Boolean(editing)} title={subParent ? 'Subcategoria' : 'Categoria'} onClose={() => { setEditing(null); setSubParent(null); }}>
        <form className="grid gap-4" onSubmit={form.handleSubmit(save)}>
          <FormInput register={form.register} name="name" label="Nombre" error={form.formState.errors.name} />
          <FormTextarea register={form.register} name="description" label="Descripcion" error={form.formState.errors.description} />
          <Button type="submit" isLoading={isSaving}>Guardar</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.type === 'delete' ? 'Eliminar registro' : `${confirmAction?.item?.active ? 'Desactivar' : 'Activar'} registro`}
        message={confirmAction?.type === 'delete'
          ? `Confirma que deseas eliminar ${confirmAction?.item?.name}. Si ya tiene informacion relacionada, el sistema lo bloqueara para proteger el historial.`
          : `Confirma que deseas ${confirmAction?.item?.active ? 'desactivar' : 'activar'} ${confirmAction?.item?.name}.`}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmedAction}
        isLoading={isConfirming}
      />
    </div>
  );
};

export default Categorias;
